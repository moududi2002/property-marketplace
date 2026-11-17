// 📍 /apps/web/src/components/notifications/notification-popover.tsx
"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useNotifications } from "@/providers/notifications-provider";
import { cn } from "@/lib/utils";

interface Props {
  onClose: () => void;
}

export function NotificationPopover({ onClose }: Props) {
  const t = useTranslations("Notifications");
  const { items, unreadCount, markAsRead, markAllAsRead, loading } =
    useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", key);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-md border border-line bg-card shadow-lg sm:w-96"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-semibold text-ink">
          {t("title")}
          {unreadCount > 0 && (
            <span className="ml-2 rounded-sm bg-brand px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {unreadCount} {t("new")}
            </span>
          )}
        </p>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            className="text-xs font-medium text-brand hover:underline"
          >
            {t("markAllRead")}
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-6 text-center text-sm text-ink-muted">
            {t("loading")}
          </p>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-muted">
            {t("empty")}
          </p>
        ) : (
          <ul>
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "border-b border-line last:border-0",
                  !n.isRead && "bg-brand-light/30",
                )}
              >
                <Link
                  href={n.link ?? "/"}
                  onClick={() => {
                    if (!n.isRead) void markAsRead(n.id);
                    onClose();
                  }}
                  className="block px-4 py-3 transition-colors hover:bg-surface"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm",
                        n.isRead ? "text-ink" : "font-medium text-ink",
                      )}
                    >
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">
                    {n.body}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-muted">
                    {formatRelative(n.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-line bg-surface px-4 py-2.5 text-center">
        <Link
          href="/account/notifications"
          onClick={onClose}
          className="text-xs font-medium text-brand hover:underline"
        >
          {t("viewAll")} →
        </Link>
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}