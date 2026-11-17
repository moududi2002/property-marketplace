// 📍 /apps/api/src/modules/inquiries/dto/update-inquiry.dto.ts

import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const updateInquiryStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "FOLLOW_UP", "CLOSED", "INVALID"]),
  note: z.string().trim().max(2000).optional(),
  followUpDate: z.string().datetime().optional(),
});

export class UpdateInquiryStatusDto extends createZodDto(
  updateInquiryStatusSchema,
) {}

export const addInquiryNoteSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty").max(2000),
});

export class AddInquiryNoteDto extends createZodDto(addInquiryNoteSchema) {}