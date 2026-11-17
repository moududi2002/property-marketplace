// 📍 /apps/web/src/app/[locale]/sell/page.tsx

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SellWizard } from "./sell-wizard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Sell" });
  return { title: t("title") };
}

export default async function SellPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SellWizard />;
}