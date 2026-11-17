// 📍 /apps/web/src/app/[locale]/admin/inquiries/[id]/page.tsx
//
// Admin inquiry detail. Two columns: buyer message + seller linkage
// on the left, status/actions/notes on the right.

"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import type { InquiryAdminView, InquiryStatus } from "@property-marketplace/shared-types";
import {
  addInquiryNote,
  getAdminInquiry,
  updateInquiryStatus,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api-error";
import { FormAlert } from "@/components/ui/form-error";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const STATUSES: InquiryStatus[] = ["NEW", "CONTACTED", "FOLLOW_UP", "CLOSED", "INVALID"];

export default function AdminInquiryDetailPage() {
  const t = useTranslations("Admin.inquiryDetail");
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [inquiry, setInquiry] = useState<InquiryAdminView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // Status form
  const [newStatus, setNewStatus] = useState<InquiryStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Note form
  const [noteBody, setNoteBody] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getAdminInquiry(id);
      setInquiry(data);
      setNewStatus(data.status);
      if (data.followUpDate) {
        // Convert ISO to `YYYY-MM-DDTHH:mm` for datetime-local input
        const d = new Date(data.followUpDate);
        setFollowUpDate(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate(),
          ).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(
            d.getMinutes(),
          ).padStart(2, "0")}`,
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("notFound"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function flashMessage(msg: string): void {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3035);
  }

  async function handleUpdateStatus(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!inquiry || !newStatus) return;
    setStatusError(null);
    setUpdatingStatus(true);
    try {
      const updated = await updateInquiryStatus(inquiry.id, {
        status: newStatus,
        note: statusNote.trim() || undefined,
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
      });
      setInquiry(updated);
      setStatusNote("");
      flashMessage(t("flash.statusUpdated"));
      router.refresh();
    } catch (err) {
      setStatusError(err instanceof ApiError ? err.message : t("genericError"));
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleAddNote(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!inquiry || noteBody.trim().length === 0) return;
    setNoteError(null);
    setAddingNote(true);
    try {
      const updated = await addInquiryNote(inquiry.id, noteBody.trim());
      setInquiry(updated);
      setNoteBody("");
      flashMessage(t("flash.noteAdded"));
    } catch (err) {
      setNoteError(err instanceof ApiError ? err.message : t("genericError"));
    } finally {
      setAddingNote(false);
    }
  }

  if (loading) return <p className="text-sm text-ink-muted">{t("loading")}</p>;
  if (error || !inquiry) {
    return (
      <>
        <p className="text-sm text-accent">{error ?? t("notFound")}</p>
        <Link
          href="/admin/inquiries"
          className="mt-4 inline-flex text-sm text-brand hover:underline"
        >
          ← {t("backToList")}
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/admin/inquiries" className="text-sm text-ink-muted hover:text-ink">
        ← {t("backToList")}
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{inquiry.buyerName}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {inquiry.buyerPhone}
            {inquiry.buyerEmail && ` · ${inquiry.buyerEmail}`}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {t("receivedAt")}: {new Date(inquiry.createdAt).toLocaleString()}
          </p>
        </div>
        <StatusBadge status={inquiry.status} />
      </header>

      {flash && (
        <div className="mt-4 rounded-md border border-brand/30 bg-brand-light px-4 py-2 text-sm text-brand">
          {flash}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ─── Left: buyer message + property + seller ─── */}
        <div className="space-y-6 lg:col-span-2">
          <Panel title={t("sections.message")}>
            {inquiry.message ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {inquiry.message}
              </p>
            ) : (
              <p className="text-sm text-ink-muted">{t("noMessage")}</p>
            )}
            {inquiry.preferredContactTime && (
              <p className="mt-3 text-xs text-ink-muted">
                <span className="font-medium">{t("fields.preferredTime")}:</span>{" "}
                {inquiry.preferredContactTime}
              </p>
            )}
          </Panel>

          <Panel title={t("sections.property")}>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-ink-muted">
                  {t("fields.property")}
                </dt>
                <dd className="mt-0.5">
                  <Link
                    href={`/admin/properties/${inquiry.propertyId}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {inquiry.propertyTitle} →
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-ink-muted">
                  {t("fields.slug")}
                </dt>
                <dd className="mt-0.5 text-ink">
                  <Link
                    href={`/property/${inquiry.propertySlug}`}
                    target="_blank"
                    className="text-brand hover:underline"
                  >
                    /{inquiry.propertySlug}
                  </Link>
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title={t("sections.seller")}>
            <dl className="space-y-2 text-sm">
              <Field label={t("fields.sellerName")}>{inquiry.sellerName}</Field>
              <Field label={t("fields.sellerPhone")}>
                {inquiry.sellerPhone ?? "—"}
              </Field>
              <Field label={t("fields.sellerEmail")}>
                {inquiry.sellerEmail ?? "—"}
              </Field>
            </dl>
          </Panel>

          {/* Notes timeline */}
          <Panel title={t("sections.notes")}>
            <form onSubmit={handleAddNote} className="space-y-3">
              {noteError && <FormAlert>{noteError}</FormAlert>}
              <div>
                <Label htmlFor="note-body">{t("forms.addNote")}</Label>
                <Textarea
                  id="note-body"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  rows={2}
                  placeholder={t("forms.addNotePlaceholder")}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingNote || noteBody.trim().length === 0}
                  className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
                >
                  {addingNote ? t("actions.saving") : t("actions.addNote")}
                </button>
              </div>
            </form>

            <div className="mt-4 border-t border-line pt-4">
              {inquiry.internalNotes.length === 0 ? (
                <p className="text-sm text-ink-muted">{t("notesEmpty")}</p>
              ) : (
                <ul className="space-y-3">
                  {inquiry.internalNotes.map((n) => (
                    <li
                      key={n.id}
                      className="border-l-2 border-line pl-3 text-sm"
                    >
                      <p className="text-ink">{n.body}</p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {n.authorName} · {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </div>

        {/* ─── Right: status form ──────────────────────── */}
        <div className="space-y-6">
          <Panel title={t("sections.status")}>
            <form onSubmit={handleUpdateStatus} className="space-y-3">
              {statusError && <FormAlert>{statusError}</FormAlert>}
              <div>
                <Label htmlFor="status">{t("fields.status")}</Label>
                <Select
                  id="status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as InquiryStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`statuses.${s}`)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="follow-up">{t("fields.followUpDate")}</Label>
                <input
                  id="follow-up"
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-line bg-card px-3 text-sm text-ink focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <Label htmlFor="status-note">{t("forms.statusNote")}</Label>
                <Textarea
                  id="status-note"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={2}
                  placeholder={t("forms.statusNotePlaceholder")}
                />
              </div>
              <button
                type="submit"
                disabled={updatingStatus || newStatus === inquiry.status && !statusNote.trim() && !followUpDate}
                className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
              >
                {updatingStatus ? t("actions.saving") : t("actions.updateStatus")}
              </button>
            </form>
          </Panel>

          <Panel title={t("sections.summary")}>
            <dl className="space-y-2 text-sm">
              <Field label={t("fields.contactCount")}>
                {String(inquiry.contactCount)}
              </Field>
              {inquiry.followUpDate && (
                <Field label={t("fields.followUpDate")}>
                  {new Date(inquiry.followUpDate).toLocaleString()}
                </Field>
              )}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}

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

function StatusBadge({ status }: { status: InquiryStatus }) {
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
      className={`inline-flex items-center rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${v.cls}`}
    >
      {v.label}
    </span>
  );
}