// 📍 /packages/shared-types/src/admin.ts

import type { PropertyStatus } from "./property";

export interface DashboardStats {
  properties: {
    total: number;
    draft: number;
    pending: number; // PENDING_REVIEW + UNDER_REVIEW
    approved: number; // approved but not published
    published: number;
    rejected: number;
    archived: number;
    sold: number;
    rented: number;
  };
  users: {
    total: number;
    sellers: number;
    admins: number;
    suspended: number;
    newThisWeek: number;
  };
  inquiries: {
    total: number;
    newCount: number;
    thisWeek: number;
  };
}

/** Admin list row — lighter than PropertyAdminView. */
export interface AdminPropertyListItem {
  id: string;
  title: string;
  slug: string;
  status: PropertyStatus;
  purpose: "SALE" | "RENT" | "LEASE";
  price: number;
  sellerName: string;
  sellerPhone: string | null;
  districtName: string;
  categoryName: string;
  submittedAt: string | null;
  createdAt: string;
}

export type AdminUserRole = "USER" | "MODERATOR" | "SUPER_ADMIN";
export type AdminUserStatus = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: AdminUserRole;
  status: AdminUserStatus;
  propertyCount: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminUserPropertySummary {
  id: string;
  title: string;
  status: PropertyStatus;
  createdAt: string;
}

export interface AdminUserInquirySummary {
  id: string;
  propertyTitle: string;
  status: string;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUserListItem {
  emailVerified: boolean;
  phoneVerified: boolean;
  bio: string | null;
  city: string | null;
  properties: AdminUserPropertySummary[];
  recentInquiries: AdminUserInquirySummary[];
}

// ═══════════════════════════════════════════════════════════
//  AUDIT LOGS
// ═══════════════════════════════════════════════════════════

export interface AdminAuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  entityType: string;
  entityId: string;
  action: string;
  changedFields: string[];
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}