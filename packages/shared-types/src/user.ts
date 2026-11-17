// 📍 /packages/shared-types/src/user.ts

import type { Timestamps } from "./common";

export type UserRole = "USER" | "MODERATOR" | "SUPER_ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

/**
 * Public user object — безопасно to send to client.
 * Never includes passwordHash or internal fields.
 */
export interface UserSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  avatarUrl: string | null;
}

export interface UserDetail extends UserSummary, Timestamps {
  bio: string | null;
  city: string | null;
  lastLoginAt: string | null;
  totalProperties: number;
}

/**
 * Seller info visible ONLY to admins.
 * Never expose this in public APIs.
 */
export interface SellerPrivateInfo {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  registeredAt: string;
}