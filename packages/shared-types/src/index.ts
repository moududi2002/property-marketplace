// 📍 /packages/shared-types/src/index.ts

/**
 * Barrel export — সব shared types এক জায়গা থেকে import হবে।
 *
 * Usage:
 *   import { PropertyPublic, UserSummary, ApiResponse } from "@property-marketplace/shared-types";
 */

export * from "./common";
export * from "./user";
export * from "./property";
export * from "./inquiry";
export * from "./notification";
export * from "./admin";