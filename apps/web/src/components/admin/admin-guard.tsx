// 📍 /apps/web/src/components/admin/admin-guard.tsx
//
// Client-side role gate.
//   • Not logged in → /login
//   • Logged in but not admin → /
//   • Allowed → render children

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";

interface AdminGuardProps {
  children: React.ReactNode;
  /** Restrict further to SUPER_ADMIN (used by the audit-logs page). */
  requireSuperAdmin?: boolean;
}

export function AdminGuard({ children, requireSuperAdmin = false }: AdminGuardProps) {
  const t = useTranslations("Admin.guard");
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const isAdmin = user.role === "MODERATOR" || user.role === "SUPER_ADMIN";
    if (!isAdmin) {
      router.replace("/");
      return;
    }

    if (requireSuperAdmin && user.role !== "SUPER_ADMIN") {
      router.replace("/admin");
    }
  }, [user, isLoading, router, requireSuperAdmin]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <p className="text-sm text-ink-muted">{t("loading")}</p>
      </div>
    );
  }

  if (!user) return null;
  const isAdmin = user.role === "MODERATOR" || user.role === "SUPER_ADMIN";
  if (!isAdmin) return null;
  if (requireSuperAdmin && user.role !== "SUPER_ADMIN") return null;

  return <>{children}</>;
}