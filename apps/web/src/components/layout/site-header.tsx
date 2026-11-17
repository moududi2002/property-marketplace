// 📍 /apps/web/src/components/layout/site-header.tsx
//
// Update: replace the static Login link with <UserMenu />, which
// shows "Login" when logged out and a dropdown when logged in.

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { UserMenu } from "@/components/auth/user-menu";
import { LanguageSwitcher } from "./language-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";


export function SiteHeader() {
  const t = useTranslations("Header");

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/properties?purpose=SALE", label: t("buy") },
    { href: "/properties?purpose=RENT", label: t("rent") },
    { href: "/categories", label: t("categories") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="shrink-0">
          <span className="text-lg font-semibold tracking-tight text-brand">
            Property Marketplace
          </span>
        </Link>

        <nav className="hidden lg:flex lg:items-center lg:gap-7 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-ink-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <span className="hidden h-4 w-px bg-line sm:inline" />
          <UserMenu />
          <Link
            href="/sell"
            className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
          >
            {t("postProperty")}
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
      <LanguageSwitcher />
      <span className="hidden h-4 w-px bg-line sm:inline" />
      <NotificationBell />   {/* ← নতুন */}
      <UserMenu />
      <Link
        href="/sell"
        className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
      >
        {t("postProperty")}
      </Link>
    </div>
    </header>
  );
}