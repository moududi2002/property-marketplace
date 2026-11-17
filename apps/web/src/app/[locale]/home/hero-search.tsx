// 📍 /apps/web/src/app/[locale]/home/hero-search.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function HeroSearch() {
  const t = useTranslations("Home");
  const router = useRouter();

  const [purpose, setPurpose] = useState<"SALE" | "RENT">("SALE");
  const [categorySlug, setCategorySlug] = useState("");
  const [q, setQ] = useState("");

  function onSearch(e: FormEvent): void {
    e.preventDefault();
    const qs = new URLSearchParams();
    qs.set("purpose", purpose);
    if (categorySlug) qs.set("categorySlug", categorySlug);
    if (q) qs.set("q", q);
    router.push(`/properties?${qs.toString()}`);
  }

  return (
    <form
      onSubmit={onSearch}
      className="mt-8 max-w-4xl rounded-md border border-line bg-card shadow-card"
    >
      <div className="grid gap-0 md:grid-cols-[auto_1fr_1fr_auto]">
        <div className="flex items-center gap-1 border-b border-line p-3 md:border-b-0 md:border-r">
          <button
            type="button"
            onClick={() => setPurpose("SALE")}
            className={
              "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors " +
              (purpose === "SALE"
                ? "bg-brand-light text-brand"
                : "text-ink-muted hover:text-ink")
            }
          >
            {t("searchBuy")}
          </button>
          <button
            type="button"
            onClick={() => setPurpose("RENT")}
            className={
              "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors " +
              (purpose === "RENT"
                ? "bg-brand-light text-brand"
                : "text-ink-muted hover:text-ink")
            }
          >
            {t("searchRent")}
          </button>
        </div>

        <div className="border-b border-line px-4 py-3 md:border-b-0 md:border-r">
          <label className="block text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            {t("searchType")}
          </label>
          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="mt-1 w-full bg-transparent text-sm text-ink focus:outline-none"
          >
            <option value="">{t("searchTypePlaceholder")}</option>
            <option value="apartment">Apartment</option>
            <option value="flat">Flat</option>
            <option value="house">House</option>
            <option value="plot">Plot</option>
            <option value="office">Office</option>
            <option value="shop">Shop</option>
          </select>
        </div>

        <div className="border-b border-line px-4 py-3 md:border-b-0 md:border-r">
          <label className="block text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            {t("searchLocation")}
          </label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchLocationPlaceholder")}
            className="mt-1 w-full bg-transparent text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none"
          />
        </div>

        <div className="p-3">
          <button
            type="submit"
            className="inline-flex h-full min-h-11 w-full items-center justify-center rounded-md bg-brand px-6 text-sm font-medium text-white transition-colors hover:bg-brand-hover md:w-auto"
          >
            {t("searchButton")}
          </button>
        </div>
      </div>
    </form>
  );
}