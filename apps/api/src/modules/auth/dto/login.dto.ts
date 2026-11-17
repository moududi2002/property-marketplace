// 📍 /apps/api/src/modules/auth/dto/login.dto.ts

import { createZodDto } from "nestjs-zod";
import { loginSchema } from "@property-marketplace/validation";

export class LoginDto extends createZodDto(loginSchema) {}