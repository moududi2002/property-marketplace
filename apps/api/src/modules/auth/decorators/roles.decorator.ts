// 📍 /apps/api/src/modules/auth/decorators/roles.decorator.ts
//
// Restricts a route to specific roles.
// Example: @Roles("SUPER_ADMIN", "MODERATOR")

import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "@prisma/client";

export const ROLES_KEY = "roles";
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);