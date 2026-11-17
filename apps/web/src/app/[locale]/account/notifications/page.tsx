// 📍 /apps/web/src/app/[locale]/account/notifications/page.tsx

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/providers/notifications-provider";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const t = useTranslations("Notifications");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { items, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <section className="container-page py-12">
        <p className="text-sm text-ink-muted">{t("loading")}</p>
      </section>
    );
  }

  return (
    <section className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between border-b border-line pb-6">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{t("title")}</h1>
            <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllAsRead()}
              className="text-sm font-medium text-brand hover:underline"
            >
              {t("markAllRead")}
            </button>
          )}
        </header>

        {items.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ink-muted">{t("empty")}</p>
        ) : (
          <ul className="mt-6 divide-y divide-line rounded-md border border-line bg-card">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link ?? "/"}
                  onClick={() => {
                    if (!n.isRead) void markAsRead(n.id);
                  }}
                  className={cn(
                    "block px-5 py-4 transition-colors hover:bg-surface",
                    !n.isRead && "bg-brand-light/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm",
                          n.isRead ? "text-ink" : "font-semibold text-ink",
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-muted">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}