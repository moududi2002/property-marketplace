// 📍 /apps/api/src/modules/properties/public-properties.service.ts
//
// Read-only endpoints for the public website.
//   • list()   → only PUBLISHED properties, filtered + paginated
//   • detail() → PUBLISHED / SOLD / RENTED (so old links keep working)
//
// NEVER returns seller private info. Admin contact only.

import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  PaginatedResponse,
  PropertyCard,
  PropertyPublic,
} from "@property-marketplace/shared-types";
import { propertySearchSchema } from "@property-marketplace/validation";
import { PrismaService } from "../prisma/prisma.service";

type SearchQuery = Partial<{
  purpose: "SALE" | "RENT" | "LEASE";
  categorySlug: string;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  bathrooms: number;
  q: string;
  featured: boolean;              
  sort: "newest" | "oldest" | "price_asc" | "price_desc";
  page: number;
  limit: number;
}>;

@Injectable()
export class PublicPropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────────
  // LIST
  // ────────────────────────────────────────────────────────
  async list(rawQuery: unknown): Promise<PaginatedResponse<PropertyCard>> {
    const parsed = propertySearchSchema.safeParse(rawQuery);
    const query: SearchQuery = parsed.success ? parsed.data : {};

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      status: "PUBLISHED",
      deletedAt: null,
      ...(query.purpose && { purpose: query.purpose }),
      ...(query.categorySlug && {
        category: { slug: query.categorySlug, isActive: true },
      }),
      ...(query.divisionId && { divisionId: query.divisionId }),
      ...(query.districtId && { districtId: query.districtId }),
      ...(query.upazilaId && { upazilaId: query.upazilaId }),
      ...(query.bedrooms !== undefined && { bedrooms: { gte: query.bedrooms } }),
      ...(query.bathrooms !== undefined && { bathrooms: { gte: query.bathrooms } }),
      ...(query.featured && { isFeatured: true }),     
      ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
        price: {
          ...(query.minPrice !== undefined && { gte: query.minPrice }),
          ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
        },
      }),
      ...(query.q && {
        OR: [
          { title: { contains: query.q, mode: "insensitive" } },
          { description: { contains: query.q, mode: "insensitive" } },
          { areaLocality: { contains: query.q, mode: "insensitive" } },
        ],
      }),
    };

    const orderBy = this.resolveSort(query.sort);

    const [rows, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: { select: { nameEn: true, nameBn: true } },
          division: { select: { nameEn: true } },
          district: { select: { nameEn: true } },
          images: {
            where: { isCover: true },
            select: { url: true },
            take: 1,
          },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title || "(Untitled)",
        price: Number(r.price),
        priceUnit: r.priceUnit,
        purpose: r.purpose,
        division: r.division.nameEn,
        district: r.district.nameEn,
        areaLocality: r.areaLocality,
        landSize: r.landSize !== null ? Number(r.landSize) : null,
        landSizeUnit: r.landSizeUnit,
        buildingSizeSqft:
          r.buildingSizeSqft !== null ? Number(r.buildingSizeSqft) : null,
        bedrooms: r.bedrooms,
        bathrooms: r.bathrooms,
        coverImageUrl: r.images[0]?.url ?? null,
        categoryName: r.category.nameEn,
        publishedAt: r.publishedAt?.toISOString() ?? null,
        isFeatured: r.isFeatured,
        status: r.status as PropertyCard["status"],
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
  async detail(slug: string): Promise<PropertyPublic> {
    const r = await this.prisma.property.findFirst({
      where: {
        slug,
        status: { in: ["PUBLISHED", "SOLD", "RENTED"] },
        deletedAt: null,
      },
      include: {
        category: { select: { id: true, slug: true, nameEn: true, nameBn: true, iconKey: true } },
        division: { select: { id: true, slug: true, nameEn: true, nameBn: true } },
        district: { select: { id: true, slug: true, nameEn: true, nameBn: true } },
        upazila: { select: { id: true, slug: true, nameEn: true, nameBn: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!r) throw new NotFoundException("Property not found");

    // Bump view count — fire-and-forget, ignore failures
    this.prisma.property
      .update({ where: { id: r.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined);

    const toLocationSummary = (
      loc: { id: string; slug: string; nameEn: string; nameBn: string } | null,
      type: "DIVISION" | "DISTRICT" | "UPAZILA",
    ) =>
      loc
        ? {
            id: loc.id,
            slug: loc.slug,
            name: loc.nameEn,
            nameEn: loc.nameEn,
            nameBn: loc.nameBn,
            type,
          }
        : null;

    return {
      id: r.id,
      slug: r.slug,
      title: r.title || "(Untitled)",
      description: r.description,
      purpose: r.purpose,
      status: r.status as PropertyPublic["status"],

      price: Number(r.price),
      priceUnit: r.priceUnit,
      isNegotiable: r.isNegotiable,

      landSize: r.landSize !== null ? Number(r.landSize) : null,
      landSizeUnit: r.landSizeUnit,
      buildingSizeSqft:
        r.buildingSizeSqft !== null ? Number(r.buildingSizeSqft) : null,

      bedrooms: r.bedrooms,
      bathrooms: r.bathrooms,
      floors: r.floors,
      condition: r.condition,
      ownershipType: r.ownershipType,

      division: toLocationSummary(r.division, "DIVISION")!,
      district: toLocationSummary(r.district, "DISTRICT")!,
      upazila: toLocationSummary(r.upazila, "UPAZILA"),
      areaLocality: r.areaLocality,
      fullAddress: r.fullAddress,

      category: {
        id: r.category.id,
        slug: r.category.slug,
        name: r.category.nameEn,
        nameEn: r.category.nameEn,
        nameBn: r.category.nameBn,
        iconKey: r.category.iconKey,
      },
      images: r.images.map((img) => ({
        id: img.id,
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        alt: img.alt,
        isCover: img.isCover,
        sortOrder: img.sortOrder,
      })),

      publishedAt: r.publishedAt?.toISOString() ?? null,
      viewCount: r.viewCount + 1,
      isFeatured: r.isFeatured,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  // ────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────
  private resolveSort(
    sort: SearchQuery["sort"],
  ): Prisma.PropertyOrderByWithRelationInput {
    switch (sort) {
      case "oldest":
        return { publishedAt: "asc" };
      case "price_asc":
        return { price: "asc" };
      case "price_desc":
        return { price: "desc" };
      case "newest":
      default:
        return { publishedAt: "desc" };
    }
  }
}