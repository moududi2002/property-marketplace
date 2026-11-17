// 📍 /apps/api/src/modules/auth/guards/roles.guard.ts
//
// Runs AFTER JwtAuthGuard. If the route has @Roles(...), the
// authenticated user's role must match one of them.
// Routes without @Roles() are allowed for any authenticated user.

import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@prisma/client";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthUser } from "../interfaces/auth-user.interface";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Public routes skip role checks
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;
    if (!user) return false;

    return requiredRoles.includes(user.role);
  }
}