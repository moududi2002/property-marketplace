// 📍 /apps/web/src/app/[locale]/admin/inquiries/page.tsx
//
// Admin inquiries list. Tabs by status, search, click-through to detail.

"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import type {
  InquiryListItem,
  PaginatedResponse,
} from "@property-marketplace/shared-types";
import { listAdminInquiries } from "@/lib/api/admin";
import { ApiError } from "@/lib/api-error";
import { Pagination } from "@/components/ui/pagination";

const TABS = [
  { key: "NEW", labelKey: "tabs.new" },
  { key: "CONTACTED", labelKey: "tabs.contacted" },
  { key: "FOLLOW_UP", labelKey: "tabs.followUp" },
  { key: "CLOSED", labelKey: "tabs.closed" },
  { key: "INVALID", labelKey: "tabs.invalid" },
  { key: "", labelKey: "tabs.all" },
] as const;

export default function AdminInquiriesPage() {
  const t = useTranslations("Admin.inquiries");
  const tCommon = useTranslations("Admin.common");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<string>(
    searchParams.get("status") ?? "NEW",
  );
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<InquiryListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (params: { status: string; q: string; page: number }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listAdminInquiries({
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
    router.replace(`/admin/inquiries${qs}`);
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

      {error && <p className="mt-4 text-sm text-accent">{error}</p>}

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
                  <th className="px-4 py-2.5">{t("columns.buyer")}</th>
                  <th className="hidden px-4 py-2.5 sm:table-cell">{t("columns.property")}</th>
                  <th className="px-4 py-2.5">{t("columns.status")}</th>
                  <th className="hidden px-4 py-2.5 md:table-cell">{t("columns.received")}</th>
                  <th className="px-4 py-2.5 text-right">{t("columns.action")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((i) => (
                  <tr key={i.id} className="border-b border-line last:border-0 hover:bg-surface">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{i.buyerName}</p>
                      <p className="text-xs text-ink-muted">{i.buyerPhone}</p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <p className="truncate text-ink">{i.propertyTitle}</p>
                    </td>
                    <td className="px-4 py-3">
                      <InquiryStatusBadge status={i.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-ink-muted md:table-cell">
                      {new Date(i.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/inquiries/${i.id}`}
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
                pageInfo: (p, total) => tCommon("pageOf", { page: p, total }),
              }}
            />
          </>
        )}
      </div>
    </>
  );
}

function InquiryStatusBadge({
  status,
}: {
  status: "NEW" | "CONTACTED" | "FOLLOW_UP" | "CLOSED" | "INVALID";
}) {
  const map = {
    NEW: { label: "New", cls: "bg-accent/15 text-accent" },
    CONTACTED: { label: "Contacted", cls: "bg-brand-light text-brand" },
    FOLLOW_UP: { label: "Follow-up", cls: "bg-sand text-ink" },
    CLOSED: { label: "Closed", cls: "bg-surface text-ink-muted" },
    INVALID: { label: "Invalid", cls: "bg-line text-ink-muted" },
  } as const;
  const v = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${v.cls}`}
    >
      {v.label}
    </span>
  );
}