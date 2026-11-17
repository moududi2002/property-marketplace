// 📍 /apps/web/src/app/[locale]/home/divisions-grid.tsx

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { serverFetch } from "@/lib/api/server-fetch";

interface LocationNode {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  type: string;
}

export async function DivisionsGrid({ locale }: { locale: "en" | "bn" }) {
  const t = await getTranslations("Home.divisions");

  const res = await serverFetch<{ divisions: LocationNode[] }>(
    "/locations/divisions",
    3600,
  );
  const divisions = res?.divisions ?? [];
  if (divisions.length === 0) return null;

  return (
    <section className="border-t border-line bg-surface">
      <div className="container-page py-12">
        <div className="border-b border-line pb-3">
          <h2 className="text-xl font-semibold text-ink">{t("title")}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {divisions.map((d) => (
            <li key={d.id}>
              <Link
                href={`/properties?q=${encodeURIComponent(locale === "bn" ? d.nameBn : d.nameEn)}`}
                className="block rounded-md border border-line bg-card px-4 py-3 text-sm text-ink transition-colors hover:border-brand hover:text-brand"
              >
                {locale === "bn" ? d.nameBn : d.nameEn}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}