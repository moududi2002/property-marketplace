// 📍 /apps/api/src/modules/properties/public-properties.controller.ts

import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type {
  PaginatedResponse,
  PropertyCard,
  PropertyPublic,
} from "@property-marketplace/shared-types";
import { Public } from "../auth/decorators/public.decorator";
import { PublicPropertiesService } from "./public-properties.service";

@ApiTags("properties")
@Controller("properties")
@Public()
export class PublicPropertiesController {
  constructor(private readonly properties: PublicPropertiesService) {}

  @Get()
  @ApiOperation({ summary: "Search published properties (public)" })
  async list(
    @Query() query: Record<string, string>,
  ): Promise<PaginatedResponse<PropertyCard>> {
    return this.properties.list(query);
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get property detail by slug (public)" })
  async detail(@Param("slug") slug: string): Promise<{ property: PropertyPublic }> {
    return { property: await this.properties.detail(slug) };
  }
}