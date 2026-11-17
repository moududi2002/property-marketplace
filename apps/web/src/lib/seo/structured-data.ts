// 📍 /apps/web/src/lib/seo/structured-data.ts
//
// JSON-LD builders. Keep them strict — Google is picky about types.

import type { PropertyPublic } from "@property-marketplace/shared-types";

interface RealEstateListingJsonLd {
  "@context": "https://schema.org";
  "@type": "RealEstateListing";
  name: string;
  description: string;
  url: string;
  image: string[];
  offers: {
    "@type": "Offer";
    price: number;
    priceCurrency: "BDT";
    availability: "https://schema.org/InStock" | "https://schema.org/SoldOut";
  };
  address: {
    "@type": "PostalAddress";
    addressCountry: "BD";
    addressRegion: string;
    addressLocality: string;
    streetAddress: string;
  };
  datePosted?: string;
}

export function buildPropertyJsonLd(
  property: PropertyPublic,
  baseUrl: string,
  locale: string,
): RealEstateListingJsonLd {
  const url = `${baseUrl}/${locale}/property/${property.slug}`;
  const images = property.images.map((i) => i.url);

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description.slice(0, 5000),
    url,
    image: images.length > 0 ? images : [`${baseUrl}/og-default.png`],
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "BDT",
      availability:
        property.status === "SOLD"
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "BD",
      addressRegion: property.division.name,
      addressLocality: property.district.name,
      streetAddress: property.fullAddress,
    },
    datePosted: property.publishedAt ?? undefined,
  };
}