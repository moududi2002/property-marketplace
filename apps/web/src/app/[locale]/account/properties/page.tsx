// 📍 /apps/web/src/app/[locale]/account/properties/page.tsx

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MyPropertiesList } from "./my-properties-list";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MyProperties" });
  return { title: t("title") };
}

export default async function MyPropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MyPropertiesList />;
}