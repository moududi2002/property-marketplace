// 📍 /apps/api/src/modules/notifications/dto/list-notifications.dto.ts

import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const listNotificationsSchema = z.object({
  onlyUnread: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === "true"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class ListNotificationsDto extends createZodDto(listNotificationsSchema) {}