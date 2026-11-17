// 📍 /apps/api/src/common/config/env.validation.ts
//
// Validates process.env at startup using Zod.
// If any required variable is missing or malformed, the app fails fast
// with a clear message — before any NestJS module initializes.

import { z } from "zod";

export const envSchema = z.object({
  // ─── App ──────────────────────────────────────────────
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_NAME: z.string().default("Property Marketplace"),
  APP_URL: z.string().url(),
  API_URL: z.string().url(),

  // ─── Database ─────────────────────────────────────────
  DATABASE_URL: z.string().url(),

  // ─── Redis ────────────────────────────────────────────
  REDIS_URL: z.string().url(),

  // ─── JWT ──────────────────────────────────────────────
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // ─── Cookies ──────────────────────────────────────────
  COOKIE_DOMAIN: z.string().default("localhost"),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true")
    .default("false"),

  // ─── S3 ───────────────────────────────────────────────
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((v) => v === "true")
    .default("false"),
  S3_PUBLIC_URL: z.string().url(),

  // ─── Upload ───────────────────────────────────────────
  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(10),
  UPLOAD_MAX_IMAGES_PER_PROPERTY: z.coerce.number().int().positive().default(20),

  // ─── Email ────────────────────────────────────────────
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  SMTP_FROM_EMAIL: z.string().email().optional(),
  SMTP_FROM_NAME: z.string().optional().default("Property Marketplace"),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * NestJS ConfigModule `validate` callback.
 * Throws a readable error listing every invalid variable.
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`❌ Invalid environment variables:\n${issues}`);
  }

  return parsed.data;
}