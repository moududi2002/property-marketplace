// 📍 /apps/api/src/modules/auth/interfaces/jwt-payload.interface.ts

import type { UserRole } from "@prisma/client";

export interface JwtAccessPayload {
  sub: string;        // user id
  role: UserRole;
  type: "access";
}

export interface JwtRefreshPayload {
  sub: string;        // user id
  sid: string;        // session id
  type: "refresh";
}