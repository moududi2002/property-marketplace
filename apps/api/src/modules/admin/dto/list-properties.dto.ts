// 📍 /apps/api/src/modules/admin/dto/list-properties.dto.ts

import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const listAdminPropertiesSchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "PENDING_REVIEW",
      "UNDER_REVIEW",
      "CHANGES_REQUESTED",
      "APPROVED",
      "PUBLISHED",
      "REJECTED",
      "ARCHIVED",
      "SOLD",
      "RENTED",
    ])
    .optional(),
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class ListAdminPropertiesDto extends createZodDto(listAdminPropertiesSchema) {}