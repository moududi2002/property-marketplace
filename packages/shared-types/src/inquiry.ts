// 📍 /packages/shared-types/src/inquiry.ts

import type { Timestamps } from "./common";

export type InquiryStatus = "NEW" | "CONTACTED" | "FOLLOW_UP" | "CLOSED" | "INVALID";

export const INQUIRY_STATUSES: InquiryStatus[] = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "CLOSED",
  "INVALID",
];

/** What a buyer sees after submitting an inquiry (no admin data). */
export interface InquiryPublic {
  id: string;
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  message: string | null;
  preferredContactTime: string | null;
  status: InquiryStatus;
  createdAt: string;
}

/** Compact row for admin list. */
export interface InquiryListItem {
  id: string;
  propertyId: string;
  propertyTitle: string;
  buyerName: string;
  buyerPhone: string;
  status: InquiryStatus;
  createdAt: string;
  followUpDate: string | null;
}

/** Admin detail — includes seller linkage + internal notes. */
export interface InquiryAdminView extends InquiryPublic, Timestamps {
  sellerId: string;
  sellerName: string;
  sellerPhone: string | null;
  sellerEmail: string | null;
  internalNotes: InquiryNote[];
  followUpDate: string | null;
  contactCount: number;
}

export interface InquiryNote {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}