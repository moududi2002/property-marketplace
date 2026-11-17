// 📍 /apps/web/src/lib/api/catalog.ts
//
// Read-only public data (categories + locations).
// Cached in-memory for the session — no need to re-fetch on every
// route change.

import { apiFetch } from "@/lib/api";

export interface CategoryNode {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  parentId: string | null;
  iconKey: string | null;
  sortOrder: number;
  children?: CategoryNode[];
}

export interface LocationNode {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  type: "DIVISION" | "DISTRICT" | "UPAZILA";
  parentId: string | null;
  sortOrder: number;
  children?: LocationNode[];
}

let categoriesCache: CategoryNode[] | null = null;
let locationsCache: LocationNode[] | null = null;

export async function fetchCategories(): Promise<CategoryNode[]> {
  if (categoriesCache) return categoriesCache;
  const { categories } = await apiFetch<{ categories: CategoryNode[] }>(
    "/categories/tree",
  );
  categoriesCache = categories;
  return categories;
}

export async function fetchLocationsTree(): Promise<LocationNode[]> {
  if (locationsCache) return locationsCache;
  const { locations } = await apiFetch<{ locations: LocationNode[] }>(
    "/locations/tree",
  );
  locationsCache = locations;
  return locations;
}