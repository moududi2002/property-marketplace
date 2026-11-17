// 📍 /apps/api/src/app.module.ts
//
// Add the three new feature modules. Everything else unchanged.

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { validateEnv } from "./common/config/env.validation";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "./modules/auth/guards/roles.guard";
import { CategoriesModule } from "./modules/categories/categories.module";
import { HealthModule } from "./modules/health/health.module";
import { LocationsModule } from "./modules/locations/locations.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { PropertiesModule } from "./modules/properties/properties.module";
import { RedisModule } from "./modules/redis/redis.module";
import { UploadsModule } from "./modules/uploads/uploads.module";

import { AuditModule } from "./common/audit/audit.module";
import { AdminModule } from "./modules/admin/admin.module";

import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { InquiriesModule } from "./modules/inquiries/inquiries.module";

import { NotificationsModule } from "./modules/notifications/notifications.module";


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
      validate: validateEnv,
      cache: true,
    }),

    // Global rate limiting. Individual routes tighten further
    // with @Throttle({ default: { limit, ttl } }).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),

    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
        transport:
          process.env.NODE_ENV === "production"
            ? undefined
            : {
                target: "pino-pretty",
                options: { singleLine: true, colorize: true, translateTime: "SYS:HH:MM:ss" },
              },
        redact: {
          paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.body.password",
            "req.body.confirmPassword",
          ],
          censor: "[REDACTED]",
        },
        autoLogging: { ignore: (req) => req.url === "/health" },
      },
    }),
    LoggerModule,
    PrismaModule,
    AuditModule, 
    RedisModule,
    AuthModule,
    CategoriesModule,
    LocationsModule,
    PropertiesModule,
    UploadsModule,
    AdminModule,  
    HealthModule,
    InquiriesModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}