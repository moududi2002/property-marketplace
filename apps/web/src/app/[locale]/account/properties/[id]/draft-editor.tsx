// 📍 /apps/web/src/app/[locale]/account/properties/[id]/draft-editor.tsx
//
// Adds an image gallery so the seller can see what they uploaded.

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getMyProperty, type PropertySellerView } from "@/lib/api/properties";
import { listImages } from "@/lib/api/images";
import type { PropertyImagePublic } from "@property-marketplace/shared-types";
import { StatusBadge } from "@/components/ui/status-badge";

export function DraftEditor({ propertyId }: { propertyId: string }) {
  const t = useTranslations("PropertyDetail");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [property, setProperty] = useState<PropertySellerView | null>(null);
  const [images, setImages] = useState<PropertyImagePublic[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [p, imgs] = await Promise.all([
          getMyProperty(propertyId),
          listImages(propertyId),
        ]);
        setProperty(p);
        setImages(imgs);
      } catch {
        setError(t("notFound"));
      }
    })();
  }, [user, propertyId, t]);

  if (authLoading || (!property && !error)) {
    return (
      <section className="container-page py-12">
        <p className="text-sm text-ink-muted">{t("loading")}</p>
      </section>
    );
  }

  if (error || !property) {
    return (
      <section className="container-page py-12">
        <p className="text-sm text-accent">{error ?? t("notFound")}</p>
        <Link
          href="/account/properties"
          className="mt-4 inline-flex text-sm text-brand hover:underline"
        >
          ← {t("backToList")}
        </Link>
      </section>
    );
  }

  const canEdit =
    property.status === "DRAFT" || property.status === "CHANGES_REQUESTED";

  return (
    <section className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/account/properties"
          className="text-sm text-ink-muted hover:text-ink"
        >
          ← {t("backToList")}
        </Link>

        <header className="mt-4 border-b border-line pb-6">
          <div className="flex items-center gap-3">
            <StatusBadge status={property.status} />
            {canEdit && (
              <Link
                href={`/sell?draft=${property.id}`}
                className="text-sm font-medium text-brand hover:underline"
              >
                {t("continueEditing")}
              </Link>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-ink">
            {property.title || t("untitled")}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{property.districtName}</p>
        </header>

        {property.status === "REJECTED" && property.rejectionReason && (
          <div className="mt-6 rounded-md border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-accent">
            <strong className="block font-semibold">{t("rejectionReason")}</strong>
            <p className="mt-1">{property.rejectionReason}</p>
          </div>
        )}

        {property.status === "CHANGES_REQUESTED" && property.changeRequestNote && (
          <div className="mt-6 rounded-md border border-line bg-brand-light px-4 py-3 text-sm text-brand">
            <strong className="block font-semibold">{t("changeRequestNote")}</strong>
            <p className="mt-1">{property.changeRequestNote}</p>
          </div>
        )}

        {/* Image gallery */}
        {images.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-ink">
              {t("images.heading", { count: images.length })}
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img) => (
                <li
                  key={img.id}
                  className="relative overflow-hidden rounded-md border border-line bg-surface"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.thumbnailUrl}
                      alt={img.alt ?? ""}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  {img.isCover && (
                    <span className="absolute left-2 top-2 rounded-sm bg-brand px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      {t("images.cover")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-[180px_1fr]">
          <dt className="text-sm font-medium text-ink-muted">{t("fields.purpose")}</dt>
          <dd className="text-sm text-ink">{property.purpose}</dd>

          <dt className="text-sm font-medium text-ink-muted">{t("fields.category")}</dt>
          <dd className="text-sm text-ink">{property.categoryName}</dd>

          <dt className="text-sm font-medium text-ink-muted">{t("fields.price")}</dt>
          <dd className="text-sm font-semibold text-ink">
            BDT {property.price.toLocaleString()}
          </dd>

          <dt className="text-sm font-medium text-ink-muted">{t("fields.submittedAt")}</dt>
          <dd className="text-sm text-ink">
            {property.submittedAt
              ? new Date(property.submittedAt).toLocaleString()
              : "—"}
          </dd>

          <dt className="text-sm font-medium text-ink-muted">{t("fields.createdAt")}</dt>
          <dd className="text-sm text-ink">
            {new Date(property.createdAt).toLocaleString()}
          </dd>
        </dl>
      </div>
    </section>
  );
}