// 📍 /apps/web/src/app/[locale]/admin/users/page.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type {
  AdminUserListItem,
  PaginatedResponse,
} from "@property-marketplace/shared-types";
import { listAdminUsers } from "@/lib/api/admin";
import { ApiError } from "@/lib/api-error";
import { Pagination } from "@/components/ui/pagination";

const TABS = [
  { key: "", labelKey: "tabs.all", params: {} },
  { key: "USER", labelKey: "tabs.sellers", params: { role: "USER" } },
  {
    key: "ADMIN",
    labelKey: "tabs.admins",
    params: { role: "SUPER_ADMIN" },
  },
  {
    key: "SUSPENDED",
    labelKey: "tabs.suspended",
    params: { status: "SUSPENDED" },
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminUsersPage() {
  const t = useTranslations("Admin.users");
  const tCommon = useTranslations("Admin.common");

  const [tab, setTab] = useState<TabKey>("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<AdminUserListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (params: { tab: TabKey; q: string; page: number }) => {
      setLoading(true);
      setError(null);
      try {
        const tabParams = TABS.find((x) => x.key === params.tab)?.params ?? {};
        const res = await listAdminUsers({
          ...tabParams,
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
    void load({ tab, q: query, page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  function onTabChange(next: TabKey): void {
    setTab(next);
    setPage(1);
  }

  function onSearchSubmit(e: React.FormEvent): void {
    e.preventDefault();
    setPage(1);
    void load({ tab, q: query, page: 1 });
  }

  return (
    <>
      <header className="border-b border-line pb-6">
        <h1 className="text-2xl font-semibold text-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 border-b border-line">
          {TABS.map((tb) => (
            <button
              key={tb.key || "all"}
              type="button"
              onClick={() => onTabChange(tb.key)}
              className={
                "-mb-px border-b-2 px-3 py-2 text-sm transition-colors " +
                (tab === tb.key
                  ? "border-brand font-medium text-brand"
                  : "border-transparent text-ink-muted hover:text-ink")
              }
            >
              {t(tb.labelKey)}
            </button>
          ))}
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
                  <th className="px-4 py-2.5">{t("columns.user")}</th>
                  <th className="hidden px-4 py-2.5 sm:table-cell">{t("columns.role")}</th>
                  <th className="px-4 py-2.5">{t("columns.status")}</th>
                  <th className="hidden px-4 py-2.5 md:table-cell">{t("columns.properties")}</th>
                  <th className="hidden px-4 py-2.5 lg:table-cell">{t("columns.joined")}</th>
                  <th className="px-4 py-2.5 text-right">{t("columns.action")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-0 hover:bg-surface">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{u.name}</p>
                      <p className="text-xs text-ink-muted">{u.phone ?? u.email}</p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <UserStatusBadge status={u.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-ink md:table-cell">
                      {u.propertyCount}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-ink-muted lg:table-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/users/${u.id}`}
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

function RoleBadge({ role }: { role: "USER" | "MODERATOR" | "SUPER_ADMIN" }) {
  const label =
    role === "SUPER_ADMIN"
      ? "Super Admin"
      : role === "MODERATOR"
        ? "Moderator"
        : "Seller";
  return (
    <span className="rounded-sm bg-surface px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
      {label}
    </span>
  );
}

function UserStatusBadge({
  status,
}: {
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
}) {
  const map = {
    ACTIVE: { label: "Active", cls: "bg-brand-light text-brand" },
    SUSPENDED: { label: "Suspended", cls: "bg-accent/15 text-accent" },
    PENDING_VERIFICATION: { label: "Pending", cls: "bg-sand text-ink-muted" },
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