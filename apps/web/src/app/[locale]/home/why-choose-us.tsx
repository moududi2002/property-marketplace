// 📍 /apps/web/src/app/[locale]/home/why-choose-us.tsx

import { getTranslations } from "next-intl/server";

export async function WhyChooseUs() {
  const t = await getTranslations("Home.why");

  const items = [
    { key: "reviewed", titleKey: "reviewedTitle", bodyKey: "reviewedBody" },
    { key: "search", titleKey: "searchTitle", bodyKey: "searchBody" },
    { key: "support", titleKey: "supportTitle", bodyKey: "supportBody" },
    { key: "contact", titleKey: "contactTitle", bodyKey: "contactBody" },
  ];

  return (
    <section className="container-page py-12">
      <div className="border-b border-line pb-3">
        <h2 className="text-xl font-semibold text-ink">{t("title")}</h2>
      </div>
      <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <li
            key={it.key}
            className="rounded-md border border-line bg-card p-5"
          >
            <h3 className="text-sm font-semibold text-ink">
              {t(it.titleKey)}
            </h3>
            <p className="mt-1.5 text-sm text-ink-muted">
              {t(it.bodyKey)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}