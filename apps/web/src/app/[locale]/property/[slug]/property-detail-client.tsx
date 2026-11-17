// 📍 /apps/web/src/app/[locale]/property/[slug]/property-detail-client.tsx
//
// Client component that renders the interactive parts of the property
// detail page. Data is fetched by the server page and passed in.

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PropertyPublic } from "@property-marketplace/shared-types";
import { ImageGallery } from "@/components/property/image-gallery";
import { InquiryForm } from "@/components/property/inquiry-form";

export function PropertyDetailClient({ property }: { property: PropertyPublic }) {
  const t = useTranslations("PropertyDetail");
  const priceLabel = formatPrice(property.price, property.priceUnit);

  return (
    <section className="container-page py-8">
      <nav className="mb-4 text-xs text-ink-muted">
        <Link href="/" className="hover:text-ink">
          {t("breadcrumb.home")}
        </Link>
        <span className="mx-2">/</span>
        <Link href="/properties" className="hover:text-ink">
          {t("breadcrumb.properties")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{property.category.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <header>
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-sand px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                {property.purpose === "RENT"
                  ? t("purpose.RENT")
                  : property.purpose === "LEASE"
                    ? t("purpose.LEASE")
                    : t("purpose.SALE")}
              </span>
              {property.status === "SOLD" && (
                <span className="rounded-sm bg-accent/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                  {t("sold")}
                </span>
              )}
              {property.status === "RENTED" && (
                <span className="rounded-sm bg-accent/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                  {t("rented")}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-ink md:text-3xl">
              {property.title}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {property.areaLocality}, {property.district.name}, {property.division.name}
            </p>
            <p className="mt-4 text-2xl font-semibold text-brand">{priceLabel}</p>
          </header>

          <div className="mt-6">
            <ImageGallery images={property.images} title={property.title} />
          </div>

          <Panel title={t("sections.description")}>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {property.description || "—"}
            </p>
          </Panel>

          <Panel title={t("sections.features")}>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Feature label={t("fields.category")} value={property.category.name} />
              {property.landSize !== null && property.landSizeUnit && (
                <Feature
                  label={t("fields.landSize")}
                  value={`${property.landSize} ${property.landSizeUnit.toLowerCase()}`}
                />
              )}
              {property.buildingSizeSqft !== null && (
                <Feature
                  label={t("fields.buildingSize")}
                  value={`${property.buildingSizeSqft} sq.ft.`}
                />
              )}
              {property.bedrooms !== null && (
                <Feature label={t("fields.bedrooms")} value={String(property.bedrooms)} />
              )}
              {property.bathrooms !== null && (
                <Feature label={t("fields.bathrooms")} value={String(property.bathrooms)} />
              )}
              {property.floors !== null && (
                <Feature label={t("fields.floors")} value={String(property.floors)} />
              )}
              {property.condition && (
                <Feature
                  label={t("fields.condition")}
                  value={t(`condition.${property.condition}`)}
                />
              )}
              {property.ownershipType && (
                <Feature
                  label={t("fields.ownership")}
                  value={t(`ownership.${property.ownershipType}`)}
                />
              )}
              <Feature
                label={t("fields.negotiable")}
                value={property.isNegotiable ? t("yes") : t("no")}
              />
            </dl>
          </Panel>

          <Panel title={t("sections.location")}>
            <dl className="space-y-2 text-sm">
              <Feature label={t("fields.division")} value={property.division.name} />
              <Feature label={t("fields.district")} value={property.district.name} />
              {property.upazila && (
                <Feature label={t("fields.upazila")} value={property.upazila.name} />
              )}
              <Feature label={t("fields.area")} value={property.areaLocality} />
              <Feature label={t("fields.address")} value={property.fullAddress} />
            </dl>
          </Panel>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-md border border-line bg-card p-5">
            <h2 className="text-base font-semibold text-ink">
              {t("contact.heading")}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">{t("contact.subtitle")}</p>

            <div className="mt-4 rounded-md border border-line bg-surface p-3 text-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                {t("contact.hotline")}
              </p>
              <p className="mt-0.5 text-base font-semibold text-ink">
                +880 1700 000000
              </p>
            </div>

            <div className="mt-5 border-t border-line pt-5">
              <p className="mb-3 text-sm font-medium text-ink">
                {t("contact.orForm")}
              </p>
              <InquiryForm propertyId={property.id} />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-md border border-line bg-card">
      <header className="border-b border-line px-4 py-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {title}
        </h2>
      </header>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function Feature({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
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