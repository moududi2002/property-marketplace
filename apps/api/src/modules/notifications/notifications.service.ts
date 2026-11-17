// 📍 /apps/api/src/modules/notifications/notifications.service.ts
//
// DB layer for notifications.
//   • create()            → insert + emit via gateway
//   • list() / unreadCount() / markRead() / markAllRead()
//   • notifyAdmins()      → fan-out to every moderator/super_admin
//
// Never trust the client to mark things read — always filter by userId.

import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { NotificationType } from "@prisma/client";
import type {
  NotificationItem,
  NotificationUnreadCount,
  PaginatedResponse,
} from "@property-marketplace/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import type { ListNotificationsDto } from "./dto/list-notifications.dto";
import { NotificationsGateway } from "./notifications.gateway";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  // ────────────────────────────────────────────────────────
  // CREATE (single user)
  // ────────────────────────────────────────────────────────
  async create(input: CreateNotificationInput): Promise<NotificationItem> {
    const row = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        channel: "IN_APP",
        title: input.title,
        body: input.body,
        link: input.link ?? null,
      },
    });

    const item = this.toItem(row);

    // Real-time push (best-effort; if user is offline, no-op)
    this.gateway.emitToUser(input.userId, item);

    return item;
  }

  // ────────────────────────────────────────────────────────
  // CREATE (fan-out to every admin)
  // ────────────────────────────────────────────────────────
  async notifyAdmins(input: Omit<CreateNotificationInput, "userId">): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: ["MODERATOR", "SUPER_ADMIN"] },
        status: "ACTIVE",
        deletedAt: null,
      },
      select: { id: true },
    });

    if (admins.length === 0) {
      this.logger.warn(`notifyAdmins called but no active admins exist`);
      return;
    }

    await Promise.all(
      admins.map((admin) =>
        this.create({ ...input, userId: admin.id }).catch((err) => {
          this.logger.error(
            `Failed to notify admin ${admin.id}: ${(err as Error).message}`,
          );
        }),
      ),
    );
  }

  // ────────────────────────────────────────────────────────
  // LIST (for the current user)
  // ────────────────────────────────────────────────────────
  async list(
    userId: string,
    query: ListNotificationsDto,
  ): Promise<PaginatedResponse<NotificationItem>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(query.onlyUnread && { isRead: false }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: rows.map((r) => this.toItem(r)),
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

  async unreadCount(userId: string): Promise<NotificationUnreadCount> {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    const row = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: { id: true, isRead: true },
    });
    if (!row) throw new NotFoundException("Notification not found");
    if (row.isRead) return;

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    // Push updated count so the bell badge refreshes everywhere
    const { count } = await this.unreadCount(userId);
    this.gateway.emitUnreadCount(userId, count);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    this.gateway.emitUnreadCount(userId, 0);
  }

  // ────────────────────────────────────────────────────────
  // Internals
  // ────────────────────────────────────────────────────────
  private toItem(r: {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
  }): NotificationItem {
    return {
      id: r.id,
      type: r.type as NotificationItem["type"],
      title: r.title,
      body: r.body,
      link: r.link,
      isRead: r.isRead,
      createdAt: r.createdAt.toISOString(),
    };
  }
}