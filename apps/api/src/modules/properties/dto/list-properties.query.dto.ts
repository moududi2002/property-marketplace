// 📍 /apps/api/src/modules/properties/dto/list-properties.query.dto.ts

import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const propertyStatusEnum = z.enum([
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
]);

export const listPropertiesQuerySchema = z.object({
  status: propertyStatusEnum.optional(),
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class ListPropertiesQueryDto extends createZodDto(listPropertiesQuerySchema) {}