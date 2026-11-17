// 📍 /apps/api/src/modules/admin/dto/list-users.dto.ts

import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const listAdminUsersSchema = z.object({
  role: z.enum(["USER", "MODERATOR", "SUPER_ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]).optional(),
  q: z.string().trim().max(200).optional(),
  sort: z.enum(["newest", "oldest", "name"]).default("newest").optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class ListAdminUsersDto extends createZodDto(listAdminUsersSchema) {}