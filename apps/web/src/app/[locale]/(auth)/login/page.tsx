// 📍 /apps/web/src/app/[locale]/(auth)/login/page.tsx

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("loginTitle") };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <>
      <h1 className="text-xl font-semibold text-ink">{t("loginTitle")}</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">{t("loginSubtitle")}</p>
      <LoginForm />
    </>
  );
}