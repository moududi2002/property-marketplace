// 📍 /apps/web/src/lib/utils.ts
//
// Standard cn() helper — clsx (conditional join) + tailwind-merge
// (removes conflicting Tailwind classes, keeping the last one).

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}