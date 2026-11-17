// 📍 /apps/api/src/modules/categories/categories.service.ts

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface CategoryNode {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  parentId: string | null;
  iconKey: string | null;
  sortOrder: number;
  children?: CategoryNode[];
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Flat list of all active categories (both parents + children).
   * Sorted by sortOrder so the frontend can nest deterministically.
   */
  async listFlat(): Promise<CategoryNode[]> {
    const rows = await this.prisma.propertyCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameBn: true,
        parentId: true,
        iconKey: true,
        sortOrder: true,
      },
    });
    return rows;
  }

  /**
   * Nested tree: only top-level categories with `children` array.
   */
  async tree(): Promise<CategoryNode[]> {
    const rows = await this.listFlat();
    const byId = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

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

  async findBySlug(slug: string): Promise<CategoryNode> {
    const row = await this.prisma.propertyCategory.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameBn: true,
        parentId: true,
        iconKey: true,
        sortOrder: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            slug: true,
            nameEn: true,
            nameBn: true,
            parentId: true,
            iconKey: true,
            sortOrder: true,
          },
        },
      },
    });
    if (!row) throw new NotFoundException("Category not found");
    return row;
  }
}