// 📍 /apps/web/src/app/[locale]/account/properties/[id]/page.tsx

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DraftEditor } from "./draft-editor";

export const metadata: Metadata = { title: "Property" };

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <DraftEditor propertyId={id} />;
}