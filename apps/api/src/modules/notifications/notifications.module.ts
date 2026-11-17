// 📍 /apps/api/src/modules/notifications/notifications.module.ts

import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { NotificationsController } from "./notifications.controller";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationsService } from "./notifications.service";

@Global()
@Module({
  imports: [ConfigModule, JwtModule.register({})],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}