// 📍 /apps/web/src/app/[locale]/admin/properties/[id]/page.tsx
//
// Full review panel. Two-column: main content + sidebar with seller
// info and action buttons. Inline forms for each action (no modals —
// stays in the traditional admin style).

"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import type { PropertyAdminView } from "@property-marketplace/shared-types";
import {
  approveProperty,
  archiveProperty,
  getAdminProperty,
  publishProperty,
  rejectProperty,
  requestChanges,
  updateAdminProperty,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api-error";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/ui/form-error";

type ActionType =
  | "approve"
  | "reject"
  | "request-changes"
  | "publish"
  | "archive"
  | "edit"
  | null;

export default function AdminPropertyReviewPage() {
  const t = useTranslations("Admin.detail");
  const tCommon = useTranslations("Admin.common");
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [property, setProperty] = useState<PropertyAdminView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<ActionType>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // ─── Load ─────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setProperty(await getAdminProperty(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("notFound"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function closeAction(): void {
    setAction(null);
  }

  function afterAction(message: string, updated: PropertyAdminView): void {
    setProperty(updated);
    setAction(null);
    setFlash(message);
    setTimeout(() => setFlash(null), 4000);
    router.refresh();
  }

  if (loading) {
    return <p className="text-sm text-ink-muted">{t("loading")}</p>;
  }
  if (error || !property) {
    return (
      <>
        <p className="text-sm text-accent">{error ?? t("notFound")}</p>
        <Link
          href="/admin/properties"
          className="mt-4 inline-flex text-sm text-brand hover:underline"
        >
          ← {t("backToList")}
        </Link>
      </>
    );
  }

  const canReview = property.status === "PENDING_REVIEW" || property.status === "UNDER_REVIEW";
  const canPublish = property.status === "APPROVED";
  const canArchive = !["ARCHIVED", "DRAFT"].includes(property.status);

  return (
    <>
      <Link
        href="/admin/properties"
        className="text-sm text-ink-muted hover:text-ink"
      >
        ← {t("backToList")}
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-3">
            <StatusBadge status={property.status} />
            <span className="text-xs uppercase tracking-wide text-ink-muted">
              {property.purpose}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-ink">{property.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {property.categoryName} · {property.districtName}
          </p>
        </div>
      </header>

      {flash && (
        <div className="mt-4 rounded-md border border-brand/30 bg-brand-light px-4 py-2 text-sm text-brand">
          {flash}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ─── Main column ───────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Summary */}
          <Panel title={t("sections.summary")}>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Field label={t("fields.price")}>
                BDT {property.price.toLocaleString()}
              </Field>
              <Field label={t("fields.submitted")}>
                {property.submittedAt
                  ? new Date(property.submittedAt).toLocaleString()
                  : "—"}
              </Field>
              <Field label={t("fields.published")}>
                {property.publishedAt
                  ? new Date(property.publishedAt).toLocaleString()
                  : "—"}
              </Field>
              <Field label={t("fields.category")}>{property.categoryName}</Field>
            </dl>
          </Panel>

          {/* Images */}
          <Panel title={t("sections.images")}>
            {property.images.length === 0 ? (
              <p className="text-sm text-ink-muted">{t("imagesEmpty")}</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {property.images.map((img) => (
                  <li
                    key={img.id}
                    className="relative overflow-hidden rounded-md border border-line bg-surface"
                  >
                    <a href={img.url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.thumbnailUrl}
                        alt={img.alt ?? ""}
                        className="aspect-[4/3] w-full object-cover hover:opacity-90"
                      />
                    </a>
                    {img.isCover && (
                      <span className="absolute left-1.5 top-1.5 rounded-sm bg-brand px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Cover
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Description */}
          <Panel title={t("sections.description")}>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {property.title && property.description
                ? property.description
                : "—"}
            </p>
          </Panel>

          {/* Seller's notes */}
          {property.sellerNotes && (
            <Panel title={t("fields.sellerNotes")}>
              <p className="whitespace-pre-wrap text-sm text-ink-muted">
                {property.sellerNotes}
              </p>
            </Panel>
          )}

          {/* Moderation history */}
          <Panel title={t("sections.moderation")}>
            {property.moderationHistory.length === 0 ? (
              <p className="text-sm text-ink-muted">{t("historyEmpty")}</p>
            ) : (
              <ul className="space-y-3">
                {property.moderationHistory.map((log) => (
                  <li
                    key={log.id}
                    className="flex gap-3 border-l-2 border-line pl-3 text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-ink">{log.action}</p>
                      <p className="text-xs text-ink-muted">
                        {log.actorName} · {new Date(log.createdAt).toLocaleString()}
                      </p>
                      {log.note && (
                        <p className="mt-1 text-ink-muted">{log.note}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* ─── Sidebar ───────────────────────────────────── */}
        <div className="space-y-6">
          {/* Seller */}
          <Panel title={t("sections.seller")}>
            <dl className="space-y-2 text-sm">
              <Field label={t("fields.sellerName")}>{property.seller.name}</Field>
              <Field label={t("fields.sellerPhone")}>
                {property.seller.phone ?? "—"}
              </Field>
              <Field label={t("fields.sellerEmail")}>
                {property.seller.email ?? "—"}
              </Field>
              <Field label={t("fields.sellerSince")}>
                {new Date(property.seller.registeredAt).toLocaleDateString()}
              </Field>
            </dl>
          </Panel>

          {/* Actions */}
          <Panel title={t("sections.actions")}>
            <div className="space-y-2">
              {canReview && (
                <>
                  <button
                    type="button"
                    onClick={() => setAction("approve")}
                    className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover"
                  >
                    {t("actions.approve")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction("request-changes")}
                    className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink hover:border-brand hover:text-brand"
                  >
                    {t("actions.requestChanges")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction("reject")}
                    className="w-full rounded-md border border-accent/40 bg-card px-3 py-2 text-sm text-accent hover:bg-accent/5"
                  >
                    {t("actions.reject")}
                  </button>
                </>
              )}

              {canPublish && (
                <button
                  type="button"
                  onClick={() => setAction("publish")}
                  className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover"
                >
                  {t("actions.publish")}
                </button>
              )}

              <button
                type="button"
                onClick={() => setAction("edit")}
                className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink hover:border-brand hover:text-brand"
              >
                Edit details
              </button>

              {canArchive && (
                <button
                  type="button"
                  onClick={() => setAction("archive")}
                  className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink-muted hover:text-ink"
                >
                  {t("actions.archive")}
                </button>
              )}
            </div>
          </Panel>

          {/* Internal notes */}
          <Panel title={t("sections.internalNotes")}>
            <p className="whitespace-pre-wrap text-sm text-ink-muted">
              {property.internalNotes ?? "—"}
            </p>
            <p className="mt-2 text-xs text-ink-muted">
              (edited via "Edit details")
            </p>
          </Panel>
        </div>
      </div>

      {/* Action forms */}
      {action === "approve" && (
        <ActionModal title={t("actions.approve")} onCancel={closeAction}>
          <ApproveForm
            onSuccess={(updated) => afterAction(t("flash.approved"), updated)}
            id={property.id}
          />
        </ActionModal>
      )}

      {action === "reject" && (
        <ActionModal title={t("actions.reject")} onCancel={closeAction}>
          <RejectForm
            onSuccess={(updated) => afterAction(t("flash.rejected"), updated)}
            id={property.id}
          />
        </ActionModal>
      )}

      {action === "request-changes" && (
        <ActionModal title={t("actions.requestChanges")} onCancel={closeAction}>
          <RequestChangesForm
            onSuccess={(updated) => afterAction(t("flash.changesRequested"), updated)}
            id={property.id}
          />
        </ActionModal>
      )}

      {action === "publish" && (
        <ActionModal title={t("actions.publish")} onCancel={closeAction}>
          <SimpleConfirm
            confirmLabel={t("actions.publish")}
            onConfirm={async () => {
              const updated = await publishProperty(property.id);
              afterAction(t("flash.published"), updated);
            }}
          />
        </ActionModal>
      )}

      {action === "archive" && (
        <ActionModal title={t("actions.archive")} onCancel={closeAction}>
          <SimpleConfirm
            confirmLabel={t("actions.archive")}
            onConfirm={async () => {
              const updated = await archiveProperty(property.id);
              afterAction(t("flash.archived"), updated);
            }}
          />
        </ActionModal>
      )}

      {action === "edit" && (
        <ActionModal title="Edit details" onCancel={closeAction}>
          <EditForm
            property={property}
            onSuccess={(updated) => afterAction("Property updated.", updated)}
          />
        </ActionModal>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
//  Sub-components (kept local to this page for clarity)
// ═══════════════════════════════════════════════════════════

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-line bg-card">
      <header className="border-b border-line px-4 py-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {title}
        </h2>
      </header>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  );
}

function ActionModal({
  title,
  onCancel,
  children,
}: {
  title: string;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  const tCommon = useTranslations("Admin.common");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-md border border-line bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-ink-muted hover:text-ink"
            aria-label={tCommon("cancel")}
          >
            ✕
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function ApproveForm({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess: (updated: PropertyAdminView) => void;
}) {
  const t = useTranslations("Admin.detail");
  const [note, setNote] = useState("");
  const [publish, setPublish] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await approveProperty(id, {
        note: note || undefined,
        publishImmediately: publish,
      });
      onSuccess(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <FormAlert>{error}</FormAlert>}
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={publish}
          onChange={(e) => setPublish(e.target.checked)}
          className="h-4 w-4 accent-brand"
        />
        {t("forms.approvePublishCheckbox")}
      </label>
      <div>
        <Label htmlFor="approve-note">{t("forms.approveNote")}</Label>
        <Textarea
          id="approve-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handle}
          disabled={submitting}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {submitting ? t("actions.submitting") : t("actions.approve")}
        </button>
      </div>
    </div>
  );
}

function RejectForm({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess: (updated: PropertyAdminView) => void;
}) {
  const t = useTranslations("Admin.detail");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(): Promise<void> {
    if (reason.trim().length < 5) {
      setError("Please write at least 5 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      onSuccess(await rejectProperty(id, reason.trim()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <FormAlert>{error}</FormAlert>}
      <div>
        <Label htmlFor="reject-reason">{t("forms.rejectReason")}</Label>
        <Textarea
          id="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handle}
          disabled={submitting}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
        >
          {submitting ? t("actions.submitting") : t("actions.reject")}
        </button>
      </div>
    </div>
  );
}

function RequestChangesForm({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess: (updated: PropertyAdminView) => void;
}) {
  const t = useTranslations("Admin.detail");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(): Promise<void> {
    if (note.trim().length < 5) {
      setError("Please write at least 5 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      onSuccess(await requestChanges(id, note.trim()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <FormAlert>{error}</FormAlert>}
      <div>
        <Label htmlFor="changes-note">{t("forms.changesNote")}</Label>
        <Textarea
          id="changes-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handle}
          disabled={submitting}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {submitting ? t("actions.submitting") : t("actions.requestChanges")}
        </button>
      </div>
    </div>
  );
}

function SimpleConfirm({
  confirmLabel,
  onConfirm,
}: {
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}) {
  const t = useTranslations("Admin.detail");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <FormAlert>{error}</FormAlert>}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handle}
          disabled={submitting}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {submitting ? t("actions.submitting") : confirmLabel}
        </button>
      </div>
    </div>
  );
}

function EditForm({
  property,
  onSuccess,
}: {
  property: PropertyAdminView;
  onSuccess: (updated: PropertyAdminView) => void;
}) {
  const [title, setTitle] = useState(property.title);
  const [price, setPrice] = useState(String(property.price));
  const [internalNotes, setInternalNotes] = useState(property.internalNotes ?? "");
  const [featured, setFeatured] = useState(property.isFeatured);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await updateAdminProperty(property.id, {
        title: title.trim(),
        price: Number(price),
        internalNotes: internalNotes || null,
        isFeatured: featured,
      });
      onSuccess(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <FormAlert>{error}</FormAlert>}
      <div>
        <Label htmlFor="edit-title">Title</Label>
        <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="edit-price">Price (BDT)</Label>
        <Input
          id="edit-price"
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="edit-notes">Internal Notes</Label>
        <Textarea
          id="edit-notes"
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          rows={3}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="h-4 w-4 accent-brand"
        />
        Featured
      </label>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handle}
          disabled={submitting}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}