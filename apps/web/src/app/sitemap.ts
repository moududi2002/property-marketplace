// 📍 /apps/web/src/app/sitemap.ts
//
// Next.js dynamic sitemap. Called at build time + ISR window.
// Lists every static page + every published property in both locales.

import type { MetadataRoute } from "next";
import type { PaginatedResponse, PropertyCard } from "@property-marketplace/shared-types";

const BASE_URL = process.env.APP_URL ?? "http://localhost:3035";

export const revalidate = 3600; // 1 hour

async function fetchAllPublishedSlugs(): Promise<string[]> {
  const API_BASE = `${process.env.API_URL ?? "http://localhost:4035"}/api/v1`;
  const slugs: string[] = [];
  let page = 1;

  try {
    while (page < 50) {
      const res = await fetch(`${API_BASE}/properties?limit=60&page=${page}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) break;
      const data = (await res.json()) as PaginatedResponse<PropertyCard>;
      for (const item of data.items) slugs.push(item.slug);
      if (!data.meta.hasNext) break;
      page++;
    }
  } catch {
    // Swallow — sitemap can ship without listings during a network hiccup
  }
  return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["", "/properties", "/about", "/contact"];
  const locales = ["en", "bn"] as const;
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: now,
      changeFrequency: path === "" ? "daily" : "weekly",
      priority: path === "" ? 1.0 : 0.7,
      alternates: {
        languages: {
          en: `${BASE_URL}/en${path}`,
          bn: `${BASE_URL}/bn${path}`,
        },
      },
    })),
  );

  const slugs = await fetchAllPublishedSlugs();
  const propertyEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    slugs.map((slug) => ({
      url: `${BASE_URL}/${locale}/property/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: {
          en: `${BASE_URL}/en/property/${slug}`,
          bn: `${BASE_URL}/bn/property/${slug}`,
        },
      },
    })),
  );

  return [...staticEntries, ...propertyEntries];
}