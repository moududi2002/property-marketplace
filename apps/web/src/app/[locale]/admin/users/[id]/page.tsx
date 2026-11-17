// 📍 /apps/web/src/app/[locale]/admin/users/[id]/page.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import type { AdminUserDetail } from "@property-marketplace/shared-types";
import { getAdminUser, updateUserStatus } from "@/lib/api/admin";
import { ApiError } from "@/lib/api-error";
import { FormAlert } from "@/components/ui/form-error";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { StatusBadge } from "@/components/ui/status-badge";

export default function AdminUserDetailPage() {
  const t = useTranslations("Admin.userDetail");
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const id = params.id;

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAction, setShowAction] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setUser(await getAdminUser(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("notFound"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStatusChange(): Promise<void> {
    if (!user) return;
    if (user.status === "SUSPENDED" && reason.trim().length < 5) {
      setActionError("Reason is required (at least 5 characters).");
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await updateUserStatus(user.id, {
        status: user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED",
        reason: reason.trim() || undefined,
      });
      setUser(updated);
      setShowAction(false);
      setReason("");
      setFlash(
        updated.status === "SUSPENDED" ? t("flash.suspended") : t("flash.activated"),
      );
      setTimeout(() => setFlash(null), 3035);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-ink-muted">{t("loading")}</p>;
  if (error || !user) {
    return (
      <>
        <p className="text-sm text-accent">{error ?? t("notFound")}</p>
        <Link
          href="/admin/users"
          className="mt-4 inline-flex text-sm text-brand hover:underline"
        >
          ← {t("backToList")}
        </Link>
      </>
    );
  }

  const isSelf = currentUser?.id === user.id;
  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "MODERATOR";
  const canChangeStatus = !isSelf && !isAdmin;

  return (
    <>
      <Link href="/admin/users" className="text-sm text-ink-muted hover:text-ink">
        ← {t("backToList")}
      </Link>

      <header className="mt-4 border-b border-line pb-6">
        <h1 className="text-2xl font-semibold text-ink">{user.name}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {user.phone ?? "—"} · {user.email ?? "—"}
        </p>
      </header>

      {flash && (
        <div className="mt-4 rounded-md border border-brand/30 bg-brand-light px-4 py-2 text-sm text-brand">
          {flash}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile */}
        <section className="rounded-md border border-line bg-card lg:col-span-2">
          <header className="border-b border-line px-4 py-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              {t("sections.profile")}
            </h2>
          </header>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 px-4 py-4 sm:grid-cols-2">
            <DField label={t("fields.name")}>{user.name}</DField>
            <DField label={t("fields.phone")}>{user.phone ?? "—"}</DField>
            <DField label={t("fields.email")}>{user.email ?? "—"}</DField>
            <DField label={t("fields.role")}>{user.role}</DField>
            <DField label={t("fields.status")}>
              {user.status === "ACTIVE" ? "Active" : user.status === "SUSPENDED" ? "Suspended" : "Pending"}
            </DField>
            <DField label={t("fields.verified")}>
              {user.phoneVerified ? "Phone ✓" : "Phone ✗"} ·{" "}
              {user.emailVerified ? "Email ✓" : "Email ✗"}
            </DField>
            <DField label={t("fields.joined")}>
              {new Date(user.createdAt).toLocaleString()}
            </DField>
            <DField label={t("fields.lastLogin")}>
              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}
            </DField>
          </dl>
        </section>

        {/* Actions */}
        <section className="rounded-md border border-line bg-card">
          <header className="border-b border-line px-4 py-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              {t("sections.actions")}
            </h2>
          </header>
          <div className="px-4 py-4">
            {!canChangeStatus ? (
              <p className="text-xs text-ink-muted">
                {isSelf
                  ? "Cannot modify your own account."
                  : "Admin accounts cannot be suspended."}
              </p>
            ) : showAction ? (
              <div className="space-y-3">
                {actionError && <FormAlert>{actionError}</FormAlert>}
                {user.status !== "SUSPENDED" && (
                  <div>
                    <Label htmlFor="suspend-reason">{t("forms.suspendReason")}</Label>
                    <Textarea
                      id="suspend-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleStatusChange}
                    disabled={submitting}
                    className={
                      "flex-1 rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-60 " +
                      (user.status === "SUSPENDED"
                        ? "bg-brand hover:bg-brand-hover"
                        : "bg-accent hover:bg-accent/90")
                    }
                  >
                    {submitting
                      ? t("actions.submitting")
                      : user.status === "SUSPENDED"
                        ? t("actions.activate")
                        : t("actions.suspend")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAction(false);
                      setReason("");
                      setActionError(null);
                    }}
                    className="rounded-md border border-line bg-card px-3 py-2 text-sm text-ink-muted hover:text-ink"
                  >
                    {t("actions.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAction(true)}
                className={
                  "w-full rounded-md px-3 py-2 text-sm font-medium text-white " +
                  (user.status === "SUSPENDED"
                    ? "bg-brand hover:bg-brand-hover"
                    : "bg-accent hover:bg-accent/90")
                }
              >
                {user.status === "SUSPENDED" ? t("actions.activate") : t("actions.suspend")}
              </button>
            )}
          </div>
        </section>

        {/* Properties */}
        <section className="rounded-md border border-line bg-card lg:col-span-2">
          <header className="border-b border-line px-4 py-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              {t("sections.properties")}
            </h2>
          </header>
          <div className="px-4 py-4">
            {user.properties.length === 0 ? (
              <p className="text-sm text-ink-muted">{t("propertiesEmpty")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {user.properties.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{p.title}</p>
                      <p className="text-xs text-ink-muted">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={p.status} />
                      <Link
                        href={`/admin/properties/${p.id}`}
                        className="text-xs font-medium text-brand hover:underline"
                      >
                        Open →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function DField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  );
}