// 📍 /apps/api/src/modules/properties/properties.controller.ts
//
// Seller routes. Every method requires authentication (global JwtAuthGuard)
// and operates ONLY on properties owned by the current user.

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type {
  PaginatedResponse,
  PropertySellerView,
} from "@property-marketplace/shared-types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/interfaces/auth-user.interface";
import {
  CreatePropertyDto,
  ListPropertiesQueryDto,
  UpdatePropertyDto,
} from "./dto";
import { PropertiesService } from "./properties.service";

@ApiTags("seller/properties")
@ApiBearerAuth("access-token")
@Controller("seller/properties")
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a draft property" })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePropertyDto,
  ): Promise<{ property: PropertySellerView }> {
    return { property: await this.properties.createDraft(user.id, dto) };
  }

  @Get()
  @ApiOperation({ summary: "List my properties (paginated)" })
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListPropertiesQueryDto,
  ): Promise<PaginatedResponse<PropertySellerView>> {
    return this.properties.listMine(user.id, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get my property detail" })
  async detail(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ): Promise<{ property: PropertySellerView }> {
    return { property: await this.properties.findMineById(user.id, id) };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a draft property" })
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdatePropertyDto,
  ): Promise<{ property: PropertySellerView }> {
    return { property: await this.properties.updateDraft(user.id, id, dto) };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a draft property (soft delete)" })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ): Promise<void> {
    await this.properties.deleteDraft(user.id, id);
  }

  @Post(":id/submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit property for admin review" })
  async submit(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ): Promise<{ property: PropertySellerView }> {
    return { property: await this.properties.submit(user.id, id) };
  }
}