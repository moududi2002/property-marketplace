// 📍 /packages/validation/src/property.ts

import { z } from "zod";
import { slugSchema, uuidSchema } from "./common";

export const propertyPurposeSchema = z.enum(["SALE", "RENT", "LEASE"]);

export const priceUnitSchema = z.enum(["TOTAL", "PER_KATHA", "PER_SQFT", "PER_MONTH"]);
export const areaUnitSchema = z.enum(["KATHA", "BIGHA", "DECIMAL", "ACRE", "SQFT", "SQM"]);
export const propertyConditionSchema = z.enum(["NEW", "EXCELLENT", "GOOD", "FAIR", "NEEDS_RENOVATION"]);
export const ownershipTypeSchema = z.enum(["FREEHOLD", "LEASEHOLD", "GOVERNMENT", "UNKNOWN"]);

/**
 * Draft-friendly schema — সব field optional।
 * Seller ধীরে ধীরে পূরণ করবে, Draft হিসেবে Save করবে।
 */
export const propertyDraftSchema = z.object({
  // Identity
  categoryId: uuidSchema.optional(),

  // Content (per locale — Phase 1-এ শুধু primary locale)
  title: z.string().trim().min(5, "শিরোনাম কমপক্ষে ৫ অক্ষর").max(200).optional(),
  description: z.string().trim().min(20, "বর্ণনা কমপক্ষে ২০ অক্ষর").max(10000).optional(),

  // Purpose & pricing
  purpose: propertyPurposeSchema.optional(),
  price: z.coerce.number().positive("মূল্য ০-এর বেশি হতে হবে").optional(),
  priceUnit: priceUnitSchema.optional(),
  isNegotiable: z.boolean().default(false).optional(),

  // Size
  landSize: z.coerce.number().positive().optional(),
  landSizeUnit: areaUnitSchema.optional(),
  buildingSizeSqft: z.coerce.number().positive().optional(),

  // Features
  bedrooms: z.coerce.number().int().min(0).max(50).optional(),
  bathrooms: z.coerce.number().int().min(0).max(50).optional(),
  floors: z.coerce.number().int().min(0).max(200).optional(),
  condition: propertyConditionSchema.optional(),
  ownershipType: ownershipTypeSchema.optional(),

  // Location
  divisionId: uuidSchema.optional(),
  districtId: uuidSchema.optional(),
  upazilaId: uuidSchema.optional(),
  areaLocality: z.string().trim().max(150).optional(),
  fullAddress: z.string().trim().max(500).optional(),

  // Private
  sellerNotes: z.string().trim().max(2000).optional(),

  featured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(60).default(20).optional(),
});

export type PropertyDraftInput = z.infer<typeof propertyDraftSchema>;

/**
 * Submit-এর জন্য required fields। Seller "Submit for Review" চাপলে
 * Backend এই schema দিয়ে validate করবে।
 */
export const propertySubmitSchema = z.object({
  categoryId: uuidSchema,
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().min(20).max(10000),
  purpose: propertyPurposeSchema,
  price: z.coerce.number().positive(),
  priceUnit: priceUnitSchema,
  isNegotiable: z.boolean().default(false),

  landSize: z.coerce.number().positive().optional(),
  landSizeUnit: areaUnitSchema.optional(),
  buildingSizeSqft: z.coerce.number().positive().optional(),

  bedrooms: z.coerce.number().int().min(0).max(50).optional(),
  bathrooms: z.coerce.number().int().min(0).max(50).optional(),
  floors: z.coerce.number().int().min(0).max(200).optional(),
  condition: propertyConditionSchema.optional(),
  ownershipType: ownershipTypeSchema.optional(),

  divisionId: uuidSchema,
  districtId: uuidSchema,
  upazilaId: uuidSchema.optional(),
  areaLocality: z.string().trim().min(2).max(150),
  fullAddress: z.string().trim().min(5).max(500),

  sellerNotes: z.string().trim().max(2000).optional(),
});

export type PropertySubmitInput = z.infer<typeof propertySubmitSchema>;

/** Admin moderation action */
export const moderationActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES", "PUBLISH", "ARCHIVE"]),
  note: z.string().trim().max(1000).optional(),
  /** Publish চাইলে true করতে হবে (APPROVED → PUBLISHED) */
  publishImmediately: z.boolean().default(false).optional(),
});

export type ModerationActionInput = z.infer<typeof moderationActionSchema>;

/** Public search filter */
export const propertySearchSchema = z.object({
  purpose: propertyPurposeSchema.optional(),
  categorySlug: slugSchema.optional(),
  divisionId: uuidSchema.optional(),
  districtId: uuidSchema.optional(),
  upazilaId: uuidSchema.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minLandSize: z.coerce.number().positive().optional(),
  landSizeUnit: areaUnitSchema.optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  q: z.string().trim().max(200).optional(),
  sort: z.enum(["newest", "oldest", "price_asc", "price_desc"]).default("newest").optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(60).default(20).optional(),
});

export type PropertySearchInput = z.infer<typeof propertySearchSchema>;