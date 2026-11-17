// 📍 /apps/api/src/modules/admin/admin-properties.service.ts
//
// Core moderation engine. Every state-changing method:
//   1. Validates the CURRENT status against a whitelist
//   2. Writes a PropertyModerationLog row (timeline)
//   3. Writes an AuditLog row (compliance)
//   4. Returns the freshly-loaded admin view

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { PropertyStatus, Prisma } from "@prisma/client";
import type {
  AdminPropertyListItem,
  PaginatedResponse,
  PropertyAdminView,
} from "@property-marketplace/shared-types";
import { AuditService } from "../../common/audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import type {
  ApprovePropertyDto,
  ArchivePropertyDto,
  ListAdminPropertiesDto,
  RejectPropertyDto,
  RequestChangesDto,
  UpdateAdminPropertyDto,
} from "./dto";

import { NotificationsService } from "../notifications/notifications.service";


/** Statuses from which an admin can approve/reject/request changes. */
const REVIEWABLE: ReadonlySet<PropertyStatus> = new Set([
  "PENDING_REVIEW",
  "UNDER_REVIEW",
]);

const PUBLISHABLE: ReadonlySet<PropertyStatus> = new Set(["APPROVED"]);

@Injectable()
export class AdminPropertiesService {
  private readonly logger = new Logger(AdminPropertiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  // ────────────────────────────────────────────────────────
  // LIST
  // ────────────────────────────────────────────────────────
  async list(
    query: ListAdminPropertiesDto,
  ): Promise<PaginatedResponse<AdminPropertyListItem>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.q && {
        OR: [
          { title: { contains: query.q, mode: "insensitive" } },
          { areaLocality: { contains: query.q, mode: "insensitive" } },
          { seller: { name: { contains: query.q, mode: "insensitive" } } },
          { seller: { phone: { contains: query.q } } },
        ],
      }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
        skip,
        take: limit,
        include: {
          seller: { select: { name: true, phone: true } },
          district: { select: { nameEn: true } },
          category: { select: { nameEn: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: rows.map((r) => ({
        id: r.id,
        title: r.title || "(Untitled)",
        slug: r.slug,
        status: r.status,
        purpose: r.purpose,
        price: Number(r.price),
        sellerName: r.seller.name,
        sellerPhone: r.seller.phone,
        districtName: r.district.nameEn,
        categoryName: r.category.nameEn,
        submittedAt: r.submittedAt?.toISOString() ?? null,
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

  async pending(): Promise<PaginatedResponse<AdminPropertyListItem>> {
    return this.list({
      status: "PENDING_REVIEW",
      page: 1,
      limit: 50,
    } as ListAdminPropertiesDto);
  }

  // ────────────────────────────────────────────────────────
  // DETAIL
  // ────────────────────────────────────────────────────────
  async detail(id: string): Promise<PropertyAdminView> {
    const p = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        category: { select: { nameEn: true } },
        district: { select: { nameEn: true } },
        images: { orderBy: { sortOrder: "asc" } },
        moderationLogs: {
          orderBy: { createdAt: "desc" },
          include: { actor: { select: { name: true } } },
        },
      },
    });
    if (!p) throw new NotFoundException("Property not found");

    return {
      id: p.id,
      slug: p.slug,
      title: p.title || "(Untitled)",
      status: p.status,
      purpose: p.purpose,
      price: Number(p.price),
      coverImageUrl: p.images.find((img) => img.isCover)?.url ?? p.images[0]?.url ?? null,
      categoryName: p.category.nameEn,
      districtName: p.district.nameEn,
      createdAt: p.createdAt.toISOString(),
      submittedAt: p.submittedAt?.toISOString() ?? null,
      publishedAt: p.publishedAt?.toISOString() ?? null,
      rejectionReason: p.rejectionReason,
      changeRequestNote: p.changeRequestNote,

      seller: {
        id: p.seller.id,
        name: p.seller.name,
        email: p.seller.email,
        phone: p.seller.phone,
        registeredAt: p.seller.createdAt.toISOString(),
      },
      images: p.images.map((img) => ({
        id: img.id,
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        alt: img.alt,
        isCover: img.isCover,
        sortOrder: img.sortOrder,
      })),
      moderationHistory: p.moderationLogs.map((log) => ({
        id: log.id,
        action: log.action,
        actorId: log.actorId,
        actorName: log.actor.name,
        note: log.note,
        createdAt: log.createdAt.toISOString(),
      })),
      sellerNotes: p.sellerNotes,
      internalNotes: p.internalNotes,
    };
  }

  // ────────────────────────────────────────────────────────
  // APPROVE (optionally publish immediately)
  // ────────────────────────────────────────────────────────
  async approve(
    actorId: string,
    propertyId: string,
    dto: ApprovePropertyDto,
    meta: { ip?: string; ua?: string } = {},
  ): Promise<PropertyAdminView> {
    const p = await this.assertStatus(propertyId, REVIEWABLE);

    const finalStatus: PropertyStatus = dto.publishImmediately
      ? "PUBLISHED"
      : "APPROVED";

    await this.prisma.$transaction([
      this.prisma.property.update({
        where: { id: propertyId },
        data: {
          status: finalStatus,
          rejectionReason: null,
          changeRequestNote: null,
          ...(dto.publishImmediately && { publishedAt: new Date() }),
        },
      }),
      this.prisma.propertyModerationLog.create({
        data: {
          propertyId,
          actorId,
          action: "APPROVED",
          note: dto.note ?? null,
          metadata: { newStatus: finalStatus },
        },
      }),
      ...(dto.publishImmediately
        ? [
            this.prisma.propertyModerationLog.create({
              data: {
                propertyId,
                actorId,
                action: "PUBLISHED",
                note: null,
                metadata: { newStatus: "PUBLISHED" },
              },
            }),
          ]
        : []),
    ]);

    await this.audit.record({
      actorId,
      entityType: "Property",
      entityId: propertyId,
      action: dto.publishImmediately ? "APPROVE_AND_PUBLISH" : "APPROVE",
      before: { status: p.status },
      after: { status: finalStatus, note: dto.note ?? null },
      ipAddress: meta.ip,
      userAgent: meta.ua,
    });

    this.logger.log(
      `Property ${propertyId} ${dto.publishImmediately ? "approved & published" : "approved"} by ${actorId}`,
    );

    const sellerId = await this.getSellerId(propertyId);
    void this.notifications
      .create({
        userId: sellerId,
        type: dto.publishImmediately ? "PROPERTY_PUBLISHED" : "PROPERTY_APPROVED",
        title: dto.publishImmediately ? "Your property is now live" : "Your property was approved",
        body: dto.publishImmediately
          ? "Your listing has been published and is visible to buyers."
          : "Your listing was approved. It will be published shortly.",
        link: `/account/properties/${propertyId}`,
      })
      .catch(() => undefined);

    return this.detail(propertyId);
  }

  // ────────────────────────────────────────────────────────
  // REJECT
  // ────────────────────────────────────────────────────────
  async reject(
    actorId: string,
    propertyId: string,
    dto: RejectPropertyDto,
    meta: { ip?: string; ua?: string } = {},
  ): Promise<PropertyAdminView> {
    const p = await this.assertStatus(propertyId, REVIEWABLE);

    await this.prisma.$transaction([
      this.prisma.property.update({
        where: { id: propertyId },
        data: { status: "REJECTED", rejectionReason: dto.reason },
      }),
      this.prisma.propertyModerationLog.create({
        data: {
          propertyId,
          actorId,
          action: "REJECTED",
          note: dto.reason,
          metadata: { newStatus: "REJECTED" },
        },
      }),
    ]);

    await this.audit.record({
      actorId,
      entityType: "Property",
      entityId: propertyId,
      action: "REJECT",
      before: { status: p.status },
      after: { status: "REJECTED", reason: dto.reason },
      ipAddress: meta.ip,
      userAgent: meta.ua,
    });


    const sellerId = await this.getSellerId(propertyId);
    void this.notifications
      .create({
        userId: sellerId,
        type: "PROPERTY_REJECTED",
        title: "Your property was rejected",
        body: dto.reason,
        link: `/account/properties/${propertyId}`,
      })
      .catch(() => undefined);

    return this.detail(propertyId);
  }

  // ────────────────────────────────────────────────────────
  // REQUEST CHANGES
  // ────────────────────────────────────────────────────────
  async requestChanges(
    actorId: string,
    propertyId: string,
    dto: RequestChangesDto,
    meta: { ip?: string; ua?: string } = {},
  ): Promise<PropertyAdminView> {
    const p = await this.assertStatus(propertyId, REVIEWABLE);

    await this.prisma.$transaction([
      this.prisma.property.update({
        where: { id: propertyId },
        data: { status: "CHANGES_REQUESTED", changeRequestNote: dto.note },
      }),
      this.prisma.propertyModerationLog.create({
        data: {
          propertyId,
          actorId,
          action: "CHANGES_REQUESTED",
          note: dto.note,
          metadata: { newStatus: "CHANGES_REQUESTED" },
        },
      }),
    ]);

    await this.audit.record({
      actorId,
      entityType: "Property",
      entityId: propertyId,
      action: "REQUEST_CHANGES",
      before: { status: p.status },
      after: { status: "CHANGES_REQUESTED", note: dto.note },
      ipAddress: meta.ip,
      userAgent: meta.ua,
    });


    
    const sellerId = await this.getSellerId(propertyId);
    void this.notifications
      .create({
        userId: sellerId,
        type: "PROPERTY_CHANGES_REQUESTED",
        title: "Changes requested on your property",
        body: dto.note,
        link: `/account/properties/${propertyId}`,
      })
      .catch(() => undefined);

    return this.detail(propertyId);
  }

  // ────────────────────────────────────────────────────────
  // PUBLISH (APPROVED → PUBLISHED)
  // ────────────────────────────────────────────────────────
  async publish(
    actorId: string,
    propertyId: string,
    meta: { ip?: string; ua?: string } = {},
  ): Promise<PropertyAdminView> {
    const p = await this.assertStatus(propertyId, PUBLISHABLE);

    await this.prisma.$transaction([
      this.prisma.property.update({
        where: { id: propertyId },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      }),
      this.prisma.propertyModerationLog.create({
        data: {
          propertyId,
          actorId,
          action: "PUBLISHED",
          metadata: { newStatus: "PUBLISHED" },
        },
      }),
    ]);

    await this.audit.record({
      actorId,
      entityType: "Property",
      entityId: propertyId,
      action: "PUBLISH",
      before: { status: p.status },
      after: { status: "PUBLISHED" },
      ipAddress: meta.ip,
      userAgent: meta.ua,
    });

    return this.detail(propertyId);
  }




  private async getSellerId(propertyId: string): Promise<string> {
    const p = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { sellerId: true },
    });
    if (!p) throw new NotFoundException("Property not found");
    return p.sellerId;
  }

  // ────────────────────────────────────────────────────────
  // ARCHIVE
  // ────────────────────────────────────────────────────────
  async archive(
    actorId: string,
    propertyId: string,
    dto: ArchivePropertyDto,
    meta: { ip?: string; ua?: string } = {},
  ): Promise<PropertyAdminView> {
    const p = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { status: true },
    });
    if (!p) throw new NotFoundException("Property not found");
    if (p.status === "ARCHIVED") {
      throw new BadRequestException("Property is already archived");
    }

    await this.prisma.$transaction([
      this.prisma.property.update({
        where: { id: propertyId },
        data: { status: "ARCHIVED" },
      }),
      this.prisma.propertyModerationLog.create({
        data: {
          propertyId,
          actorId,
          action: "ARCHIVED",
          note: dto.note ?? null,
          metadata: { newStatus: "ARCHIVED", fromStatus: p.status },
        },
      }),
    ]);

    await this.audit.record({
      actorId,
      entityType: "Property",
      entityId: propertyId,
      action: "ARCHIVE",
      before: { status: p.status },
      after: { status: "ARCHIVED", note: dto.note ?? null },
      ipAddress: meta.ip,
      userAgent: meta.ua,
    });

    return this.detail(propertyId);
  }

  // ────────────────────────────────────────────────────────
  // EDIT
  // ────────────────────────────────────────────────────────
  async update(
    actorId: string,
    propertyId: string,
    dto: UpdateAdminPropertyDto,
    meta: { ip?: string; ua?: string } = {},
  ): Promise<PropertyAdminView> {
    const before = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });
    if (!before) throw new NotFoundException("Property not found");

    const data: Prisma.PropertyUpdateInput = {};
    const assign = <K extends keyof UpdateAdminPropertyDto>(key: K): void => {
      const v = dto[key];
      if (v === undefined) return;
      (data as Record<string, unknown>)[key] = v;
    };
    (
      [
        "title",
        "description",
        "price",
        "priceUnit",
        "isNegotiable",
        "landSize",
        "landSizeUnit",
        "buildingSizeSqft",
        "bedrooms",
        "bathrooms",
        "floors",
        "condition",
        "ownershipType",
        "areaLocality",
        "fullAddress",
        "internalNotes",
        "isFeatured",
      ] as (keyof UpdateAdminPropertyDto)[]
    ).forEach(assign);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("No fields to update");
    }

    await this.prisma.$transaction([
      this.prisma.property.update({ where: { id: propertyId }, data }),
      this.prisma.propertyModerationLog.create({
        data: {
          propertyId,
          actorId,
          action: "EDITED",
          note: null,
          metadata: { changedFields: Object.keys(data) },
        },
      }),
    ]);

    // Build before/after for audit — only changed fields
    const beforeSnapshot: Record<string, unknown> = {};
    const afterSnapshot: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      beforeSnapshot[key] = (before as Record<string, unknown>)[key];
      afterSnapshot[key] = (data as Record<string, unknown>)[key];
    }

    await this.audit.record({
      actorId,
      entityType: "Property",
      entityId: propertyId,
      action: "UPDATE",
      before: beforeSnapshot,
      after: afterSnapshot,
      ipAddress: meta.ip,
      userAgent: meta.ua,
    });

    return this.detail(propertyId);
  }

  // ────────────────────────────────────────────────────────
  // Internals
  // ────────────────────────────────────────────────────────
  private async assertStatus(
    propertyId: string,
    allowed: ReadonlySet<PropertyStatus>,
  ): Promise<{ status: PropertyStatus }> {
    const p = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { status: true },
    });
    if (!p) throw new NotFoundException("Property not found");
    if (!allowed.has(p.status)) {
      throw new BadRequestException(
        `Cannot perform this action on a property in status ${p.status}`,
      );
    }
    return p;
  }
}