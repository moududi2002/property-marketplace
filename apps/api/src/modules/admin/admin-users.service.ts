// 📍 /apps/api/src/modules/admin/admin-users.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  AdminUserDetail,
  AdminUserListItem,
  PaginatedResponse,
} from "@property-marketplace/shared-types";
import { AuditService } from "../../common/audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import type { ListAdminUsersDto, UpdateUserStatusDto } from "./dto";

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ────────────────────────────────────────────────────────
  // LIST
  // ────────────────────────────────────────────────────────
  async list(query: ListAdminUsersDto): Promise<PaginatedResponse<AdminUserListItem>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.role && { role: query.role }),
      ...(query.status && { status: query.status }),
      ...(query.q && {
        OR: [
          { name: { contains: query.q, mode: "insensitive" } },
          { email: { contains: query.q, mode: "insensitive" } },
          { phone: { contains: query.q } },
        ],
      }),
    };

    const orderBy: Prisma.UserOrderByWithRelationInput =
      query.sort === "oldest"
        ? { createdAt: "asc" }
        : query.sort === "name"
          ? { name: "asc" }
          : { createdAt: "desc" };

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { properties: { where: { deletedAt: null } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        propertyCount: u._count.properties,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
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

  // ────────────────────────────────────────────────────────
  // DETAIL
  // ────────────────────────────────────────────────────────
  async detail(userId: string): Promise<AdminUserDetail> {
    const u = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        _count: { select: { properties: { where: { deletedAt: null } } } },
        properties: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, title: true, status: true, createdAt: true },
        },
        inquiriesSubmitted: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            status: true,
            createdAt: true,
            property: { select: { title: true } },
          },
        },
      },
    });

    if (!u) throw new NotFoundException("User not found");

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      phoneVerified: u.phoneVerified,
      bio: u.bio,
      city: u.city,
      propertyCount: u._count.properties,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      properties: u.properties.map((p) => ({
        id: p.id,
        title: p.title || "(Untitled)",
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      })),
      recentInquiries: u.inquiriesSubmitted.map((i) => ({
        id: i.id,
        propertyTitle: i.property.title || "(Untitled)",
        status: i.status,
        createdAt: i.createdAt.toISOString(),
      })),
    };
  }

  // ────────────────────────────────────────────────────────
  // UPDATE STATUS (SUSPEND / ACTIVATE)
  // ────────────────────────────────────────────────────────
  async updateStatus(
    actorId: string,
    userId: string,
    dto: UpdateUserStatusDto,
    meta: { ip?: string; ua?: string } = {},
  ): Promise<AdminUserDetail> {
    const target = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, role: true, status: true, name: true },
    });
    if (!target) throw new NotFoundException("User not found");

    // Cannot suspend another admin — extra safety layer
    if (
      dto.status === "SUSPENDED" &&
      (target.role === "SUPER_ADMIN" || target.role === "MODERATOR")
    ) {
      throw new ForbiddenException("Cannot suspend another admin");
    }

    // Cannot suspend self
    if (dto.status === "SUSPENDED" && target.id === actorId) {
      throw new ForbiddenException("Cannot suspend your own account");
    }

    if (target.status === dto.status) {
      throw new BadRequestException(`User is already ${dto.status.toLowerCase()}`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: dto.status },
    });

    await this.audit.record({
      actorId,
      entityType: "User",
      entityId: userId,
      action: dto.status === "SUSPENDED" ? "SUSPEND" : "ACTIVATE",
      before: { status: target.status },
      after: { status: dto.status, reason: dto.reason ?? null },
      ipAddress: meta.ip,
      userAgent: meta.ua,
    });

    this.logger.log(`User ${target.name} (${userId}) ${dto.status} by ${actorId}`);
    return this.detail(userId);
  }
}