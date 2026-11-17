// 📍 /apps/api/src/modules/health/health.controller.ts
//
// Health checks must be reachable without authentication so monitoring
// tools (UptimeRobot, PM2, etc.) don't need credentials.

import { Controller, Get, Logger, Res } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { Public } from "../auth/decorators/public.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

interface ServiceCheck {
  status: "up" | "down";
  responseTimeMs?: number;
  error?: string;
}

@ApiTags("health")
@Controller("health")
@Public()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Service health check" })
  async check(@Res({ passthrough: true }) res: Response): Promise<{
    status: "ok" | "degraded";
    uptimeSeconds: number;
    timestamp: string;
    services: Record<"database" | "redis", ServiceCheck>;
  }> {
    const [database, redis] = await Promise.all([this.checkDb(), this.checkRedis()]);
    const allUp = database.status === "up" && redis.status === "up";

    res.status(allUp ? 200 : 503);

    return {
      status: allUp ? "ok" : "degraded",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      services: { database, redis },
    };
  }

  private async checkDb(): Promise<ServiceCheck> {
    try {
      const responseTimeMs = await this.prisma.ping();
      return { status: "up", responseTimeMs };
    } catch (err) {
      this.logger.error(`Database health check failed: ${(err as Error).message}`);
      return { status: "down", error: (err as Error).message };
    }
  }

  private async checkRedis(): Promise<ServiceCheck> {
    try {
      const responseTimeMs = await this.redis.ping();
      return { status: "up", responseTimeMs };
    } catch (err) {
      this.logger.error(`Redis health check failed: ${(err as Error).message}`);
      return { status: "down", error: (err as Error).message };
    }
  }
}