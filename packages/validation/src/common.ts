// 📍 /packages/validation/src/common.ts

import { z } from "zod";

/** Bangladesh mobile number: 01XXXXXXXXX (11 digits) */
export const bdPhoneSchema = z
  .string()
  .trim()
  .regex(/^01[3-9]\d{8}$/, "সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678)");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("সঠিক ইমেইল ঠিকানা দিন")
  .max(254);

export const passwordSchema = z
  .string()
  .min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে")
  .max(128)
  .regex(/[A-Za-z]/, "পাসওয়ার্ডে অন্তত একটি অক্ষর থাকতে হবে")
  .regex(/\d/, "পাসওয়ার্ডে অন্তত একটি সংখ্যা থাকতে হবে");

export const slugSchema = z
  .string()
  .min(3)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug শুধু lowercase letters, numbers এবং hyphen থাকতে পারবে");

export const uuidSchema = z.string().uuid("সঠিক ID দিন");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;