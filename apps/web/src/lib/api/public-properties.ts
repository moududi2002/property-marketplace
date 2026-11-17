// 📍 /apps/web/src/lib/api/public-properties.ts
//
// Public property data — no auth required.
// Used by the listing page, detail page, and homepage search.

import { apiFetch } from "@/lib/api";
import type {
  PaginatedResponse,
  PropertyCard,
  PropertyPublic,
} from "@property-marketplace/shared-types";

export type { PropertyCard, PropertyPublic };

export interface SearchParams {
  purpose?: "SALE" | "RENT" | "LEASE";
  categorySlug?: string;
  districtId?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  q?: string;
  sort?: "newest" | "oldest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

export async function listPublicProperties(
  params: SearchParams = {},
): Promise<PaginatedResponse<PropertyCard>> {
  const qs = new URLSearchParams();
  if (params.purpose) qs.set("purpose", params.purpose);
  if (params.categorySlug) qs.set("categorySlug", params.categorySlug);
  if (params.districtId) qs.set("districtId", params.districtId);
  if (params.minPrice) qs.set("minPrice", String(params.minPrice));
  if (params.maxPrice) qs.set("maxPrice", String(params.maxPrice));
  if (params.bedrooms) qs.set("bedrooms", String(params.bedrooms));
  if (params.q) qs.set("q", params.q);
  if (params.sort) qs.set("sort", params.sort);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  return apiFetch<PaginatedResponse<PropertyCard>>(
    `/properties?${qs.toString()}`,
  );
}

export async function getPublicProperty(slug: string): Promise<PropertyPublic> {
  const { property } = await apiFetch<{ property: PropertyPublic }>(
    `/properties/${slug}`,
  );
  return property;
}

export interface SubmitInquiryPayload {
  propertyId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  message?: string;
  preferredContactTime?: string;
}

export async function submitInquiry(
  payload: SubmitInquiryPayload,
): Promise<void> {
  await apiFetch("/inquiries", { method: "POST", body: payload });
}