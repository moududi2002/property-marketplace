// 📍 /apps/api/src/modules/auth/strategies/jwt-access.strategy.ts
//
// Validates short-lived access tokens (15m).
// Token is accepted from EITHER:
//   1. HttpOnly `access_token` cookie  (browser)
//   2. `Authorization: Bearer <token>` (API clients)

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import type { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { AuthUser } from "../interfaces/auth-user.interface";
import type { JwtAccessPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, "jwt-access") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => (req?.cookies?.access_token as string) ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthUser> {
    if (payload.type !== "access") {
      throw new UnauthorizedException("Invalid token type");
    }
    return { id: payload.sub, role: payload.role };
  }
}