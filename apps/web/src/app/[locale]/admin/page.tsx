// 📍 /apps/web/src/app/[locale]/admin/page.tsx
//
// Admin dashboard overview. Loads /admin/dashboard/stats on mount,
// shows compact stat tiles + a recent-pending queue preview.

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AdminPropertyListItem, DashboardStats } from "@property-marketplace/shared-types";
import { getDashboardStats, listAdminProperties } from "@/lib/api/admin";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api-error";

export default function AdminDashboardPage() {
  const t = useTranslations("Admin.dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<AdminPropertyListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, list] = await Promise.all([
          getDashboardStats(),
          listAdminProperties({ status: "PENDING_REVIEW", page: 1, limit: 5 }),
        ]);
        setStats(s);
        setRecent(list.items);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("loadError"));
      }
    })();
  }, [t]);

  if (error) {
    return <p className="text-sm text-accent">{error}</p>;
  }

  return (
    <>
      <header className="border-b border-line pb-6">
        <h1 className="text-2xl font-semibold text-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
      </header>

      {/* Stat tiles */}
      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label={t("stats.totalProperties")} value={stats?.properties.total} href="/admin/properties" />
        <StatTile label={t("stats.pending")} value={stats?.properties.pending} href="/admin/properties?status=PENDING_REVIEW" tone="warn" />
        <StatTile label={t("stats.published")} value={stats?.properties.published} href="/admin/properties?status=PUBLISHED" />
        <StatTile label={t("stats.newUsersThisWeek")} value={stats?.users.newThisWeek} href="/admin/users" />
      </section>

      {/* Secondary stats */}
      <section className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label={t("stats.totalUsers")} value={stats?.users.total} href="/admin/users" small />
        <StatTile label={t("stats.rejected")} value={stats?.properties.rejected} href="/admin/properties?status=REJECTED" small />
        <StatTile label={t("stats.drafts")} value={stats?.properties.draft} href="/admin/properties?status=DRAFT" small />
        <StatTile label={t("stats.newInquiries")} value={stats?.inquiries.newCount} small />
      </section>

      {/* Recent pending */}
      <section className="mt-10">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-base font-semibold text-ink">{t("recentPending")}</h2>
          <Link
            href="/admin/properties?status=PENDING_REVIEW"
            className="text-sm font-medium text-brand hover:underline"
          >
            {t("viewAll")} →
          </Link>
        </div>

        {recent === null ? (
          <p className="mt-4 text-sm text-ink-muted">{t("loading")}</p>
        ) : recent.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">{t("noPending")}</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-md border border-line bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface text-left text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-2.5">{t("columns.property")}</th>
                  <th className="hidden px-4 py-2.5 sm:table-cell">{t("columns.seller")}</th>
                  <th className="hidden px-4 py-2.5 md:table-cell">{t("columns.submitted")}</th>
                  <th className="px-4 py-2.5 text-right">{t("columns.action")}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0">
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
                    <td className="hidden px-4 py-3 text-xs text-ink-muted md:table-cell">
                      {p.submittedAt ? new Date(p.submittedAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/properties/${p.id}`}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        {t("review")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function StatTile({
  label,
  value,
  href,
  tone = "default",
  small = false,
}: {
  label: string;
  value: number | undefined;
  href?: string;
  tone?: "default" | "warn";
  small?: boolean;
}) {
  const content = (
    <div className="rounded-md border border-line bg-card p-4 transition-colors hover:border-line-strong">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p
        className={
          (small ? "mt-1 text-lg" : "mt-1.5 text-2xl") +
          " font-semibold " +
          (tone === "warn" && value && value > 0 ? "text-accent" : "text-ink")
        }
      >
        {value === undefined ? "—" : value}
      </p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}