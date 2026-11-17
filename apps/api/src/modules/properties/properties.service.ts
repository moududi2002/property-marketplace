// 📍 /apps/api/src/modules/properties/properties.service.ts
//
// Seller-facing property business logic.
// Every method takes `userId` from @CurrentUser and filters by sellerId,
// so a seller can NEVER touch another seller's property.

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  PaginatedResponse,
  PropertySellerView,
} from "@property-marketplace/shared-types";
import { propertySubmitSchema } from "@property-marketplace/validation";
import { PrismaService } from "../prisma/prisma.service";
import type { CreatePropertyDto, ListPropertiesQueryDto, UpdatePropertyDto } from "./dto";
import {
  canSellerDelete,
  canSellerEdit,
  canSellerSubmit,
} from "./utils/property-status.util";
import { temporarySlug, uniqueSlugFromTitle } from "./utils/slug.util";

import { NotificationsService } from "../notifications/notifications.service";

/** Prisma include used for the seller list & detail views. */
const SELLER_VIEW_INCLUDE = {
  category: { select: { nameEn: true, nameBn: true } },
  district: { select: { nameEn: true, nameBn: true } },
  images: {
    where: { isCover: true },
    select: { url: true },
    take: 1,
  },
} satisfies Prisma.PropertyInclude;

type PropertyWithSellerView = Prisma.PropertyGetPayload<{
  include: typeof SELLER_VIEW_INCLUDE;
}>;

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ────────────────────────────────────────────────────────
  // CREATE DRAFT
  // ────────────────────────────────────────────────────────
  async createDraft(
    userId: string,
    dto: CreatePropertyDto,
  ): Promise<PropertySellerView> {
    // Category must exist if provided
    if (dto.categoryId) await this.assertCategoryExists(dto.categoryId);

    // Location consistency: district must belong to the given division
    if (dto.divisionId && dto.districtId) {
      await this.assertDistrictBelongsToDivision(dto.districtId, dto.divisionId);
    }
    if (dto.districtId && dto.upazilaId) {
      await this.assertUpazilaBelongsToDistrict(dto.upazilaId, dto.districtId);
    }

    // Drafts still need a valid (unique) slug before submission.
    const slug = temporarySlug();

    // A draft must reference a valid category — fall back to the first active one
    // if the seller hasn't chosen yet. This keeps the FK satisfied.
    const categoryId =
      dto.categoryId ?? (await this.getFallbackCategoryId());

    const created = await this.prisma.property.create({
      data: {
        slug,
        sellerId: userId,
        categoryId,
        purpose: dto.purpose ?? "SALE",
        status: "DRAFT",
        title: dto.title ?? "",
        description: dto.description ?? "",
        price: dto.price ?? 0,
        priceUnit: dto.priceUnit ?? "TOTAL",
        isNegotiable: dto.isNegotiable ?? false,
        landSize: dto.landSize ?? null,
        landSizeUnit: dto.landSizeUnit ?? null,
        buildingSizeSqft: dto.buildingSizeSqft ?? null,
        bedrooms: dto.bedrooms ?? null,
        bathrooms: dto.bathrooms ?? null,
        floors: dto.floors ?? null,
        condition: dto.condition ?? null,
        ownershipType: dto.ownershipType ?? null,
        divisionId: dto.divisionId ?? (await this.getFallbackDivisionId()),
        districtId: dto.districtId ?? (await this.getFallbackDistrictId()),
        upazilaId: dto.upazilaId ?? null,
        areaLocality: dto.areaLocality ?? "",
        fullAddress: dto.fullAddress ?? "",
        sellerNotes: dto.sellerNotes ?? null,
      },
      include: SELLER_VIEW_INCLUDE,
    });

    this.logger.log(`Draft created: ${created.id} by seller ${userId}`);
    return this.toSellerView(created);
  }

  // ────────────────────────────────────────────────────────
  // UPDATE DRAFT
  // ────────────────────────────────────────────────────────
  async updateDraft(
    userId: string,
    propertyId: string,
    dto: UpdatePropertyDto,
  ): Promise<PropertySellerView> {
    const property = await this.findOwnedProperty(userId, propertyId);

    if (!canSellerEdit(property.status)) {
      throw new ForbiddenException(
        `Cannot edit a property in status ${property.status}. Submit a change request instead.`,
      );
    }

    if (dto.categoryId) await this.assertCategoryExists(dto.categoryId);
    if (dto.divisionId && dto.districtId) {
      await this.assertDistrictBelongsToDivision(dto.districtId, dto.divisionId);
    }
    if (dto.districtId && dto.upazilaId) {
      await this.assertUpazilaBelongsToDistrict(dto.upazilaId, dto.districtId);
    }

    // Filter out undefined — Prisma rejects unknown fields but
    // `undefined` values are safely ignored anyway.
    const data: Prisma.PropertyUpdateInput = {};
    const assign = <K extends keyof UpdatePropertyDto>(key: K): void => {
      const v = dto[key];
      if (v === undefined) return;
      (data as Record<string, unknown>)[key] = v;
    };

    (
      [
        "categoryId",
        "title",
        "description",
        "purpose",
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
        "divisionId",
        "districtId",
        "upazilaId",
        "areaLocality",
        "fullAddress",
        "sellerNotes",
      ] as (keyof UpdatePropertyDto)[]
    ).forEach(assign);

    // FK relations must be set via `connect` in Prisma when using nested writes
    const updateData: Prisma.PropertyUpdateInput = {
      ...(data.title !== undefined && { title: data.title as string }),
      ...(data.description !== undefined && { description: data.description as string }),
      ...(data.purpose !== undefined && { purpose: data.purpose as never }),
      ...(data.price !== undefined && { price: data.price as never }),
      ...(data.priceUnit !== undefined && { priceUnit: data.priceUnit as never }),
      ...(data.isNegotiable !== undefined && { isNegotiable: data.isNegotiable as boolean }),
      ...(data.landSize !== undefined && { landSize: data.landSize as never }),
      ...(data.landSizeUnit !== undefined && { landSizeUnit: data.landSizeUnit as never }),
      ...(data.buildingSizeSqft !== undefined && { buildingSizeSqft: data.buildingSizeSqft as never }),
      ...(data.bedrooms !== undefined && { bedrooms: data.bedrooms as number }),
      ...(data.bathrooms !== undefined && { bathrooms: data.bathrooms as number }),
      ...(data.floors !== undefined && { floors: data.floors as number }),
      ...(data.condition !== undefined && { condition: data.condition as never }),
      ...(data.ownershipType !== undefined && { ownershipType: data.ownershipType as never }),
      ...(data.areaLocality !== undefined && { areaLocality: data.areaLocality as string }),
      ...(data.fullAddress !== undefined && { fullAddress: data.fullAddress as string }),
      ...(data.sellerNotes !== undefined && { sellerNotes: data.sellerNotes as string }),
      ...(data.categoryId !== undefined && { category: { connect: { id: data.categoryId as string } } }),
      ...(data.divisionId !== undefined && { division: { connect: { id: data.divisionId as string } } }),
      ...(data.districtId !== undefined && { district: { connect: { id: data.districtId as string } } }),
      ...(data.upazilaId !== undefined && {
        upazila: data.upazilaId ? { connect: { id: data.upazilaId as string } } : { disconnect: true },
      }),
    };

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: updateData,
      include: SELLER_VIEW_INCLUDE,
    });

    

    // Notify all admins that a new property is awaiting review
    void this.notifications
      .notifyAdmins({
        type: "NEW_PROPERTY_SUBMITTED",
        title: "New property submitted",
        body: `"${updated.title}" is awaiting review.`,

        link: `/admin/properties/${propertyId}`,
      })
      .catch((err) =>
        this.logger.error(`Failed to notify admins: ${(err as Error).message}`),
      );

    return this.toSellerView(updated);
  }

  // ────────────────────────────────────────────────────────
  // SUBMIT FOR REVIEW
  // ────────────────────────────────────────────────────────
  async submit(userId: string, propertyId: string): Promise<PropertySellerView> {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, sellerId: userId, deletedAt: null },
    });
    if (!property) throw new NotFoundException("Property not found");

    if (!canSellerSubmit(property.status)) {
      throw new BadRequestException(
        `Cannot submit a property in status ${property.status}.`,
      );
    }

    // Validate the CURRENT DB state against the submit schema.
    const parsed = propertySubmitSchema.safeParse({
      categoryId: property.categoryId,
      title: property.title,
      description: property.description,
      purpose: property.purpose,
      price: Number(property.price),
      priceUnit: property.priceUnit,
      isNegotiable: property.isNegotiable,
      landSize: property.landSize !== null ? Number(property.landSize) : undefined,
      landSizeUnit: property.landSizeUnit ?? undefined,
      buildingSizeSqft:
        property.buildingSizeSqft !== null ? Number(property.buildingSizeSqft) : undefined,
      bedrooms: property.bedrooms ?? undefined,
      bathrooms: property.bathrooms ?? undefined,
      floors: property.floors ?? undefined,
      condition: property.condition ?? undefined,
      ownershipType: property.ownershipType ?? undefined,
      divisionId: property.divisionId,
      districtId: property.districtId,
      upazilaId: property.upazilaId ?? undefined,
      areaLocality: property.areaLocality,
      fullAddress: property.fullAddress,
      sellerNotes: property.sellerNotes ?? undefined,
    });

    const imageCount = await this.prisma.propertyImage.count({
      where: { propertyId },
    });
    if (imageCount === 0) {
      throw new BadRequestException({
        message: "Please upload at least one image before submitting.",
        errorCode: "IMAGES_REQUIRED",
        errors: { images: ["At least one image is required"] },
      });
    }

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      throw new BadRequestException({
        message: "Please complete all required fields before submitting.",
        errorCode: "INCOMPLETE_PROPERTY",
        errors: issues.reduce<Record<string, string[]>>((acc, i) => {
          (acc[i.field] ||= []).push(i.message);
          return acc;
        }, {}),
      });
    }

    // Generate the real slug now that we have a title.
    const finalSlug = await uniqueSlugFromTitle(
      this.prisma,
      parsed.data.title,
      propertyId,
    );

    const [updated] = await this.prisma.$transaction([
      this.prisma.property.update({
        where: { id: propertyId },
        data: {
          status: "PENDING_REVIEW",
          slug: finalSlug,
          submittedAt: new Date(),
          rejectionReason: null,
          changeRequestNote: null,
        },
        include: SELLER_VIEW_INCLUDE,
      }),
      this.prisma.propertyModerationLog.create({
        data: {
          propertyId,
          actorId: userId,
          action: "SUBMITTED",
          note: null,
          metadata: { newStatus: "PENDING_REVIEW" },
        },
      }),
    ]);

    this.logger.log(`Property ${propertyId} submitted for review`);
    return this.toSellerView(updated);
  }

  // ────────────────────────────────────────────────────────
  // DELETE DRAFT
  // ────────────────────────────────────────────────────────
  async deleteDraft(userId: string, propertyId: string): Promise<void> {
    const property = await this.findOwnedProperty(userId, propertyId);

    if (!canSellerDelete(property.status)) {
      throw new ForbiddenException(
        `Cannot delete a property in status ${property.status}.`,
      );
    }

    // Soft delete — preserves history for admin audit
    await this.prisma.property.update({
      where: { id: propertyId },
      data: { deletedAt: new Date() },
    });
  }

  // ────────────────────────────────────────────────────────
  // LIST MY PROPERTIES
  // ────────────────────────────────────────────────────────
  async listMine(
    userId: string,
    query: ListPropertiesQueryDto,
  ): Promise<PaginatedResponse<PropertySellerView>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      sellerId: userId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.q && {
        OR: [
          { title: { contains: query.q, mode: "insensitive" } },
          { areaLocality: { contains: query.q, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: SELLER_VIEW_INCLUDE,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.property.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: items.map((p) => this.toSellerView(p)),
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
  // GET MY PROPERTY DETAIL
  // ────────────────────────────────────────────────────────
  async findMineById(userId: string, propertyId: string): Promise<PropertySellerView> {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, sellerId: userId, deletedAt: null },
      include: SELLER_VIEW_INCLUDE,
    });
    if (!property) throw new NotFoundException("Property not found");
    return this.toSellerView(property);
  }

  // ────────────────────────────────────────────────────────
  // Internals
  // ────────────────────────────────────────────────────────

  private async findOwnedProperty(userId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, sellerId: userId, deletedAt: null },
    });
    if (!property) throw new NotFoundException("Property not found");
    return property;
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const cat = await this.prisma.propertyCategory.findFirst({
      where: { id: categoryId, isActive: true },
      select: { id: true },
    });
    if (!cat) throw new BadRequestException("Invalid category");
  }

  private async assertDistrictBelongsToDivision(
    districtId: string,
    divisionId: string,
  ): Promise<void> {
    const district = await this.prisma.location.findFirst({
      where: { id: districtId, type: "DISTRICT", parentId: divisionId },
      select: { id: true },
    });
    if (!district) {
      throw new BadRequestException("Selected district does not belong to the division");
    }
  }

  private async assertUpazilaBelongsToDistrict(
    upazilaId: string,
    districtId: string,
  ): Promise<void> {
    const upazila = await this.prisma.location.findFirst({
      where: { id: upazilaId, type: "UPAZILA", parentId: districtId },
      select: { id: true },
    });
    if (!upazila) {
      throw new BadRequestException("Selected upazila does not belong to the district");
    }
  }

  /** Fallback category for empty drafts — safest to use "apartment". */
  private async getFallbackCategoryId(): Promise<string> {
    const cat = await this.prisma.propertyCategory.findFirst({
      where: { isActive: true, parentId: { not: null } },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    if (!cat) throw new Error("No categories seeded — run pnpm prisma:seed");
    return cat.id;
  }

  /** Fallback division — Dhaka. */
  private async getFallbackDivisionId(): Promise<string> {
    const div = await this.prisma.location.findFirst({
      where: { type: "DIVISION", isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    if (!div) throw new Error("No divisions seeded — run pnpm prisma:seed");
    return div.id;
  }

  /** Fallback district — first district of the first division. */
  private async getFallbackDistrictId(): Promise<string> {
    const div = await this.getFallbackDivisionId();
    const dist = await this.prisma.location.findFirst({
      where: { type: "DISTRICT", parentId: div, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    if (!dist) throw new Error("No districts seeded — run pnpm prisma:seed");
    return dist.id;
  }

  private toSellerView(p: PropertyWithSellerView): PropertySellerView {
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      status: p.status,
      purpose: p.purpose,
      price: Number(p.price),
      coverImageUrl: p.images[0]?.url ?? null,
      categoryName: p.category.nameEn,
      districtName: p.district.nameEn,
      createdAt: p.createdAt.toISOString(),
      submittedAt: p.submittedAt?.toISOString() ?? null,
      publishedAt: p.publishedAt?.toISOString() ?? null,
      rejectionReason: p.rejectionReason,
      changeRequestNote: p.changeRequestNote,
    };
  }
}