// 📍 /apps/api/src/modules/categories/categories.controller.ts

import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator";
import { CategoriesService, type CategoryNode } from "./categories.service";

@ApiTags("categories")
@Controller("categories")
@Public()
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: "List all active categories (flat)" })
  async list(): Promise<{ categories: CategoryNode[] }> {
    return { categories: await this.categories.listFlat() };
  }

  @Get("tree")
  @ApiOperation({ summary: "Nested category tree (parents with children)" })
  async tree(): Promise<{ categories: CategoryNode[] }> {
    return { categories: await this.categories.tree() };
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get one category (with its children)" })
  async detail(@Param("slug") slug: string): Promise<{ category: CategoryNode }> {
    return { category: await this.categories.findBySlug(slug) };
  }
}