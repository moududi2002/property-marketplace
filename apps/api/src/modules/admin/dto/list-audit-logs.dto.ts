// 📍 /apps/api/src/modules/admin/dto/list-audit-logs.dto.ts

import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const listAuditLogsSchema = z.object({
  actorId: z.string().min(1).optional(),
  entityType: z.string().min(1).max(50).optional(),
  entityId: z.string().min(1).optional(),
  action: z.string().min(1).max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class ListAuditLogsDto extends createZodDto(listAuditLogsSchema) {}