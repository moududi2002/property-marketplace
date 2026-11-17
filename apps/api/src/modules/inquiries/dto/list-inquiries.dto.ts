// 📍 /apps/api/src/modules/inquiries/dto/list-inquiries.dto.ts

import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const listInquiriesSchema = z.object({
  status: z
    .enum(["NEW", "CONTACTED", "FOLLOW_UP", "CLOSED", "INVALID"])
    .optional(),
  propertyId: z.string().min(1).optional(),
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class ListInquiriesDto extends createZodDto(listInquiriesSchema) {}