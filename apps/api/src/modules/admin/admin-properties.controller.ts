// 📍 /apps/api/src/modules/admin/admin-properties.controller.ts

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type {
  AdminPropertyListItem,
  PaginatedResponse,
  PropertyAdminView,
} from "@property-marketplace/shared-types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import type { AuthUser } from "../auth/interfaces/auth-user.interface";
import { AdminPropertiesService } from "./admin-properties.service";
import {
  ApprovePropertyDto,
  ArchivePropertyDto,
  ListAdminPropertiesDto,
  RejectPropertyDto,
  RequestChangesDto,
  UpdateAdminPropertyDto,
} from "./dto";

@ApiTags("admin/properties")
@ApiBearerAuth("access-token")
@Roles("MODERATOR", "SUPER_ADMIN")
@Controller("admin/properties")
export class AdminPropertiesController {
  constructor(private readonly properties: AdminPropertiesService) {}

  @Get()
  @ApiOperation({ summary: "List properties (filter by status / search)" })
  async list(
    @Query() query: ListAdminPropertiesDto,
  ): Promise<PaginatedResponse<AdminPropertyListItem>> {
    return this.properties.list(query);
  }

  @Get("pending")
  @ApiOperation({ summary: "Properties awaiting review" })
  async pending(): Promise<PaginatedResponse<AdminPropertyListItem>> {
    return this.properties.pending();
  }

  @Get(":id")
  @ApiOperation({ summary: "Full detail of one property (seller info included)" })
  async detail(@Param("id") id: string): Promise<{ property: PropertyAdminView }> {
    return { property: await this.properties.detail(id) };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Admin edit — every change is audit-logged" })
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateAdminPropertyDto,
    @Req() req: Request,
  ): Promise<{ property: PropertyAdminView }> {
    const property = await this.properties.update(user.id, id, dto, {
      ip: clientIp(req),
      ua: req.headers["user-agent"],
    });
    return { property };
  }

  @Post(":id/approve")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Approve (optionally publish immediately)" })
  async approve(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: ApprovePropertyDto,
    @Req() req: Request,
  ): Promise<{ property: PropertyAdminView }> {
    const property = await this.properties.approve(user.id, id, dto, {
      ip: clientIp(req),
      ua: req.headers["user-agent"],
    });
    return { property };
  }

  @Post(":id/reject")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reject with a required reason" })
  async reject(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: RejectPropertyDto,
    @Req() req: Request,
  ): Promise<{ property: PropertyAdminView }> {
    const property = await this.properties.reject(user.id, id, dto, {
      ip: clientIp(req),
      ua: req.headers["user-agent"],
    });
    return { property };
  }

  @Post(":id/request-changes")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send back to seller with requested changes" })
  async requestChanges(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: RequestChangesDto,
    @Req() req: Request,
  ): Promise<{ property: PropertyAdminView }> {
    const property = await this.properties.requestChanges(user.id, id, dto, {
      ip: clientIp(req),
      ua: req.headers["user-agent"],
    });
    return { property };
  }

  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Publish an approved property" })
  async publish(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Req() req: Request,
  ): Promise<{ property: PropertyAdminView }> {
    const property = await this.properties.publish(user.id, id, {
      ip: clientIp(req),
      ua: req.headers["user-agent"],
    });
    return { property };
  }

  @Post(":id/archive")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Archive a property" })
  async archive(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: ArchivePropertyDto,
    @Req() req: Request,
  ): Promise<{ property: PropertyAdminView }> {
    const property = await this.properties.archive(user.id, id, dto, {
      ip: clientIp(req),
      ua: req.headers["user-agent"],
    });
    return { property };
  }
}

function clientIp(req: Request): string | undefined {
  const f = req.headers["x-forwarded-for"];
  if (typeof f === "string") return f.split(",")[0]?.trim();
  return req.ip;
}