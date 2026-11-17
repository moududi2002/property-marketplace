// 📍 /apps/web/src/app/[locale]/account/properties/my-properties-list.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getMyProperties, type PropertySellerView } from "@/lib/api/properties";
import { StatusBadge } from "@/components/ui/status-badge";

export function MyPropertiesList() {
  const t = useTranslations("MyProperties");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<PropertySellerView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await getMyProperties({ page: 1, limit: 50 });
        setItems(res.items);
      } catch {
        setError(t("loadError"));
      }
    })();
  }, [user, t]);

  if (authLoading || items === null) {
    return (
      <section className="container-page py-12">
        <p className="text-sm text-ink-muted">{t("loading")}</p>
      </section>
    );
  }

  return (
    <section className="container-page py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between border-b border-line pb-6">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{t("title")}</h1>
            <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
          </div>
          <Link
            href="/sell"
            className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
          >
            {t("newProperty")}
          </Link>
        </header>

        {error && <p className="mt-6 text-sm text-accent">{error}</p>}

        {items.length === 0 ? (
          <div className="mt-8 rounded-md border border-dashed border-line-strong p-10 text-center">
            <p className="text-sm text-ink-muted">{t("empty")}</p>
            <Link
              href="/sell"
              className="mt-3 inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
            >
              {t("createFirst")}
            </Link>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-md border border-line bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3">{t("columns.property")}</th>
                  <th className="hidden px-4 py-3 sm:table-cell">{t("columns.category")}</th>
                  <th className="px-4 py-3">{t("columns.status")}</th>
                  <th className="hidden px-4 py-3 md:table-cell">{t("columns.updated")}</th>
                  <th className="px-4 py-3 text-right">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">
                        {p.title || t("untitled")}
                      </p>
                      <p className="text-xs text-ink-muted">{p.districtName}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-ink-muted sm:table-cell">
                      {p.categoryName}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-ink-muted md:table-cell">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/account/properties/${p.id}`}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        {t("view")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}