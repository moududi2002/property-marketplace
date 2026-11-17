// 📍 /apps/api/src/modules/auth/dto/register.dto.ts

import { createZodDto } from "nestjs-zod";
import { registerSchema } from "@property-marketplace/validation";

/**
 * Same Zod schema used by the frontend form.
 * Validated on both ends — never trust client input.
 */
export class RegisterDto extends createZodDto(registerSchema) {}