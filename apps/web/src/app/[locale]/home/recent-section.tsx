// 📍 /apps/web/src/app/[locale]/home/recent-section.tsx

import { getTranslations } from "next-intl/server";
import type { PaginatedResponse, PropertyCard } from "@property-marketplace/shared-types";
import { PropertyCard as PropertyCardComponent } from "@/components/property/property-card";
import { Link } from "@/i18n/navigation";
import { serverFetch } from "@/lib/api/server-fetch";

export async function RecentSection() {
  const t = await getTranslations("Home.recent");

  const data = await serverFetch<PaginatedResponse<PropertyCard>>(
    "/properties?sort=newest&limit=6",
    120,
  );

  if (!data || data.items.length === 0) return null;

  return (
    <section className="border-t border-line bg-surface">
      <div className="container-page py-12">
        <div className="flex items-end justify-between border-b border-line pb-3">
          <div>
            <h2 className="text-xl font-semibold text-ink">{t("title")}</h2>
            <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
          </div>
          <Link
            href="/properties?sort=newest"
            className="text-sm font-medium text-brand hover:underline"
          >
            {t("viewAll")} →
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((p) => (
            <li key={p.id}>
              <RecentCard property={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function RecentCard({ property }: { property: PropertyCard }) {
  return (
    <Link
      href={`/property/${property.slug}`}
      className="group block overflow-hidden rounded-md border border-line bg-card transition-colors hover:border-line-strong"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-line">
        {property.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.coverImageUrl}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface text-xs text-ink-muted">
            No image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate text-sm font-semibold text-ink group-hover:text-brand">
          {property.title}
        </h3>
        <p className="mt-0.5 text-xs text-ink-muted">
          {property.areaLocality}, {property.district}
        </p>
        <p className="mt-2 text-base font-semibold text-ink">
          BDT {property.price.toLocaleString("en-US")}
        </p>
      </div>
    </Link>
  );
}