// 📍 /packages/shared-types/src/property.ts

import type { Locale, Timestamps } from "./common";
import type { SellerPrivateInfo, UserSummary } from "./user";

/** প্রপার্টির উদ্দেশ্য */
export type PropertyPurpose = "SALE" | "RENT" | "LEASE";

/**
 * Property Status Flow:
 * DRAFT → PENDING_REVIEW → UNDER_REVIEW → APPROVED → PUBLISHED
 *                                  ↓
 *                     CHANGES_REQUESTED | REJECTED | ARCHIVED | SOLD | RENTED
 */
export type PropertyStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "UNDER_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "PUBLISHED"
  | "REJECTED"
  | "ARCHIVED"
  | "SOLD"
  | "RENTED";

export type PriceUnit = "TOTAL" | "PER_KATHA" | "PER_SQFT" | "PER_MONTH";

export type AreaUnit = "KATHA" | "BIGHA" | "DECIMAL" | "ACRE" | "SQFT" | "SQM";

export type PropertyCondition = "NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "NEEDS_RENOVATION";

export type OwnershipType = "FREEHOLD" | "LEASEHOLD" | "GOVERNMENT" | "UNKNOWN";

/** Category short info for cards */
export interface PropertyCategorySummary {
  id: string;
  slug: string;
  name: string;          // resolved to current locale
  nameEn: string;
  nameBn: string;
  iconKey: string | null;
}

/** Division / District / Upazila summary */
export interface LocationSummary {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  nameBn: string;
  type: "DIVISION" | "DISTRICT" | "UPAZILA";
}

/** Public image object (for public pages) */
export interface PropertyImagePublic {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: string | null;
  isCover: boolean;
  sortOrder: number;
}

/**
 * Public property view — this is what BUYERS see.
 * No seller private info, no internal moderation notes.
 */
export interface PropertyPublic extends Timestamps {
  id: string;
  slug: string;
  title: string;
  description: string;
  purpose: PropertyPurpose;
  status: Extract<PropertyStatus, "PUBLISHED" | "SOLD" | "RENTED">;

  // Pricing
  price: number;               // BDT as number; format in UI
  priceUnit: PriceUnit;
  isNegotiable: boolean;

  // Size
  landSize: number | null;
  landSizeUnit: AreaUnit | null;
  buildingSizeSqft: number | null;

  // Features
  bedrooms: number | null;
  bathrooms: number | null;
  floors: number | null;
  condition: PropertyCondition | null;
  ownershipType: OwnershipType | null;

  // Location
  division: LocationSummary;
  district: LocationSummary;
  upazila: LocationSummary | null;
  areaLocality: string;
  fullAddress: string;

  // Relations
  category: PropertyCategorySummary;
  images: PropertyImagePublic[];

  // Meta
  publishedAt: string | null;
  viewCount: number;
  isFeatured: boolean;
}

/** Card display for listing page — lighter than full detail */
export interface PropertyCard {
  id: string;
  slug: string;
  title: string;
  price: number;
  priceUnit: PriceUnit;
  purpose: PropertyPurpose;
  division: string;
  district: string;
  areaLocality: string;
  landSize: number | null;
  landSizeUnit: AreaUnit | null;
  buildingSizeSqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  coverImageUrl: string | null;
  categoryName: string;
  publishedAt: string | null;
  isFeatured: boolean;
  status: Extract<PropertyStatus, "PUBLISHED" | "SOLD" | "RENTED">;
}

/**
 * Seller's own view of their property (dashboard).
 * Includes private data + status control.
 */
export interface PropertySellerView extends Timestamps {
  id: string;
  slug: string;
  title: string;
  status: PropertyStatus;
  purpose: PropertyPurpose;
  price: number;
  coverImageUrl: string | null;
  categoryName: string;
  districtName: string;
  createdAt: string;
  submittedAt: string | null;
  publishedAt: string | null;
  rejectionReason: string | null;
  changeRequestNote: string | null;
}

/**
 * Admin's full view — everything including seller info.
 * Protected by admin permission.
 */
export interface PropertyAdminView extends PropertySellerView {
  seller: SellerPrivateInfo;
  images: PropertyImagePublic[];
  moderationHistory: ModerationLogEntry[];
  sellerNotes: string | null;
  internalNotes: string | null;
  isFeatured: boolean;
}

export interface ModerationLogEntry {
  id: string;
  action: "SUBMITTED" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "PUBLISHED" | "ARCHIVED" | "EDITED";
  actorId: string;
  actorName: string;
  note: string | null;
  createdAt: string;
}

/** Translation-aware display helper */
export interface PropertyTranslationFields {
  locale: Locale;
  title: string;
  description: string;
}