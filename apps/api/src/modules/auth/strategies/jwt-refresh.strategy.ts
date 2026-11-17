// 📍 /apps/api/src/modules/auth/strategies/jwt-refresh.strategy.ts
//
// Validates long-lived refresh tokens (7d). Only the /auth/refresh
// endpoint uses this. Token comes from `refresh_token` cookie ONLY
// (never exposed to JS).

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import type { Request } from "express";
import { Strategy } from "passport-jwt";
import type { AuthRefreshUser } from "../interfaces/auth-user.interface";
import type { JwtRefreshPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: (req: Request) =>
        (req?.cookies?.refresh_token as string) ?? null,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtRefreshPayload): Promise<AuthRefreshUser> {
    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Invalid token type");
    }
    const refreshToken = req?.cookies?.refresh_token as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token missing");
    }
    return {
      id: payload.sub,
      role: "USER", // not used for refresh; filled in from DB later
      sessionId: payload.sid,
      refreshToken,
    };
  }
}