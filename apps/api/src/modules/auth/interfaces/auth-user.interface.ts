// 📍 /apps/api/src/modules/auth/interfaces/auth-user.interface.ts
//
// Shape of request.user after JwtAccessStrategy.populateUser().

import type { UserRole } from "@prisma/client";

export interface AuthUser {
  id: string;
  role: UserRole;
}

/**
 * Extra fields present after JwtRefreshStrategy validates.
 * Only used by /auth/refresh.
 */
export interface AuthRefreshUser extends AuthUser {
  sessionId: string;
  refreshToken: string;
}