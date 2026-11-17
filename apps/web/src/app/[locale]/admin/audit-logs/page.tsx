// 📍 /apps/web/src/app/[locale]/admin/audit-logs/page.tsx
//
// SUPER_ADMIN only. The sidebar hides the link for moderators, but we
// also gate the page on the client as a second line of defence (the
// API enforces it server-side too).

"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type {
  AdminAuditLogEntry,
  PaginatedResponse,
} from "@property-marketplace/shared-types";
import { listAuditLogs } from "@/lib/api/admin";
import { ApiError } from "@/lib/api-error";
import { useAuth } from "@/hooks/use-auth";
import { Pagination } from "@/components/ui/pagination";

export default function AdminAuditLogsPage() {
  const t = useTranslations("Admin.audit");
  const tCommon = useTranslations("Admin.common");
  const { user, isLoading: authLoading } = useAuth();

  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<AdminAuditLogEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const load = useCallback(
    async (params: { entityType: string; action: string; page: number }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listAuditLogs({
          entityType: params.entityType || undefined,
          action: params.action || undefined,
          page: params.page,
          limit: 30,
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
    if (authLoading || !isSuperAdmin) return;
    void load({ entityType, action, page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, page, entityType, action]);

  if (authLoading) return <p className="text-sm text-ink-muted">{tCommon("loading")}</p>;
  if (!isSuperAdmin) {
    return (
      <p className="text-sm text-accent">
        Access denied. Audit logs are available to super admins only.
      </p>
    );
  }

  return (
    <>
      <header className="border-b border-line pb-6">
        <h1 className="text-2xl font-semibold text-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
      </header>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-line bg-card px-2 text-sm text-ink focus:border-brand focus:outline-none"
        >
          <option value="">{t("filters.entityType")}: {t("filters.all")}</option>
          <option value="Property">Property</option>
          <option value="User">User</option>
        </select>

        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-line bg-card px-2 text-sm text-ink focus:border-brand focus:outline-none"
        >
          <option value="">{t("filters.action")}: {t("filters.all")}</option>
          {[
            "APPROVE",
            "APPROVE_AND_PUBLISH",
            "REJECT",
            "REQUEST_CHANGES",
            "PUBLISH",
            "ARCHIVE",
            "UPDATE",
            "SUSPEND",
            "ACTIVATE",
          ].map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
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
                  <th className="px-4 py-2.5">{t("columns.actor")}</th>
                  <th className="px-4 py-2.5">{t("columns.action")}</th>
                  <th className="hidden px-4 py-2.5 sm:table-cell">{t("columns.entity")}</th>
                  <th className="hidden px-4 py-2.5 md:table-cell">{t("columns.changes")}</th>
                  <th className="hidden px-4 py-2.5 lg:table-cell">{t("columns.time")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((entry) => (
                  <tr key={entry.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{entry.actorName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-sm bg-surface px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                        {entry.action}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <p className="text-ink">
                        {entry.entityType}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {entry.entityType === "Property" ? (
                          <Link
                            href={`/admin/properties/${entry.entityId}`}
                            className="text-brand hover:underline"
                          >
                            {entry.entityId.slice(0, 10)}…
                          </Link>
                        ) : (
                          entry.entityId.slice(0, 10) + "…"
                        )}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-ink-muted md:table-cell">
                      {entry.changedFields.length > 0
                        ? entry.changedFields.join(", ")
                        : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-ink-muted lg:table-cell">
                      {new Date(entry.createdAt).toLocaleString()}
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