// 📍 /apps/api/src/modules/admin/admin-dashboard.service.ts

import { Injectable } from "@nestjs/common";
import type { DashboardStats } from "@property-marketplace/shared-types";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(): Promise<DashboardStats> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      propertyCounts,
      totalUsers,
      sellers,
      admins,
      suspended,
      newUsers,
      totalInquiries,
      newInquiries,
      weekInquiries,
    ] = await Promise.all([
      this.prisma.property.groupBy({
        by: ["status"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { role: "USER", deletedAt: null } }),
      this.prisma.user.count({
        where: { role: { in: ["MODERATOR", "SUPER_ADMIN"] }, deletedAt: null },
      }),
      this.prisma.user.count({ where: { status: "SUSPENDED", deletedAt: null } }),
      this.prisma.user.count({
        where: { createdAt: { gte: oneWeekAgo }, deletedAt: null },
      }),
      this.prisma.inquiry.count(),
      this.prisma.inquiry.count({ where: { status: "NEW" } }),
      this.prisma.inquiry.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    ]);

    const byStatus = new Map(propertyCounts.map((g) => [g.status, g._count._all]));
    const get = (s: string): number => byStatus.get(s as never) ?? 0;

    return {
      properties: {
        total: Array.from(byStatus.values()).reduce((a, b) => a + b, 0),
        draft: get("DRAFT"),
        pending: get("PENDING_REVIEW") + get("UNDER_REVIEW"),
        approved: get("APPROVED"),
        published: get("PUBLISHED"),
        rejected: get("REJECTED"),
        archived: get("ARCHIVED"),
        sold: get("SOLD"),
        rented: get("RENTED"),
      },
      users: {
        total: totalUsers,
        sellers,
        admins,
        suspended,
        newThisWeek: newUsers,
      },
      inquiries: {
        total: totalInquiries,
        newCount: newInquiries,
        thisWeek: weekInquiries,
      },
    };
  }
}