// 📍 /apps/api/src/modules/inquiries/inquiries.controller.ts
//
// Public inquiry submission. Rate-limited to prevent spam.
// If the visitor is logged in (has valid cookie), we attach buyerId
// so admins can correlate. Anonymous submissions are allowed.

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { InquiryPublic } from "@property-marketplace/shared-types";
import { Public } from "../auth/decorators/public.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInquiryDto } from "./dto";
import { InquiriesService } from "./inquiries.service";

@ApiTags("inquiries")
@Controller("inquiries")
export class InquiriesController {
  constructor(
    private readonly inquiries: InquiriesService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: "Submit an inquiry (public, rate-limited)" })
  async create(
    @Body() dto: CreateInquiryDto,
    @Req() req: Request,
  ): Promise<{ inquiry: InquiryPublic }> {
    // Try to detect the current user (optional — never required).
    // We avoid running the guard chain here (route is @Public), so we
    // resolve from the access token manually.
    const buyerId = await this.detectBuyerId(req);

    const inquiry = await this.inquiries.create(dto, buyerId);
    return { inquiry };
  }

  private async detectBuyerId(req: Request): Promise<string | null> {
    // Lightweight check — only used for correlation, never for auth.
    const accessToken = req.cookies?.access_token as string | undefined;
    if (!accessToken) return null;

    try {
      // Decode (not verify) to grab the subject — the actual cookie was
      // already issued by us and is verified on any authed route.
      const parts = accessToken.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(
        Buffer.from(parts[1] as string, "base64url").toString("utf8"),
      ) as { sub?: string };
      if (!payload.sub) return null;

      // Verify the user still exists
      const u = await this.prisma.user.findFirst({
        where: { id: payload.sub, deletedAt: null },
        select: { id: true },
      });
      return u?.id ?? null;
    } catch {
      return null;
    }
  }
}