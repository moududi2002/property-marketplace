// 📍 /apps/api/src/common/audit/audit.service.ts
//
// Global audit logger. Every admin mutation should call record().
// Automatically computes which fields changed between before/after.

import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../modules/prisma/prisma.service";

export interface AuditEntry {
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    const changedFields = this.diffFields(entry.before, entry.after);

    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId,
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action,
          before: entry.before ?? undefined,
          after: entry.after ?? undefined,
          changedFields,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent?.slice(0, 500) ?? null,
        },
      });
    } catch (err) {
      // Never let audit failure break the main operation
      this.logger.error(`Audit log failed: ${(err as Error).message}`);
    }
  }

  private diffFields(
    before?: Record<string, unknown> | null,
    after?: Record<string, unknown> | null,
  ): string[] {
    if (!before || !after) return [];
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const changed: string[] = [];
    for (const key of keys) {
      const b = before[key];
      const a = after[key];
      if (JSON.stringify(b) !== JSON.stringify(a)) changed.push(key);
    }
    return changed;
  }
}