// 📍 /apps/web/src/app/[locale]/account/page.tsx
//
// Protected page. If unauthenticated, redirects to /login.
// Uses a small client component for the actual guard+render, because
// the "am I logged in?" state lives in the client-side AuthProvider.

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountGuard } from "./account-guard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("title") };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AccountGuard />;
}