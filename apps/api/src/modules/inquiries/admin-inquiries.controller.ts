// 📍 /apps/api/src/modules/inquiries/admin-inquiries.controller.ts

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
  InquiryAdminView,
  InquiryListItem,
  PaginatedResponse,
} from "@property-marketplace/shared-types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import type { AuthUser } from "../auth/interfaces/auth-user.interface";
import {
  AddInquiryNoteDto,
  ListInquiriesDto,
  UpdateInquiryStatusDto,
} from "./dto";
import { InquiriesService } from "./inquiries.service";

@ApiTags("admin/inquiries")
@ApiBearerAuth("access-token")
@Roles("MODERATOR", "SUPER_ADMIN")
@Controller("admin/inquiries")
export class AdminInquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Get()
  @ApiOperation({ summary: "List all inquiries (filterable)" })
  async list(
    @Query() query: ListInquiriesDto,
  ): Promise<PaginatedResponse<InquiryListItem>> {
    return this.inquiries.list(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Inquiry detail (buyer + seller + notes)" })
  async detail(@Param("id") id: string): Promise<{ inquiry: InquiryAdminView }> {
    return { inquiry: await this.inquiries.detail(id) };
  }

  @Patch(":id/status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update inquiry status (optionally with note)" })
  async updateStatus(
    @CurrentUser() actor: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateInquiryStatusDto,
    @Req() req: Request,
  ): Promise<{ inquiry: InquiryAdminView }> {
    const inquiry = await this.inquiries.updateStatus(actor.id, id, dto, {
      ip: clientIp(req),
      ua: req.headers["user-agent"],
    });
    return { inquiry };
  }

  @Post(":id/notes")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add an internal note without changing status" })
  async addNote(
    @CurrentUser() actor: AuthUser,
    @Param("id") id: string,
    @Body() dto: AddInquiryNoteDto,
  ): Promise<{ inquiry: InquiryAdminView }> {
    return { inquiry: await this.inquiries.addNote(actor.id, id, dto) };
  }
}

function clientIp(req: Request): string | undefined {
  const f = req.headers["x-forwarded-for"];
  if (typeof f === "string") return f.split(",")[0]?.trim();
  return req.ip;
}