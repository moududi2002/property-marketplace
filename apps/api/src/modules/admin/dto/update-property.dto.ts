// 📍 /apps/api/src/modules/admin/dto/update-property.dto.ts
//
// Admin can override any editable field. Category/location changes are
// excluded for safety (would need their own audited flow) — keep them
// to seller-side updates.

import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const updateAdminPropertySchema = z.object({
  title: z.string().trim().min(5).max(200).optional(),
  description: z.string().trim().min(20).max(10000).optional(),
  price: z.coerce.number().positive().optional(),
  priceUnit: z.enum(["TOTAL", "PER_KATHA", "PER_SQFT", "PER_MONTH"]).optional(),
  isNegotiable: z.boolean().optional(),
  landSize: z.coerce.number().positive().nullable().optional(),
  landSizeUnit: z
    .enum(["KATHA", "BIGHA", "DECIMAL", "ACRE", "SQFT", "SQM"])
    .nullable()
    .optional(),
  buildingSizeSqft: z.coerce.number().positive().nullable().optional(),
  bedrooms: z.coerce.number().int().min(0).nullable().optional(),
  bathrooms: z.coerce.number().int().min(0).nullable().optional(),
  floors: z.coerce.number().int().min(0).nullable().optional(),
  condition: z
    .enum(["NEW", "EXCELLENT", "GOOD", "FAIR", "NEEDS_RENOVATION"])
    .nullable()
    .optional(),
  ownershipType: z
    .enum(["FREEHOLD", "LEASEHOLD", "GOVERNMENT", "UNKNOWN"])
    .nullable()
    .optional(),
  areaLocality: z.string().trim().min(2).max(150).optional(),
  fullAddress: z.string().trim().min(5).max(500).optional(),
  internalNotes: z.string().trim().max(2000).nullable().optional(),
  isFeatured: z.boolean().optional(),
});

export class UpdateAdminPropertyDto extends createZodDto(updateAdminPropertySchema) {}