// 📍 /apps/web/src/components/admin/admin-sidebar.tsx
//
// Left navigation for the admin panel.
// Traditional list — text labels + tiny dot indicators, no icons.

"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  labelKey: string;
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", labelKey: "dashboard" },
  { href: "/admin/properties", labelKey: "properties" },
   { href: "/admin/inquiries", labelKey: "inquiries" },  
  { href: "/admin/users", labelKey: "users" },
  { href: "/admin/audit-logs", labelKey: "auditLogs", superAdminOnly: true },
];

export function AdminSidebar() {
  const t = useTranslations("Admin.nav");
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const visible = NAV_ITEMS.filter(
    (item) => !item.superAdminOnly || user.role === "SUPER_ADMIN",
  );

  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-card lg:block">
      <div className="border-b border-line px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          {t("heading")}
        </p>
        <p className="mt-1 text-sm font-semibold text-ink">Property Marketplace</p>
      </div>

      <nav className="py-3">
        <ul className="space-y-0.5">
          {visible.map((item) => {
            // Match exact on /admin, prefix on sub-routes
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 border-l-2 px-5 py-2 text-sm transition-colors",
                    isActive
                      ? "border-brand bg-brand-light font-medium text-brand"
                      : "border-transparent text-ink-muted hover:bg-surface hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "h-1 w-1 rounded-full",
                      isActive ? "bg-brand" : "bg-line-strong",
                    )}
                  />
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line px-5 py-4 text-[11px] text-ink-muted">
        <p className="truncate">{user.name}</p>
        <p className="mt-0.5 uppercase tracking-wide">{user.role.replace("_", " ")}</p>
      </div>
    </aside>
  );
}