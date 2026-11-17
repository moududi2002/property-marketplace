// 📍 /packages/validation/src/auth.ts

import { z } from "zod";
import { bdPhoneSchema, emailSchema, passwordSchema } from "./common";

/**
 * Registration — user দেয় phone + password OR email + password।
 * Phone বাধ্যতামূলক (Bangladesh context), email optional।
 */
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "নাম কমপক্ষে ২ অক্ষর").max(100),
    phone: bdPhoneSchema,
    email: emailSchema.optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  /** phone বা email — যেকোনো একটি দিয়ে login */
  identifier: z.string().trim().min(3, "মোবাইল বা ইমেইল দিন"),
  password: z.string().min(1, "পাসওয়ার্ড দিন"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const otpRequestSchema = z.object({
  phone: bdPhoneSchema,
});

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  phone: bdPhoneSchema,
  otp: z.string().length(6, "OTP ৬ ডিজিটের হতে হবে").regex(/^\d{6}$/, "OTP শুধু সংখ্যা"),
});

export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(3),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "পাসওয়ার্ড মিলছে না",
    path: ["confirmPassword"],
  });