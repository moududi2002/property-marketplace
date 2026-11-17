// 📍 /apps/api/src/modules/inquiries/inquiries.service.ts
//
// Business logic for buyer inquiries.
//   • Public submit — no auth, rate-limited at controller
//   • Dedup — same phone + property within 5 min → 409
//   • Admin list / detail / status / notes

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  InquiryAdminView,
  InquiryListItem,
  InquiryPublic,
  PaginatedResponse,
} from "@property-marketplace/shared-types";
import { AuditService } from "../../common/audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import type {
  AddInquiryNoteDto,
  CreateInquiryDto,
  ListInquiriesDto,
  UpdateInquiryStatusDto,
} from "./dto";

import { NotificationsService } from "../notifications/notifications.service";


const DEDUP_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
export class InquiriesService {
  private readonly logger = new Logger(InquiriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService, 
  ) {}

  // ────────────────────────────────────────────────────────
  // PUBLIC SUBMIT
  // ────────────────────────────────────────────────────────
  async create(
    dto: CreateInquiryDto,
    buyerId: string | null,
  ): Promise<InquiryPublic> {
    // Property must be live
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, status: "PUBLISHED", deletedAt: null },
      select: { id: true, slug: true, title: true },
    });
    if (!property) {
      throw new NotFoundException("This property is no longer available");
    }

    // Dedup: reject if the same phone already submitted for this property recently
    const recent = await this.prisma.inquiry.findFirst({
      where: {
        propertyId: property.id,
        buyerPhone: dto.buyerPhone,
        createdAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
      },
      select: { id: true },
    });
    if (recent) {
      throw new ConflictException(
        "You have already submitted an inquiry for this property. Please wait a few minutes.",
      );
    }

    const created = await this.prisma.inquiry.create({
      data: {
        propertyId: property.id,
        buyerId: buyerId ?? null,
        buyerName: dto.buyerName.trim(),
        buyerPhone: dto.buyerPhone.trim(),
        buyerEmail: dto.buyerEmail?.trim().toLowerCase() || null,
        message: dto.message?.trim() || null,
        preferredContactTime: dto.preferredContactTime?.trim() || null,
      },
    });

    this.logger.log(
      `Inquiry ${created.id} created for property ${property.id} from ${dto.buyerPhone}`,
    );

    void this.notifications
      .notifyAdmins({
        type: "NEW_INQUIRY_RECEIVED",
        title: "New buyer inquiry",
        body: `${dto.buyerName} is interested in "${property.title}".`,
        link: `/admin/inquiries/${created.id}`,
      })
      .catch((err) =>
        this.logger.error(`Inquiry notify failed: ${(err as Error).message}`),
      );

    return this.toPublic(created, property);
  }

  // ────────────────────────────────────────────────────────
  // ADMIN LIST
  // ────────────────────────────────────────────────────────
  async list(query: ListInquiriesDto): Promise<PaginatedResponse<InquiryListItem>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InquiryWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.propertyId && { propertyId: query.propertyId }),
      ...(query.q && {
        OR: [
          { buyerName: { contains: query.q, mode: "insensitive" } },
          { buyerPhone: { contains: query.q } },
          { buyerEmail: { contains: query.q, mode: "insensitive" } },
          { property: { title: { contains: query.q, mode: "insensitive" } } },
        ],
      }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { property: { select: { title: true } } },
      }),
      this.prisma.inquiry.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: rows.map((r) => ({
        id: r.id,
        propertyId: r.propertyId,
        propertyTitle: r.property.title || "(Untitled)",
        buyerName: r.buyerName,
        buyerPhone: r.buyerPhone,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        followUpDate: r.followUpDate?.toISOString() ?? null,
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
  // ADMIN DETAIL
  // ────────────────────────────────────────────────────────
  async detail(id: string): Promise<InquiryAdminView> {
    const r = await this.prisma.inquiry.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            slug: true,
            title: true,
            seller: { select: { id: true, name: true, phone: true, email: true } },
          },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { name: true } } },
        },
      },
    });
    if (!r) throw new NotFoundException("Inquiry not found");

    return {
      id: r.id,
      propertyId: r.property.id,
      propertySlug: r.property.slug,
      propertyTitle: r.property.title || "(Untitled)",
      buyerName: r.buyerName,
      buyerPhone: r.buyerPhone,
      buyerEmail: r.buyerEmail,
      message: r.message,
      preferredContactTime: r.preferredContactTime,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),

      sellerId: r.property.seller.id,
      sellerName: r.property.seller.name,
      sellerPhone: r.property.seller.phone,
      sellerEmail: r.property.seller.email,

      internalNotes: r.notes.map((n) => ({
        id: n.id,
        authorId: n.authorId,
        authorName: n.author.name,
        body: n.body,
        createdAt: n.createdAt.toISOString(),
      })),
      followUpDate: r.followUpDate?.toISOString() ?? null,
      contactCount: r.contactCount,
    };
  }

  // ────────────────────────────────────────────────────────
  // UPDATE STATUS
  // ────────────────────────────────────────────────────────
  async updateStatus(
    actorId: string,
    id: string,
    dto: UpdateInquiryStatusDto,
    meta: { ip?: string; ua?: string } = {},
  ): Promise<InquiryAdminView> {
    const current = await this.prisma.inquiry.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) throw new NotFoundException("Inquiry not found");

    if (current.status === dto.status && !dto.note && !dto.followUpDate) {
      throw new BadRequestException("Nothing to update");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.inquiry.update({
        where: { id },
        data: {
          status: dto.status,
          ...(dto.followUpDate && { followUpDate: new Date(dto.followUpDate) }),
          // Increment contactCount whenever status moves to CONTACTED
          ...(dto.status === "CONTACTED" &&
            current.status !== "CONTACTED" && {
              contactCount: { increment: 1 },
            }),
        },
      });

      if (dto.note) {
        await tx.inquiryNote.create({
          data: { inquiryId: id, authorId: actorId, body: dto.note },
        });
      }
    });

    await this.audit.record({
      actorId,
      entityType: "Inquiry",
      entityId: id,
      action: "UPDATE_STATUS",
      before: { status: current.status },
      after: { status: dto.status, note: dto.note ?? null },
      ipAddress: meta.ip,
      userAgent: meta.ua,
    });

    return this.detail(id);
  }

  // ────────────────────────────────────────────────────────
  // ADD NOTE (does not change status)
  // ────────────────────────────────────────────────────────
  async addNote(
    actorId: string,
    id: string,
    dto: AddInquiryNoteDto,
  ): Promise<InquiryAdminView> {
    const exists = await this.prisma.inquiry.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Inquiry not found");

    await this.prisma.inquiryNote.create({
      data: { inquiryId: id, authorId: actorId, body: dto.body.trim() },
    });
    return this.detail(id);
  }

  // ────────────────────────────────────────────────────────
  // Internals
  // ────────────────────────────────────────────────────────
  private toPublic(
    r: {
      id: string;
      buyerName: string;
      buyerPhone: string;
      buyerEmail: string | null;
      message: string | null;
      preferredContactTime: string | null;
      status: string;
      createdAt: Date;
    },
    property: { id: string; slug: string; title: string },
  ): InquiryPublic {
    return {
      id: r.id,
      propertyId: property.id,
      propertySlug: property.slug,
      propertyTitle: property.title || "(Untitled)",
      buyerName: r.buyerName,
      buyerPhone: r.buyerPhone,
      buyerEmail: r.buyerEmail,
      message: r.message,
      preferredContactTime: r.preferredContactTime,
      status: r.status as InquiryPublic["status"],
      createdAt: r.createdAt.toISOString(),
    };
  }
}