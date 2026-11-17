// 📍 /apps/web/src/lib/api/admin.ts
//
// Typed wrapper for every /admin/* endpoint.
// All methods use apiFetch (cookies included, ApiError thrown on failure).

import { apiFetch } from "@/lib/api";
import type {
  AdminAuditLogEntry,
  AdminPropertyListItem,
  AdminUserDetail,
  AdminUserListItem,
  DashboardStats,
  PaginatedResponse,
  PropertyAdminView,
  InquiryAdminView,
  InquiryListItem,
} from "@property-marketplace/shared-types";



// ─── Dashboard ─────────────────────────────────────────────
export async function getDashboardStats(): Promise<DashboardStats> {
  const { stats } = await apiFetch<{ stats: DashboardStats }>(
    "/admin/dashboard/stats",
  );
  return stats;
}

// ─── Properties ────────────────────────────────────────────
export interface AdminPropertyListParams {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export async function listAdminProperties(
  params: AdminPropertyListParams = {},
): Promise<PaginatedResponse<AdminPropertyListItem>> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.q) qs.set("q", params.q);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  return apiFetch<PaginatedResponse<AdminPropertyListItem>>(
    `/admin/properties?${qs.toString()}`,
  );
}

export async function getAdminProperty(id: string): Promise<PropertyAdminView> {
  const { property } = await apiFetch<{ property: PropertyAdminView }>(
    `/admin/properties/${id}`,
  );
  return property;
}

export interface UpdateAdminPropertyPayload {
  title?: string;
  description?: string;
  price?: number;
  isNegotiable?: boolean;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaLocality?: string;
  fullAddress?: string;
  internalNotes?: string | null;
  isFeatured?: boolean;
}

export async function updateAdminProperty(
  id: string,
  payload: UpdateAdminPropertyPayload,
): Promise<PropertyAdminView> {
  const { property } = await apiFetch<{ property: PropertyAdminView }>(
    `/admin/properties/${id}`,
    { method: "PATCH", body: payload },
  );
  return property;
}

export async function approveProperty(
  id: string,
  payload: { note?: string; publishImmediately?: boolean },
): Promise<PropertyAdminView> {
  const { property } = await apiFetch<{ property: PropertyAdminView }>(
    `/admin/properties/${id}/approve`,
    { method: "POST", body: payload },
  );
  return property;
}

export async function rejectProperty(
  id: string,
  reason: string,
): Promise<PropertyAdminView> {
  const { property } = await apiFetch<{ property: PropertyAdminView }>(
    `/admin/properties/${id}/reject`,
    { method: "POST", body: { reason } },
  );
  return property;
}

export async function requestChanges(
  id: string,
  note: string,
): Promise<PropertyAdminView> {
  const { property } = await apiFetch<{ property: PropertyAdminView }>(
    `/admin/properties/${id}/request-changes`,
    { method: "POST", body: { note } },
  );
  return property;
}

export async function publishProperty(id: string): Promise<PropertyAdminView> {
  const { property } = await apiFetch<{ property: PropertyAdminView }>(
    `/admin/properties/${id}/publish`,
    { method: "POST" },
  );
  return property;
}

export async function archiveProperty(
  id: string,
  note?: string,
): Promise<PropertyAdminView> {
  const { property } = await apiFetch<{ property: PropertyAdminView }>(
    `/admin/properties/${id}/archive`,
    { method: "POST", body: { note } },
  );
  return property;
}

// ─── Users ─────────────────────────────────────────────────
export interface AdminUserListParams {
  role?: string;
  status?: string;
  q?: string;
  sort?: "newest" | "oldest" | "name";
  page?: number;
  limit?: number;
}

export async function listAdminUsers(
  params: AdminUserListParams = {},
): Promise<PaginatedResponse<AdminUserListItem>> {
  const qs = new URLSearchParams();
  if (params.role) qs.set("role", params.role);
  if (params.status) qs.set("status", params.status);
  if (params.q) qs.set("q", params.q);
  if (params.sort) qs.set("sort", params.sort);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  return apiFetch<PaginatedResponse<AdminUserListItem>>(
    `/admin/users?${qs.toString()}`,
  );
}

export async function getAdminUser(id: string): Promise<AdminUserDetail> {
  const { user } = await apiFetch<{ user: AdminUserDetail }>(`/admin/users/${id}`);
  return user;
}

export async function updateUserStatus(
  id: string,
  payload: { status: "ACTIVE" | "SUSPENDED"; reason?: string },
): Promise<AdminUserDetail> {
  const { user } = await apiFetch<{ user: AdminUserDetail }>(
    `/admin/users/${id}/status`,
    { method: "PATCH", body: payload },
  );
  return user;
}

// ─── Audit Logs ────────────────────────────────────────────
export interface AdminAuditLogParams {
  actorId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export async function listAuditLogs(
  params: AdminAuditLogParams = {},
): Promise<PaginatedResponse<AdminAuditLogEntry>> {
  const qs = new URLSearchParams();
  if (params.actorId) qs.set("actorId", params.actorId);
  if (params.entityType) qs.set("entityType", params.entityType);
  if (params.entityId) qs.set("entityId", params.entityId);
  if (params.action) qs.set("action", params.action);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  return apiFetch<PaginatedResponse<AdminAuditLogEntry>>(
    `/admin/audit-logs?${qs.toString()}`,
  );
}




// ─── Inquiries ─────────────────────────────────────────────
export interface AdminInquiryListParams {
  status?: string;
  propertyId?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export async function listAdminInquiries(
  params: AdminInquiryListParams = {},
): Promise<PaginatedResponse<InquiryListItem>> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.propertyId) qs.set("propertyId", params.propertyId);
  if (params.q) qs.set("q", params.q);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  return apiFetch<PaginatedResponse<InquiryListItem>>(
    `/admin/inquiries?${qs.toString()}`,
  );
}

export async function getAdminInquiry(id: string): Promise<InquiryAdminView> {
  const { inquiry } = await apiFetch<{ inquiry: InquiryAdminView }>(
    `/admin/inquiries/${id}`,
  );
  return inquiry;
}

export interface UpdateInquiryStatusPayload {
  status: "NEW" | "CONTACTED" | "FOLLOW_UP" | "CLOSED" | "INVALID";
  note?: string;
  followUpDate?: string;
}

export async function updateInquiryStatus(
  id: string,
  payload: UpdateInquiryStatusPayload,
): Promise<InquiryAdminView> {
  const { inquiry } = await apiFetch<{ inquiry: InquiryAdminView }>(
    `/admin/inquiries/${id}/status`,
    { method: "PATCH", body: payload },
  );
  return inquiry;
}

export async function addInquiryNote(
  id: string,
  body: string,
): Promise<InquiryAdminView> {
  const { inquiry } = await apiFetch<{ inquiry: InquiryAdminView }>(
    `/admin/inquiries/${id}/notes`,
    { method: "POST", body: { body } },
  );
  return inquiry;
}