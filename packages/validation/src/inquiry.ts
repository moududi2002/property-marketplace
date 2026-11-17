// 📍 /packages/validation/src/inquiry.ts

import { z } from "zod";
import { bdPhoneSchema, emailSchema, uuidSchema } from "./common";

export const inquiryStatusSchema = z.enum(["NEW", "CONTACTED", "FOLLOW_UP", "CLOSED", "INVALID"]);

/** Buyer inquiry form on property detail page */
export const createInquirySchema = z.object({
  propertyId: uuidSchema,
  buyerName: z.string().trim().min(2, "নাম কমপক্ষে ২ অক্ষর").max(100),
  buyerPhone: bdPhoneSchema,
  buyerEmail: emailSchema.optional().or(z.literal("")),
  message: z.string().trim().min(5, "বার্তা কমপক্ষে ৫ অক্ষর").max(2000).optional(),
  preferredContactTime: z.string().trim().max(100).optional(),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;

export const updateInquiryStatusSchema = z.object({
  status: inquiryStatusSchema,
  note: z.string().trim().max(2000).optional(),
  followUpDate: z.string().datetime().optional(),
});