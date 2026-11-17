// 📍 /apps/api/src/modules/redis/redis.service.ts
//
// Global Redis connection. Later this same client will be reused by BullMQ.
// For now it just backs the health check.

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.getOrThrow<string>("REDIS_URL");
    this.client = new Redis(url, {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    this.client.on("connect", () => this.logger.log("✅ Redis connected"));
    this.client.on("error", (err) => this.logger.error(`Redis error: ${err.message}`));
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
    this.logger.log("🔌 Redis disconnected");
  }

  /** ioredis client for general use. */
  getClient(): Redis {
    return this.client;
  }

  /** Returns round-trip time in ms for the PING command. */
  async ping(): Promise<number> {
    const start = Date.now();
    await this.client.ping();
    return Date.now() - start;
  }
}