// 📍 /apps/api/src/modules/admin/admin-users.controller.ts

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type {
  AdminUserDetail,
  AdminUserListItem,
  PaginatedResponse,
} from "@property-marketplace/shared-types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import type { AuthUser } from "../auth/interfaces/auth-user.interface";
import { AdminUsersService } from "./admin-users.service";
import { ListAdminUsersDto, UpdateUserStatusDto } from "./dto";

@ApiTags("admin/users")
@ApiBearerAuth("access-token")
@Roles("MODERATOR", "SUPER_ADMIN")
@Controller("admin/users")
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: "List users (filter / search / paginate)" })
  async list(
    @Query() query: ListAdminUsersDto,
  ): Promise<PaginatedResponse<AdminUserListItem>> {
    return this.users.list(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Full user detail with recent properties & inquiries" })
  async detail(@Param("id") id: string): Promise<{ user: AdminUserDetail }> {
    return { user: await this.users.detail(id) };
  }

  @Patch(":id/status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Suspend or reactivate a user" })
  async updateStatus(
    @CurrentUser() actor: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: Request,
  ): Promise<{ user: AdminUserDetail }> {
    const user = await this.users.updateStatus(actor.id, id, dto, {
      ip: clientIp(req),
      ua: req.headers["user-agent"],
    });
    return { user };
  }
}

function clientIp(req: Request): string | undefined {
  const f = req.headers["x-forwarded-for"];
  if (typeof f === "string") return f.split(",")[0]?.trim();
  return req.ip;
}