// 📍 /apps/web/src/app/[locale]/page.tsx
//
// Homepage — Server Component. Renders hero (with client search form)
// + featured + recent + categories + divisions + why-choose-us.
// Each section handles its own data with an ISR cache window.

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSearch } from "./home/hero-search";
import { FeaturedSection } from "./home/featured-section";
import { RecentSection } from "./home/recent-section";
import { CategoriesGrid } from "./home/categories-grid";
import { DivisionsGrid } from "./home/divisions-grid";
import { WhyChooseUs } from "./home/why-choose-us";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        bn: "/bn",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale,
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  return (
    <>
      {/* ─── Hero + search ──────────────────────────────── */}
      <section className="border-b border-line bg-surface">
        <div className="container-page py-14 md:py-20">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-muted md:text-lg">
              {t("heroSubtitle")}
            </p>
          </div>
          <HeroSearch />
        </div>
      </section>

      <FeaturedSection />
      <CategoriesGrid locale={locale as "en" | "bn"} />
      <RecentSection />
      <DivisionsGrid locale={locale as "en" | "bn"} />
      <WhyChooseUs />
    </>
  );
}