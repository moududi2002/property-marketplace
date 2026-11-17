// 📍 /apps/api/src/modules/notifications/notifications.controller.ts

import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type {
  NotificationItem,
  NotificationUnreadCount,
  PaginatedResponse,
} from "@property-marketplace/shared-types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/interfaces/auth-user.interface";
import { ListNotificationsDto } from "./dto/list-notifications.dto";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@ApiBearerAuth("access-token")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List my notifications (paginated)" })
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListNotificationsDto,
  ): Promise<PaginatedResponse<NotificationItem>> {
    return this.notifications.list(user.id, query);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Unread notification count" })
  async unreadCount(
    @CurrentUser() user: AuthUser,
  ): Promise<NotificationUnreadCount> {
    return this.notifications.unreadCount(user.id);
  }

  @Patch("read-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Mark every notification as read" })
  async markAllRead(@CurrentUser() user: AuthUser): Promise<void> {
    await this.notifications.markAllRead(user.id);
  }

  @Patch(":id/read")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Mark one notification as read" })
  async markRead(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ): Promise<void> {
    await this.notifications.markRead(user.id, id);
  }
}