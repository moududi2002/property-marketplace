// 📍 /apps/api/src/modules/locations/locations.service.ts

import { Injectable, NotFoundException } from "@nestjs/common";
import type { LocationType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface LocationNode {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  type: LocationType;
  parentId: string | null;
  sortOrder: number;
  children?: LocationNode[];
}

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Full tree: DIVISION → DISTRICT (+ future UPAZILA).
   * Small dataset (~72 rows), safe to return whole thing.
   */
  async tree(): Promise<LocationNode[]> {
    const rows = await this.prisma.location.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { nameEn: "asc" }],
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameBn: true,
        type: true,
        parentId: true,
        sortOrder: true,
      },
    });

    const byId = new Map<string, LocationNode>();
    const roots: LocationNode[] = [];

    for (const row of rows) {
      byId.set(row.id, { ...row, children: [] });
    }
    for (const row of rows) {
      const node = byId.get(row.id)!;
      if (row.parentId && byId.has(row.parentId)) {
        byId.get(row.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  async divisions(): Promise<LocationNode[]> {
    return this.prisma.location.findMany({
      where: { type: "DIVISION", isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameBn: true,
        type: true,
        parentId: true,
        sortOrder: true,
      },
    });
  }

  async districtsOfDivision(divisionSlug: string): Promise<LocationNode[]> {
    const division = await this.prisma.location.findFirst({
      where: { slug: divisionSlug, type: "DIVISION", isActive: true },
      select: { id: true },
    });
    if (!division) throw new NotFoundException("Division not found");

    return this.prisma.location.findMany({
      where: { parentId: division.id, type: "DISTRICT", isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameBn: true,
        type: true,
        parentId: true,
        sortOrder: true,
      },
    });
  }

  async upazilasOfDistrict(districtSlug: string): Promise<LocationNode[]> {
    const district = await this.prisma.location.findFirst({
      where: { slug: districtSlug, type: "DISTRICT", isActive: true },
      select: { id: true },
    });
    if (!district) throw new NotFoundException("District not found");

    return this.prisma.location.findMany({
      where: { parentId: district.id, type: "UPAZILA", isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameBn: true,
        type: true,
        parentId: true,
        sortOrder: true,
      },
    });
  }
}