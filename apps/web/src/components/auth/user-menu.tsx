// 📍 /apps/web/src/components/auth/user-menu.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent): void => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (isLoading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-line" aria-hidden />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="hidden text-sm text-ink-muted transition-colors hover:text-ink sm:inline"
      >
        {t("loginLink")}
      </Link>
    );
  }

  const initial = user.name.trim().charAt(0).toUpperCase();

  async function handleLogout(): Promise<void> {
    setOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-50 w-56 rounded-md border border-line bg-card shadow-card-hover"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-medium text-ink">{user.name}</p>
            <p className="truncate text-xs text-ink-muted">
              {user.phone ?? user.email}
            </p>
          </div>

          <ul className="py-1 text-sm">
            <li>
              <Link
                href="/account"
                className={cn(
                  "block px-4 py-2 text-ink-muted hover:bg-surface hover:text-ink",
                )}
                onClick={() => setOpen(false)}
              >
                {t("myAccount")}
              </Link>
            </li>
            <li>
              <Link
                href="/account/properties"
                className="block px-4 py-2 text-ink-muted hover:bg-surface hover:text-ink"
                onClick={() => setOpen(false)}
              >
                {t("myProperties")}
              </Link>
            </li>
          </ul>

          <div className="border-t border-line">
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full px-4 py-2 text-left text-sm text-ink-muted hover:bg-surface hover:text-ink"
            >
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}