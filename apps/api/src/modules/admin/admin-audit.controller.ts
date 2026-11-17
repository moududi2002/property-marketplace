// 📍 /apps/api/src/modules/admin/admin-audit.controller.ts

import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type {
  AdminAuditLogEntry,
  PaginatedResponse,
} from "@property-marketplace/shared-types";
import { Roles } from "../auth/decorators/roles.decorator";
import { AdminAuditService } from "./admin-audit.service";
import { ListAuditLogsDto } from "./dto";

@ApiTags("admin/audit-logs")
@ApiBearerAuth("access-token")
@Roles("SUPER_ADMIN") // only super admins may view the full audit trail
@Controller("admin/audit-logs")
export class AdminAuditController {
  constructor(private readonly audit: AdminAuditService) {}

  @Get()
  @ApiOperation({ summary: "List audit log entries (filterable)" })
  async list(
    @Query() query: ListAuditLogsDto,
  ): Promise<PaginatedResponse<AdminAuditLogEntry>> {
    return this.audit.list(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one audit log entry with full diff" })
  async detail(@Param("id") id: string): Promise<{ entry: AdminAuditLogEntry }> {
    return { entry: await this.audit.detail(id) };
  }
}