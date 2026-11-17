// 📍 /apps/api/src/modules/admin/dto/update-user-status.dto.ts
//
// SUSPEND / ACTIVATE. A reason is required when suspending so the
// audit trail is meaningful.

import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const updateUserStatusSchema = z
  .object({
    status: z.enum(["ACTIVE", "SUSPENDED"]),
    reason: z.string().trim().max(1000).optional(),
  })
  .refine((d) => d.status !== "SUSPENDED" || (d.reason && d.reason.length >= 5), {
    message: "Reason is required when suspending a user",
    path: ["reason"],
  });

export class UpdateUserStatusDto extends createZodDto(updateUserStatusSchema) {}