// 📍 /apps/web/src/app/[locale]/home/categories-grid.tsx

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { serverFetch } from "@/lib/api/server-fetch";

interface CategoryNode {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  parentId: string | null;
  children?: CategoryNode[];
}

export async function CategoriesGrid({ locale }: { locale: "en" | "bn" }) {
  const t = await getTranslations("Home.categories");

  const res = await serverFetch<{ categories: CategoryNode[] }>(
    "/categories/tree",
    3600,
  );
  const categories = res?.categories ?? [];
  if (categories.length === 0) return null;

  return (
    <section className="container-page py-12">
      <div className="border-b border-line pb-3">
        <h2 className="text-xl font-semibold text-ink">{t("title")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/properties?categorySlug=${c.slug}`}
              className="block rounded-md border border-line bg-card px-4 py-5 transition-colors hover:border-line-strong hover:bg-surface"
            >
              <p className="text-sm font-semibold text-ink">
                {locale === "bn" ? c.nameBn : c.nameEn}
              </p>
              {c.children && c.children.length > 0 && (
                <p className="mt-1 text-xs text-ink-muted">
                  {c.children.length} {t("subtypes")}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}