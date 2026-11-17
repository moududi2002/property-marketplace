// 📍 /apps/api/src/modules/auth/guards/jwt-refresh.guard.ts
//
// Used ONLY by /auth/refresh. Validates the refresh_token cookie.

import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtRefreshGuard extends AuthGuard("jwt-refresh") {}