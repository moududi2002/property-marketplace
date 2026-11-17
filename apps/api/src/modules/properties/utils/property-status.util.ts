// 📍 /apps/api/src/modules/properties/utils/property-status.util.ts
//
// Seller-side state machine.
// Anything not in this map is admin-only or immutable.

import type { PropertyStatus } from "@prisma/client";

export const SELLER_EDITABLE_STATUSES: ReadonlySet<PropertyStatus> = new Set([
  "DRAFT",
  "CHANGES_REQUESTED",
]);

export const SELLER_SUBMITTABLE_STATUSES: ReadonlySet<PropertyStatus> = new Set([
  "DRAFT",
  "CHANGES_REQUESTED",
]);

export const SELLER_DELETABLE_STATUSES: ReadonlySet<PropertyStatus> = new Set([
  "DRAFT",
]);

export function canSellerEdit(status: PropertyStatus): boolean {
  return SELLER_EDITABLE_STATUSES.has(status);
}

export function canSellerSubmit(status: PropertyStatus): boolean {
  return SELLER_SUBMITTABLE_STATUSES.has(status);
}

export function canSellerDelete(status: PropertyStatus): boolean {
  return SELLER_DELETABLE_STATUSES.has(status);
}