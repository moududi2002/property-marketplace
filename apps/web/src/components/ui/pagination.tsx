// 📍 /apps/web/src/components/ui/pagination.tsx
//
// Minimal prev/next pagination. Traditional style — no numbered buttons
// unless you later need them. Works with PaginationMeta from shared-types.

"use client";

import type { PaginationMeta } from "@property-marketplace/shared-types";
import { cn } from "@/lib/utils";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  labels?: { previous?: string; next?: string; pageInfo?: (page: number, total: number) => string };
}

export function Pagination({ meta, onPageChange, labels }: PaginationProps) {
  const prevLabel = labels?.previous ?? "Previous";
  const nextLabel = labels?.next ?? "Next";
  const pageInfo =
    labels?.pageInfo?.(meta.page, meta.totalPages) ??
    `Page ${meta.page} of ${meta.totalPages}`;

  if (meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-line bg-surface px-4 py-3 text-sm">
      <button
        type="button"
        onClick={() => onPageChange(meta.page - 1)}
        disabled={!meta.hasPrev}
        className={cn(
          "rounded-sm border px-3 py-1 text-xs font-medium transition-colors",
          meta.hasPrev
            ? "border-line bg-card text-ink hover:border-brand hover:text-brand"
            : "cursor-not-allowed border-line text-ink-muted/60",
        )}
      >
        ← {prevLabel}
      </button>

      <span className="text-xs text-ink-muted">{pageInfo}</span>

      <button
        type="button"
        onClick={() => onPageChange(meta.page + 1)}
        disabled={!meta.hasNext}
        className={cn(
          "rounded-sm border px-3 py-1 text-xs font-medium transition-colors",
          meta.hasNext
            ? "border-line bg-card text-ink hover:border-brand hover:text-brand"
            : "cursor-not-allowed border-line text-ink-muted/60",
        )}
      >
        {nextLabel} →
      </button>
    </div>
  );
}