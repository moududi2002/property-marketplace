// 📍 /apps/api/src/modules/admin/admin.module.ts

import { Module } from "@nestjs/common";
import { AdminAuditController } from "./admin-audit.controller";
import { AdminAuditService } from "./admin-audit.service";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminDashboardService } from "./admin-dashboard.service";
import { AdminPropertiesController } from "./admin-properties.controller";
import { AdminPropertiesService } from "./admin-properties.service";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUsersService } from "./admin-users.service";

@Module({
  controllers: [
    AdminPropertiesController,
    AdminDashboardController,
    AdminUsersController,
    AdminAuditController,
  ],
  providers: [
    AdminPropertiesService,
    AdminDashboardService,
    AdminUsersService,
    AdminAuditService,
  ],
})
export class AdminModule {}