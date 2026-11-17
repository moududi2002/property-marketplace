// 📍 /apps/web/src/app/[locale]/property/[slug]/page.tsx
//
// Server Component — fetches the property, generates metadata, injects
// JSON-LD, then hands off rendering to the client component.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { PropertyPublic } from "@property-marketplace/shared-types";
import { serverFetch } from "@/lib/api/server-fetch";
import { buildPropertyJsonLd } from "@/lib/seo/structured-data";
import { PropertyDetailClient } from "./property-detail-client";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function fetchProperty(slug: string): Promise<PropertyPublic | null> {
  const res = await serverFetch<{ property: PropertyPublic }>(
    `/properties/${slug}`,
    60,
  );
  return res?.property ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const property = await fetchProperty(slug);

  if (!property) {
    return { title: "Property not found" };
  }

  const description = property.description.slice(0, 160).replace(/\s+/g, " ").trim();
  const ogImage = property.images[0]?.url;

  return {
    title: property.title,
    description,
    alternates: {
      canonical: `/${locale}/property/${slug}`,
      languages: {
        en: `/en/property/${slug}`,
        bn: `/bn/property/${slug}`,
      },
    },
    openGraph: {
      title: property.title,
      description,
      type: "article",
      locale,
      url: `/${locale}/property/${slug}`,
      ...(ogImage && {
        images: [{ url: ogImage, width: 1200, height: 800, alt: property.title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: property.title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
    robots: {
      index: property.status === "PUBLISHED",
      follow: true,
    },
  };
}

export default async function PropertyPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const property = await fetchProperty(slug);
  if (!property) notFound();

  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const jsonLd = buildPropertyJsonLd(property, baseUrl, locale);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyDetailClient property={property} />
    </>
  );
}