// 📍 /apps/api/src/main.ts
//
// Application bootstrap. Order matters here:
//   1. Create Nest app
//   2. Attach Pino logger (so config errors are logged properly)
//   3. Global pipes / prefix / cookies / CORS
//   4. Swagger (dev only)

import { Logger, RequestMethod } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { Logger as PinoLogger } from "nestjs-pino";
import { patchNestjsSwagger, ZodValidationPipe } from "nestjs-zod";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // ─── Logging ──────────────────────────────────────────
  app.useLogger(app.get(PinoLogger));
  const logger = new Logger("Bootstrap");

  // ─── Config ───────────────────────────────────────────
  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>("PORT");
  const apiUrl = config.getOrThrow<string>("API_URL");
  const appUrl = config.getOrThrow<string>("APP_URL");
  const nodeEnv = config.getOrThrow<string>("NODE_ENV");

  // ─── Global Prefix ────────────────────────────────────
  // /api/v1/... for public API. /health is excluded (monitoring tools).
  app.setGlobalPrefix("api/v1", {
    exclude: [{ path: "health", method: RequestMethod.GET }],
  });

  // ─── Global Pipes ─────────────────────────────────────
  // ZodValidationPipe validates every DTO that was built via
  // createZodDto() — same schemas are shared with the frontend.
  app.useGlobalPipes(new ZodValidationPipe());

  // ─── Cookies ──────────────────────────────────────────
  app.use(cookieParser());

  // ─── CORS ─────────────────────────────────────────────
  app.enableCors({
    origin: [appUrl],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  // ─── Swagger (dev only) ───────────────────────────────
  if (nodeEnv !== "production") {
    patchNestjsSwagger();

    const swaggerConfig = new DocumentBuilder()
      .setTitle("Property Marketplace API")
      .setDescription("Admin-moderated property marketplace for Bangladesh")
      .setVersion("1.0")
      .addBearerAuth(
        { type: "http", scheme: "bearer", bearerFormat: "JWT", name: "Authorization" },
        "access-token",
      )
      .addCookieAuth("access_token")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    logger.log(`📚 Swagger docs at ${apiUrl}/api/docs`);
  }

  // ─── Graceful Shutdown ────────────────────────────────
  app.enableShutdownHooks();

  // ─── Listen ───────────────────────────────────────────
  await app.listen(port, "0.0.0.0");
  logger.log(`🚀 API listening on ${apiUrl}`);
  logger.log(`❤️  Health check at ${apiUrl}/health`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("❌ Fatal startup error:", err);
  process.exit(1);
});