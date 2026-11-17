// 📍 /apps/api/src/modules/admin/dto/moderate.dto.ts
//
// Separate DTOs per action so each has its own required fields.

import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const approveSchema = z.object({
  note: z.string().trim().max(1000).optional(),
  publishImmediately: z.boolean().default(false),
});
export class ApprovePropertyDto extends createZodDto(approveSchema) {}

export const rejectSchema = z.object({
  reason: z.string().trim().min(5, "Rejection reason is required").max(1000),
});
export class RejectPropertyDto extends createZodDto(rejectSchema) {}

export const requestChangesSchema = z.object({
  note: z.string().trim().min(5, "Please describe the requested changes").max(1000),
});
export class RequestChangesDto extends createZodDto(requestChangesSchema) {}

export const archiveSchema = z.object({
  note: z.string().trim().max(1000).optional(),
});
export class ArchivePropertyDto extends createZodDto(archiveSchema) {}