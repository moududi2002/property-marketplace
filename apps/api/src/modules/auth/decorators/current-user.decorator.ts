// 📍 /apps/api/src/modules/auth/decorators/current-user.decorator.ts
//
// Extracts request.user (set by the JWT strategy) as a typed parameter.
//   me(@CurrentUser() user: AuthUser) { ... }

import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);