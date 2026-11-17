// 📍 /apps/web/src/components/property/property-card.tsx
//
// Classic listing card: image left, info right on desktop.
// No rounded pill, no gradient badge, no overlay text.

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PropertyCard as PropertyCardType } from "@property-marketplace/shared-types";

interface PropertyCardProps {
  property: PropertyCardType;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const t = useTranslations("PropertyCard");

  const priceLabel = formatPrice(property.price, property.priceUnit);
  const sizeLabel = formatSize(property);

  return (
    <article className="group overflow-hidden rounded-md border border-line bg-card transition-colors hover:border-line-strong">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <Link
          href={`/property/${property.slug}`}
          className="block shrink-0 overflow-hidden bg-line md:w-64"
        >
          <div className="aspect-[4/3] w-full overflow-hidden">
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
                {t("noImage")}
              </div>
            )}
          </div>
        </Link>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <Link href={`/property/${property.slug}`} className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-ink group-hover:text-brand">
                {property.title}
              </h3>
            </Link>
            {property.isFeatured && (
              <span className="shrink-0 rounded-sm bg-sand px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                {t("featured")}
              </span>
            )}
          </div>

          <p className="text-sm text-ink-muted">
            {property.areaLocality}, {property.district}
          </p>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
            <span>{property.categoryName}</span>
            {sizeLabel && <span>{sizeLabel}</span>}
            {property.bedrooms !== null && property.bedrooms > 0 && (
              <span>
                {property.bedrooms} {t("beds")}
              </span>
            )}
            {property.bathrooms !== null && property.bathrooms > 0 && (
              <span>
                {property.bathrooms} {t("baths")}
              </span>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between pt-2">
            <p className="text-lg font-semibold text-ink">
              {priceLabel}
            </p>
            <Link
              href={`/property/${property.slug}`}
              className="text-sm font-medium text-brand hover:underline"
            >
              {t("viewDetails")} →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function formatPrice(price: number, unit: string): string {
  const base = `BDT ${price.toLocaleString("en-US")}`;
  switch (unit) {
    case "PER_KATHA":
      return `${base} / katha`;
    case "PER_SQFT":
      return `${base} / sq.ft.`;
    case "PER_MONTH":
      return `${base} / month`;
    default:
      return base;
  }
}

function formatSize(p: PropertyCardType): string | null {
  if (p.landSize !== null && p.landSizeUnit) {
    const unitMap: Record<string, string> = {
      KATHA: "katha",
      BIGHA: "bigha",
      DECIMAL: "decimal",
      ACRE: "acre",
      SQFT: "sq.ft.",
      SQM: "sq.m.",
    };
    return `${p.landSize} ${unitMap[p.landSizeUnit] ?? p.landSizeUnit}`;
  }
  if (p.buildingSizeSqft !== null) {
    return `${p.buildingSizeSqft} sq.ft.`;
  }
  return null;
}