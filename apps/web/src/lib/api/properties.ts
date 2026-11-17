// 📍 /apps/web/src/lib/api/properties.ts
//
// Seller-facing property operations. All requests include cookies.

import { apiFetch } from "@/lib/api";
import type {
  PaginatedResponse,
  PropertySellerView,
} from "@property-marketplace/shared-types";

export type { PropertySellerView };

export interface PropertyDraftPayload {
  categoryId?: string;
  title?: string;
  description?: string;
  purpose?: "SALE" | "RENT" | "LEASE";
  price?: number;
  priceUnit?: "TOTAL" | "PER_KATHA" | "PER_SQFT" | "PER_MONTH";
  isNegotiable?: boolean;
  landSize?: number;
  landSizeUnit?: "KATHA" | "BIGHA" | "DECIMAL" | "ACRE" | "SQFT" | "SQM";
  buildingSizeSqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  condition?: "NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "NEEDS_RENOVATION";
  ownershipType?: "FREEHOLD" | "LEASEHOLD" | "GOVERNMENT" | "UNKNOWN";
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  areaLocality?: string;
  fullAddress?: string;
  sellerNotes?: string;
}

export async function createDraft(
  payload: PropertyDraftPayload,
): Promise<PropertySellerView> {
  const { property } = await apiFetch<{ property: PropertySellerView }>(
    "/seller/properties",
    { method: "POST", body: payload },
  );
  return property;
}

export async function updateDraft(
  id: string,
  payload: PropertyDraftPayload,
): Promise<PropertySellerView> {
  const { property } = await apiFetch<{ property: PropertySellerView }>(
    `/seller/properties/${id}`,
    { method: "PATCH", body: payload },
  );
  return property;
}

export async function getMyProperties(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<PaginatedResponse<PropertySellerView>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);
  return apiFetch<PaginatedResponse<PropertySellerView>>(
    `/seller/properties?${qs.toString()}`,
  );
}

export async function getMyProperty(id: string): Promise<PropertySellerView> {
  const { property } = await apiFetch<{ property: PropertySellerView }>(
    `/seller/properties/${id}`,
  );
  return property;
}

export async function submitProperty(id: string): Promise<PropertySellerView> {
  const { property } = await apiFetch<{ property: PropertySellerView }>(
    `/seller/properties/${id}/submit`,
    { method: "POST" },
  );
  return property;
}

export async function deleteDraft(id: string): Promise<void> {
  await apiFetch<void>(`/seller/properties/${id}`, { method: "DELETE" });
}