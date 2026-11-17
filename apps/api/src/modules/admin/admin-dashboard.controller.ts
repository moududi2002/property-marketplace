// 📍 /apps/api/src/modules/admin/admin-dashboard.controller.ts

import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { DashboardStats } from "@property-marketplace/shared-types";
import { Roles } from "../auth/decorators/roles.decorator";
import { AdminDashboardService } from "./admin-dashboard.service";

@ApiTags("admin/dashboard")
@ApiBearerAuth("access-token")
@Roles("MODERATOR", "SUPER_ADMIN")
@Controller("admin/dashboard")
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get("stats")
  @ApiOperation({ summary: "Aggregate stats for the admin overview" })
  async stats(): Promise<{ stats: DashboardStats }> {
    return { stats: await this.dashboard.stats() };
  }
}