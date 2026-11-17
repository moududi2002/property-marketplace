// 📍 /apps/web/src/app/[locale]/admin/properties/page.tsx
//
// Table of every property with status tabs + search.
// Clicking a row opens the review panel.

"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import type {
  AdminPropertyListItem,
  PaginatedResponse,
} from "@property-marketplace/shared-types";
import { listAdminProperties } from "@/lib/api/admin";
import { ApiError } from "@/lib/api-error";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";

const TABS = [
  { key: "PENDING_REVIEW", labelKey: "tabs.pending" },
  { key: "APPROVED", labelKey: "tabs.approved" },
  { key: "PUBLISHED", labelKey: "tabs.published" },
  { key: "REJECTED", labelKey: "tabs.rejected" },
  { key: "CHANGES_REQUESTED", labelKey: "tabs.changesRequested" },
  { key: "", labelKey: "tabs.all" },
] as const;

export default function AdminPropertiesPage() {
  const t = useTranslations("Admin.properties");
  const tCommon = useTranslations("Admin.common");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<string>(
    searchParams.get("status") ?? "PENDING_REVIEW",
  );
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<AdminPropertyListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (params: { status: string; q: string; page: number }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listAdminProperties({
          status: params.status || undefined,
          q: params.q || undefined,
          page: params.page,
          limit: 20,
        });
        setData(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("loadError"));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void load({ status, q: query, page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  function onTabChange(next: string): void {
    setStatus(next);
    setPage(1);
    const qs = next ? `?status=${next}` : "";
    router.replace(`/admin/properties${qs}`);
  }

  function onSearchSubmit(e: React.FormEvent): void {
    e.preventDefault();
    setPage(1);
    void load({ status, q: query, page: 1 });
  }

  return (
    <>
      <header className="border-b border-line pb-6">
        <h1 className="text-2xl font-semibold text-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
      </header>

      {/* Tabs + search */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 border-b border-line">
          {TABS.map((tab) => {
            const active = status === tab.key;
            return (
              <button
                key={tab.key || "all"}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={
                  "-mb-px border-b-2 px-3 py-2 text-sm transition-colors " +
                  (active
                    ? "border-brand font-medium text-brand"
                    : "border-transparent text-ink-muted hover:text-ink")
                }
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        <form onSubmit={onSearchSubmit} className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-9 w-56 rounded-md border border-line bg-card px-3 text-sm text-ink placeholder:text-ink-muted/60 focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            className="h-9 rounded-md border border-line bg-card px-3 text-sm text-ink hover:border-brand"
          >
            {tCommon("search")}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && <p className="mt-4 text-sm text-accent">{error}</p>}

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-md border border-line bg-card">
        {loading || !data ? (
          <p className="p-6 text-sm text-ink-muted">{tCommon("loading")}</p>
        ) : data.items.length === 0 ? (
          <p className="p-6 text-sm text-ink-muted">{t("empty")}</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface text-left text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-2.5">{t("columns.property")}</th>
                  <th className="hidden px-4 py-2.5 sm:table-cell">{t("columns.seller")}</th>
                  <th className="hidden px-4 py-2.5 md:table-cell">{t("columns.price")}</th>
                  <th className="px-4 py-2.5">{t("columns.status")}</th>
                  <th className="hidden px-4 py-2.5 lg:table-cell">{t("columns.submitted")}</th>
                  <th className="px-4 py-2.5 text-right">{t("columns.action")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-surface">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{p.title}</p>
                      <p className="text-xs text-ink-muted">
                        {p.categoryName} · {p.districtName}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <p className="text-ink">{p.sellerName}</p>
                      <p className="text-xs text-ink-muted">{p.sellerPhone ?? "—"}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-ink md:table-cell">
                      BDT {p.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-ink-muted lg:table-cell">
                      {p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/properties/${p.id}`}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        {t("open")} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              meta={data.meta}
              onPageChange={setPage}
              labels={{
                previous: tCommon("previous"),
                next: tCommon("next"),
                pageInfo: (page, total) => tCommon("pageOf", { page, total }),
              }}
            />
          </>
        )}
      </div>
    </>
  );
}