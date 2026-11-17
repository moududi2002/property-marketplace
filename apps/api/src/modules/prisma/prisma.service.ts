// 📍 /apps/api/src/modules/prisma/prisma.service.ts
//
// Global Prisma Client wrapper.
// Handles connection lifecycle and is injectable everywhere.

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === "development"
          ? [{ emit: "event", level: "warn" }, { emit: "event", level: "error" }]
          : [{ emit: "event", level: "error" }],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("✅ PostgreSQL connected");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log("🔌 PostgreSQL disconnected");
  }

  /**
   * Lightweight connectivity check used by the health module.
   * Returns round-trip time in milliseconds.
   */
  async ping(): Promise<number> {
    const start = Date.now();
    await this.$queryRaw`SELECT 1`;
    return Date.now() - start;
  }
}