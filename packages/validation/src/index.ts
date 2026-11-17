// 📍 /packages/validation/src/index.ts

/**
 * Barrel export — সব Zod Schema এক জায়গা থেকে।
 *
 * Usage (Frontend form):
 *   import { registerSchema } from "@property-marketplace/validation";
 *   const form = useForm({ resolver: zodResolver(registerSchema) });
 *
 * Usage (Backend DTO):
 *   import { registerSchema } from "@property-marketplace/validation";
 *   const dto = registerSchema.parse(body);
 */

export * from "./common";
export * from "./auth";
export * from "./property";
export * from "./inquiry";