// 📍 /apps/web/src/app/[locale]/admin/layout.tsx
//
// Admin pages share this shell: sidebar + content area.
// The parent [locale]/layout.tsx already renders SiteHeader + Footer,
// so we sit right under them.

import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

interface AdminLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AdminGuard>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <AdminSidebar />
        <div className="min-w-0 flex-1 bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </div>
      </div>
    </AdminGuard>
  );
}