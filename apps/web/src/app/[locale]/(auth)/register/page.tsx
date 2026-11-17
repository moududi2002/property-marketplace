// 📍 /apps/web/src/app/[locale]/(auth)/register/page.tsx

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RegisterForm } from "@/components/auth/register-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("registerTitle") };
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <>
      <h1 className="text-xl font-semibold text-ink">{t("registerTitle")}</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">{t("registerSubtitle")}</p>
      <RegisterForm />
    </>
  );
}