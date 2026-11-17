// 📍 /apps/web/src/app/[locale]/home/featured-section.tsx

import { getTranslations } from "next-intl/server";
import type { PaginatedResponse, PropertyCard } from "@property-marketplace/shared-types";
import { PropertyCard as PropertyCardComponent } from "@/components/property/property-card";
import { Link } from "@/i18n/navigation";
import { serverFetch } from "@/lib/api/server-fetch";

export async function FeaturedSection() {
  const t = await getTranslations("Home.featured");

  const data = await serverFetch<PaginatedResponse<PropertyCard>>(
    "/properties?featured=true&limit=3",
    300,
  );

  if (!data || data.items.length === 0) return null;

  return (
    <section className="container-page py-12">
      <div className="flex items-end justify-between border-b border-line pb-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">{t("title")}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
        </div>
        <Link
          href="/properties?featured=true"
          className="text-sm font-medium text-brand hover:underline"
        >
          {t("viewAll")} →
        </Link>
      </div>
      <ul className="mt-6 space-y-4">
        {data.items.map((p) => (
          <li key={p.id}>
            <PropertyCardComponent property={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}