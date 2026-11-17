// 📍 /apps/api/src/modules/auth/auth.controller.ts
//
// All routes are cookie-based. Controller sets/clears HttpOnly cookies
// and returns the public user object. Tokens never touch the JSON body.

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService, type AuthResult, type IssuedTokens } from "./auth.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import { LoginDto, RegisterDto } from "./dto";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { UseGuards } from "@nestjs/common";
import type { AuthRefreshUser, AuthUser } from "./interfaces/auth-user.interface";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  // ────────────────────────────────────────────────────────
  // POST /api/v1/auth/register
  // ────────────────────────────────────────────────────────
  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a new user" })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthResult["user"] }> {
    const { user, tokens } = await this.auth.register(
      dto,
      req.headers["user-agent"],
      this.clientIp(req),
    );
    this.setAuthCookies(res, tokens);
    return { user };
  }

  // ────────────────────────────────────────────────────────
  // POST /api/v1/auth/login
  // ────────────────────────────────────────────────────────
  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with phone or email" })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthResult["user"] }> {
    const { user, tokens } = await this.auth.login(
      dto,
      req.headers["user-agent"],
      this.clientIp(req),
    );
    this.setAuthCookies(res, tokens);
    return { user };
  }

  // ────────────────────────────────────────────────────────
  // POST /api/v1/auth/refresh
  // ────────────────────────────────────────────────────────
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotate refresh token and issue new access token" })
  async refresh(
    @CurrentUser() current: AuthRefreshUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthResult["user"] }> {
    const { user, tokens } = await this.auth.refresh(
      current.id,
      current.sessionId,
      current.refreshToken,
      req.headers["user-agent"],
      this.clientIp(req),
    );
    this.setAuthCookies(res, tokens);
    return { user };
  }

  // ────────────────────────────────────────────────────────
  // POST /api/v1/auth/logout
  // ────────────────────────────────────────────────────────
  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Log out of the current session" })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    // We can't trust the body here — just delete the session whose cookie we have.
    const refresh = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (refresh) {
      try {
        // Decode (not verify) to get sid — the session will be deleted anyway.
        const decoded = this.decodeSessionId(refresh);
        if (decoded) await this.auth.logout(decoded);
      } catch {
        // Ignore — clear cookies regardless
      }
    }
    this.clearAuthCookies(res);
  }

  // ────────────────────────────────────────────────────────
  // POST /api/v1/auth/logout-all
  // ────────────────────────────────────────────────────────
  @Post("logout-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Log out from every device" })
  async logoutAll(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logoutAll(user.id);
    this.clearAuthCookies(res);
  }

  // ────────────────────────────────────────────────────────
  // GET /api/v1/auth/me
  // ────────────────────────────────────────────────────────
  @Get("me")
  @ApiOperation({ summary: "Get the currently authenticated user" })
  async me(@CurrentUser() user: AuthUser): Promise<{ user: AuthResult["user"] }> {
    return { user: await this.auth.me(user.id) };
  }

  // ────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────

  private setAuthCookies(res: Response, tokens: IssuedTokens): void {
    const secure = this.config.get<boolean>("COOKIE_SECURE") ?? false;
    const domain = this.config.get<string>("COOKIE_DOMAIN");

    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      expires: tokens.accessExpiresAt,
      ...(domain && domain !== "localhost" ? { domain } : {}),
    });

    // Refresh cookie is scoped to auth endpoints so it's sent only when needed.
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/api/v1/auth",
      expires: tokens.refreshExpiresAt,
      ...(domain && domain !== "localhost" ? { domain } : {}),
    });
  }

  private clearAuthCookies(res: Response): void {
    const domain = this.config.get<string>("COOKIE_DOMAIN");
    const domainOpt = domain && domain !== "localhost" ? { domain } : {};

    res.clearCookie(ACCESS_COOKIE, { path: "/", ...domainOpt });
    res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth", ...domainOpt });
  }

  private clientIp(req: Request): string | undefined {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim();
    return req.ip;
  }

  /** Decode a JWT WITHOUT verifying — used only to extract `sid` on logout. */
  private decodeSessionId(token: string): string | undefined {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return undefined;
      const payload = JSON.parse(
        Buffer.from(parts[1] as string, "base64url").toString("utf8"),
      ) as { sid?: string };
      return payload.sid;
    } catch {
      return undefined;
    }
  }
}