// 📍 /apps/api/src/modules/admin/admin-audit.service.ts
//
// Read-only viewer over the audit_logs table (write happens via
// AuditService in common/audit).

import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  AdminAuditLogEntry,
  PaginatedResponse,
} from "@property-marketplace/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import type { ListAuditLogsDto } from "./dto";

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListAuditLogsDto): Promise<PaginatedResponse<AdminAuditLogEntry>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(query.actorId && { actorId: query.actorId }),
      ...(query.entityType && { entityType: query.entityType }),
      ...(query.entityId && { entityId: query.entityId }),
      ...(query.action && { action: query.action }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { actor: { select: { name: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: rows.map((r) => ({
        id: r.id,
        actorId: r.actorId,
        actorName: r.actor.name,
        entityType: r.entityType,
        entityId: r.entityId,
        action: r.action,
        changedFields: r.changedFields,
        before: (r.before as Record<string, unknown> | null) ?? null,
        after: (r.after as Record<string, unknown> | null) ?? null,
        ipAddress: r.ipAddress,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async detail(id: string): Promise<AdminAuditLogEntry> {
    const r = await this.prisma.auditLog.findUnique({
      where: { id },
      include: { actor: { select: { name: true } } },
    });
    if (!r) throw new NotFoundException("Audit log entry not found");

    return {
      id: r.id,
      actorId: r.actorId,
      actorName: r.actor.name,
      entityType: r.entityType,
      entityId: r.entityId,
      action: r.action,
      changedFields: r.changedFields,
      before: (r.before as Record<string, unknown> | null) ?? null,
      after: (r.after as Record<string, unknown> | null) ?? null,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt.toISOString(),
    };
  }
}