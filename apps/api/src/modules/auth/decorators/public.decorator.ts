// 📍 /apps/api/src/modules/auth/decorators/public.decorator.ts
//
// Marks a route (or controller) as accessible without authentication.
// JwtAuthGuard checks this before enforcing JWT.

import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);