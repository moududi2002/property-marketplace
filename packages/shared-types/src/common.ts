// 📍 /packages/shared-types/src/common.ts

/**
 * Standard API Response Wrapper
 * সব API একই shape-এ response দেবে
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Supported locales */
export type Locale = "en" | "bn";
export const SUPPORTED_LOCALES: Locale[] = ["en", "bn"];
export const DEFAULT_LOCALE: Locale = "en";

/** Audit timestamps present on all entities */
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}