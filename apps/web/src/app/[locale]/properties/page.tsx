// 📍 /apps/web/src/app/[locale]/properties/page.tsx
//
// Public property search results. Sidebar filters + result cards.
// Filters are in the URL so results are shareable / bookmarkable.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import type { PaginatedResponse, PropertyCard as PC } from "@property-marketplace/shared-types";
import { listPublicProperties } from "@/lib/api/public-properties";
import { ApiError } from "@/lib/api-error";
import { PropertyCard } from "@/components/property/property-card";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function PropertiesListingPage() {
  const t = useTranslations("Properties");
  const router = useRouter();
  const searchParams = useSearchParams();

  const initial = useMemo(
    () => ({
      purpose: (searchParams.get("purpose") as "SALE" | "RENT" | "LEASE" | null) ?? undefined,
      q: searchParams.get("q") ?? "",
      categorySlug: searchParams.get("categorySlug") ?? "",
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
      bedrooms: searchParams.get("bedrooms") ?? "",
      sort: (searchParams.get("sort") as "newest" | "oldest" | "price_asc" | "price_desc" | null) ?? "newest",
      page: Number(searchParams.get("page") ?? "1"),
    }),
    [searchParams],
  );

  const [filters, setFilters] = useState(initial);
  const [data, setData] = useState<PaginatedResponse<PC> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listPublicProperties({
          purpose: filters.purpose,
          q: filters.q || undefined,
          categorySlug: filters.categorySlug || undefined,
          minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
          maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
          bedrooms: filters.bedrooms ? Number(filters.bedrooms) : undefined,
          sort: filters.sort,
          page,
          limit: 12,
        });
        setData(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("loadError"));
      } finally {
        setLoading(false);
      }
    },
    [filters, t],
  );

  useEffect(() => {
    void load(filters.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page]);

  function applyFilters(e: React.FormEvent): void {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (filters.purpose) qs.set("purpose", filters.purpose);
    if (filters.q) qs.set("q", filters.q);
    if (filters.categorySlug) qs.set("categorySlug", filters.categorySlug);
    if (filters.minPrice) qs.set("minPrice", filters.minPrice);
    if (filters.maxPrice) qs.set("maxPrice", filters.maxPrice);
    if (filters.bedrooms) qs.set("bedrooms", filters.bedrooms);
    if (filters.sort) qs.set("sort", filters.sort);
    qs.set("page", "1");
    router.push(`/properties?${qs.toString()}`);
    setFilters((f) => ({ ...f, page: 1 }));
    void load(1);
  }

  function setPurpose(purpose: "SALE" | "RENT" | "LEASE" | undefined): void {
    setFilters((f) => ({ ...f, purpose, page: 1 }));
  }

  function changePage(page: number): void {
    setFilters((f) => ({ ...f, page }));
  }

  return (
    <section className="container-page py-10">
      <header className="border-b border-line pb-6">
        <h1 className="text-2xl font-semibold text-ink">
          {filters.purpose === "RENT"
            ? t("titleRent")
            : filters.purpose === "SALE"
              ? t("titleBuy")
              : t("titleAll")}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* ─── Sidebar filters ─────────────────────────── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <form
            onSubmit={applyFilters}
            className="space-y-5 rounded-md border border-line bg-card p-5"
          >
            {/* Purpose */}
            <div>
              <Label>{t("filters.purpose")}</Label>
              <div className="mt-1 flex gap-1">
                {[
                  { key: undefined, labelKey: "filters.any" },
                  { key: "SALE" as const, labelKey: "filters.buy" },
                  { key: "RENT" as const, labelKey: "filters.rent" },
                ].map((p) => (
                  <button
                    key={String(p.key)}
                    type="button"
                    onClick={() => setPurpose(p.key)}
                    className={
                      "flex-1 rounded-sm border px-2 py-1.5 text-xs transition-colors " +
                      (filters.purpose === p.key
                        ? "border-brand bg-brand-light text-brand"
                        : "border-line text-ink-muted hover:text-ink")
                    }
                  >
                    {t(p.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="q">{t("filters.keyword")}</Label>
              <Input
                id="q"
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                placeholder={t("filters.keywordPlaceholder")}
              />
            </div>

            <div>
              <Label htmlFor="categorySlug">{t("filters.category")}</Label>
              <Select
                id="categorySlug"
                value={filters.categorySlug}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, categorySlug: e.target.value }))
                }
              >
                <option value="">{t("filters.anyCategory")}</option>
                <option value="apartment">Apartment</option>
                <option value="flat">Flat</option>
                <option value="house">House</option>
                <option value="plot">Plot</option>
                <option value="office">Office</option>
                <option value="shop">Shop</option>
              </Select>
            </div>

            <div>
              <Label>{t("filters.priceRange")} (BDT)</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder={t("filters.min")}
                  value={filters.minPrice}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, minPrice: e.target.value }))
                  }
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder={t("filters.max")}
                  value={filters.maxPrice}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, maxPrice: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bedrooms">{t("filters.bedrooms")}</Label>
              <Select
                id="bedrooms"
                value={filters.bedrooms}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, bedrooms: e.target.value }))
                }
              >
                <option value="">{t("filters.any")}</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="sort">{t("filters.sort")}</Label>
              <Select
                id="sort"
                value={filters.sort}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    sort: e.target.value as typeof filters.sort,
                  }))
                }
              >
                <option value="newest">{t("filters.sortNewest")}</option>
                <option value="oldest">{t("filters.sortOldest")}</option>
                <option value="price_asc">{t("filters.sortPriceAsc")}</option>
                <option value="price_desc">{t("filters.sortPriceDesc")}</option>
              </Select>
            </div>

            <Button type="submit" variant="primary" className="w-full">
              {t("filters.apply")}
            </Button>
          </form>
        </aside>

        {/* ─── Results ──────────────────────────────────── */}
        <div>
          {error && <p className="text-sm text-accent">{error}</p>}

          {loading || !data ? (
            <p className="text-sm text-ink-muted">{t("loading")}</p>
          ) : data.items.length === 0 ? (
            <div className="rounded-md border border-dashed border-line-strong p-10 text-center text-sm text-ink-muted">
              {t("noResults")}
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs text-ink-muted">
                {t("resultCount", { count: data.meta.total })}
              </p>
              <ul className="space-y-4">
                {data.items.map((p) => (
                  <li key={p.id}>
                    <PropertyCard property={p} />
                  </li>
                ))}
              </ul>
              <div className="mt-6 overflow-hidden rounded-md border border-line bg-card">
                <Pagination
                  meta={data.meta}
                  onPageChange={changePage}
                  labels={{
                    previous: t("pagination.previous"),
                    next: t("pagination.next"),
                    pageInfo: (page, total) =>
                      t("pagination.pageOf", { page, total }),
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}