// 📍 /apps/web/src/components/ui/status-badge.tsx
//
// Muted, classic status pill. No bright colors — matches the
// editorial real-estate palette.

import type { PropertyStatus } from "@property-marketplace/shared-types";

const STATUS_LABELS: Record<PropertyStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-sand text-ink-muted" },
  PENDING_REVIEW: { label: "Pending Review", className: "bg-sand-dark text-ink" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-sand-dark text-ink" },
  CHANGES_REQUESTED: { label: "Changes Requested", className: "bg-accent/15 text-accent" },
  APPROVED: { label: "Approved", className: "bg-brand-light text-brand" },
  PUBLISHED: { label: "Published", className: "bg-brand-light text-brand" },
  REJECTED: { label: "Rejected", className: "bg-accent/15 text-accent" },
  ARCHIVED: { label: "Archived", className: "bg-surface text-ink-muted" },
  SOLD: { label: "Sold", className: "bg-line text-ink-muted" },
  RENTED: { label: "Rented", className: "bg-line text-ink-muted" },
};

export function StatusBadge({ status }: { status: PropertyStatus }) {
  const config = STATUS_LABELS[status];
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}