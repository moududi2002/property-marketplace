// 📍 /apps/web/src/app/[locale]/account/account-guard.tsx
"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";

export function AccountGuard() {
  const t = useTranslations("Account");
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <section className="container-page py-16">
        <p className="text-sm text-ink-muted">{t("loading")}</p>
      </section>
    );
  }

  if (!user) return null;

  return (
    <section className="container-page py-12">
      <div className="max-w-3xl">
        <header className="border-b border-line pb-6">
          <h1 className="text-2xl font-semibold text-ink">{t("title")}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
        </header>

        <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-[180px_1fr]">
          <dt className="text-sm font-medium text-ink-muted">{t("fields.name")}</dt>
          <dd className="text-sm text-ink">{user.name}</dd>

          <dt className="text-sm font-medium text-ink-muted">{t("fields.phone")}</dt>
          <dd className="text-sm text-ink">
            {user.phone ?? "—"}
            {user.phoneVerified ? (
              <span className="ml-2 rounded-sm bg-brand-light px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand">
                {t("verified")}
              </span>
            ) : (
              <span className="ml-2 rounded-sm bg-sand px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                {t("unverified")}
              </span>
            )}
          </dd>

          <dt className="text-sm font-medium text-ink-muted">{t("fields.email")}</dt>
          <dd className="text-sm text-ink">{user.email ?? "—"}</dd>

          <dt className="text-sm font-medium text-ink-muted">{t("fields.role")}</dt>
          <dd className="text-sm text-ink">{user.role}</dd>
        </dl>
      </div>
    </section>
  );
}