// 📍 /apps/web/src/app/[locale]/sell/sell-wizard.tsx
//
// 4-step wizard. Step 4 = Images; Submit for Review moves here.
// Step 3's "Save & Continue" now advances to Step 4 instead of submitting.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-error";
import {
  fetchCategories,
  fetchLocationsTree,
  type CategoryNode,
  type LocationNode,
} from "@/lib/api/catalog";
import {
  createDraft,
  getMyProperty,
  submitProperty,
  updateDraft,
  type PropertyDraftPayload,
} from "@/lib/api/properties";
import { listImages } from "@/lib/api/images";
import { FormAlert, FieldError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/sell/image-uploader";

type Step = 1 | 2 | 3 | 4;

interface FormState {
  purpose: "SALE" | "RENT" | "LEASE";
  categoryId: string;
  title: string;
  description: string;
  divisionId: string;
  districtId: string;
  areaLocality: string;
  fullAddress: string;
  price: string;
  priceUnit: "TOTAL" | "PER_KATHA" | "PER_SQFT" | "PER_MONTH";
  isNegotiable: boolean;
  landSize: string;
  landSizeUnit: "KATHA" | "BIGHA" | "DECIMAL" | "ACRE" | "SQFT" | "SQM";
  buildingSizeSqft: string;
  bedrooms: string;
  bathrooms: string;
  floors: string;
  condition: "" | "NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "NEEDS_RENOVATION";
  ownershipType: "" | "FREEHOLD" | "LEASEHOLD" | "GOVERNMENT" | "UNKNOWN";
  sellerNotes: string;
}

const INITIAL_FORM: FormState = {
  purpose: "SALE",
  categoryId: "",
  title: "",
  description: "",
  divisionId: "",
  districtId: "",
  areaLocality: "",
  fullAddress: "",
  price: "",
  priceUnit: "TOTAL",
  isNegotiable: false,
  landSize: "",
  landSizeUnit: "KATHA",
  buildingSizeSqft: "",
  bedrooms: "",
  bathrooms: "",
  floors: "",
  condition: "",
  ownershipType: "",
  sellerNotes: "",
};

export function SellWizard() {
  const t = useTranslations("Sell");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [stepError, setStepError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  // Catalog
  useEffect(() => {
    (async () => {
      try {
        const [cats, locs] = await Promise.all([
          fetchCategories(),
          fetchLocationsTree(),
        ]);
        setCategories(cats);
        setLocations(locs);
      } finally {
        setCatalogLoading(false);
      }
    })();
  }, []);

  // Resume draft
  useEffect(() => {
    const draftId = searchParams.get("draft");
    if (!draftId) return;
    (async () => {
      try {
        const p = await getMyProperty(draftId);
        setPropertyId(p.id);
        setForm((prev) => ({ ...prev, title: p.title }));
      } catch {
        /* ignore */
      }
    })();
  }, [searchParams]);

  // Refresh image count whenever we land on Step 4
  useEffect(() => {
    if (step !== 4 || !propertyId) return;
    (async () => {
      try {
        const list = await listImages(propertyId);
        setImageCount(list.length);
      } catch {
        /* ignore */
      }
    })();
  }, [step, propertyId]);

  const leafCategories = useMemo(
    () => categories.filter((c) => !c.children || c.children.length === 0),
    [categories],
  );

  const selectedDivision = locations.find((d) => d.id === form.divisionId);
  const districts = selectedDivision?.children ?? [];

  function update<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStepError(null);
    if (key === "divisionId") {
      setForm((prev) => ({ ...prev, divisionId: value as string, districtId: "" }));
    }
  }

  function buildPayload(): PropertyDraftPayload {
    const numOrUndef = (s: string): number | undefined => {
      if (s.trim() === "") return undefined;
      const n = Number(s);
      return Number.isFinite(n) ? n : undefined;
    };
    return {
      purpose: form.purpose,
      categoryId: form.categoryId || undefined,
      title: form.title.trim() || undefined,
      description: form.description.trim() || undefined,
      divisionId: form.divisionId || undefined,
      districtId: form.districtId || undefined,
      areaLocality: form.areaLocality.trim() || undefined,
      fullAddress: form.fullAddress.trim() || undefined,
      price: numOrUndef(form.price),
      priceUnit: form.priceUnit,
      isNegotiable: form.isNegotiable,
      landSize: numOrUndef(form.landSize),
      landSizeUnit: form.landSizeUnit,
      buildingSizeSqft: numOrUndef(form.buildingSizeSqft),
      bedrooms: numOrUndef(form.bedrooms),
      bathrooms: numOrUndef(form.bathrooms),
      floors: numOrUndef(form.floors),
      condition: form.condition || undefined,
      ownershipType: form.ownershipType || undefined,
      sellerNotes: form.sellerNotes.trim() || undefined,
    };
  }

  async function persist(): Promise<string> {
    const payload = buildPayload();
    if (propertyId) {
      await updateDraft(propertyId, payload);
      return propertyId;
    }
    const created = await createDraft(payload);
    setPropertyId(created.id);
    return created.id;
  }

  function validateStep(): boolean {
    setStepError(null);
    setFieldErrors({});

    if (step === 1) {
      if (!form.categoryId) {
        setStepError(t("err.categoryRequired"));
        return false;
      }
      if (form.title.trim().length < 5) {
        setFieldErrors({ title: [t("err.titleTooShort")] });
        return false;
      }
      if (form.description.trim().length < 20) {
        setFieldErrors({ description: [t("err.descTooShort")] });
        return false;
      }
    }
    if (step === 2) {
      if (!form.divisionId) {
        setStepError(t("err.divisionRequired"));
        return false;
      }
      if (!form.districtId) {
        setStepError(t("err.districtRequired"));
        return false;
      }
      if (form.areaLocality.trim().length < 2) {
        setFieldErrors({ areaLocality: [t("err.areaRequired")] });
        return false;
      }
      if (form.fullAddress.trim().length < 5) {
        setFieldErrors({ fullAddress: [t("err.addressRequired")] });
        return false;
      }
    }
    if (step === 3) {
      if (form.price.trim() === "" || Number(form.price) <= 0) {
        setFieldErrors({ price: [t("err.priceRequired")] });
        return false;
      }
    }
    return true;
  }

  async function handleSaveAndContinue(): Promise<void> {
    if (!validateStep()) return;
    setSubmitting(true);
    setError(null);
    try {
      await persist();
      setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDraft(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      await persist();
      router.push("/account/properties");
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitForReview(): Promise<void> {
    if (!propertyId) {
      setStepError(t("err.completeEarlierSteps"));
      return;
    }
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    setStepError(null);
    try {
      const id = await persist();
      await submitProperty(id);
      router.push(`/account/properties/${id}`);
      router.refresh();
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleApiError(err: unknown): void {
    if (err instanceof ApiError) {
      setError(err.message);
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
    } else {
      setError(t("err.generic"));
    }
  }

  if (authLoading || catalogLoading) {
    return (
      <section className="container-page py-16">
        <p className="text-sm text-ink-muted">{t("loading")}</p>
      </section>
    );
  }

  return (
    <section className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-line pb-6">
          <h1 className="text-2xl font-semibold text-ink">{t("title")}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
        </header>

        {/* Stepper */}
        <ol className="mt-8 flex items-center gap-2 text-xs text-ink-muted">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className="flex flex-1 items-center gap-2">
              <span
                className={
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold " +
                  (step === n
                    ? "bg-brand text-white"
                    : step > n
                      ? "bg-brand-light text-brand"
                      : "bg-line text-ink-muted")
                }
              >
                {n}
              </span>
              <span className={step === n ? "font-medium text-ink" : ""}>
                {t(`step.${n}`)}
              </span>
              {n < 4 && <span className="h-px flex-1 bg-line" />}
            </li>
          ))}
        </ol>

        <div className="mt-8 space-y-5 rounded-md border border-line bg-card p-6 shadow-card">
          {error && <FormAlert>{error}</FormAlert>}
          {stepError && <FormAlert>{stepError}</FormAlert>}

          {/* ─── STEP 1: Basic info ─────────────────────── */}
          {step === 1 && (
            <>
              <div>
                <Label>{t("fields.purpose")}</Label>
                <div className="mt-1 flex gap-2">
                  {(["SALE", "RENT", "LEASE"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => update("purpose", p)}
                      className={
                        "rounded-sm border px-3 py-1.5 text-sm transition-colors " +
                        (form.purpose === p
                          ? "border-brand bg-brand-light text-brand"
                          : "border-line text-ink-muted hover:text-ink")
                      }
                    >
                      {t(`purpose.${p}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="categoryId">{t("fields.category")}</Label>
                <Select
                  id="categoryId"
                  value={form.categoryId}
                  onChange={(e) => update("categoryId", e.target.value)}
                >
                  <option value="">{t("placeholders.category")}</option>
                  {leafCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn} / {c.nameBn}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="title">{t("fields.title")}</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder={t("placeholders.title")}
                  invalid={!!fieldErrors.title?.length}
                />
                <FieldError>{fieldErrors.title?.[0]}</FieldError>
              </div>

              <div>
                <Label htmlFor="description">{t("fields.description")}</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder={t("placeholders.description")}
                  invalid={!!fieldErrors.description?.length}
                  rows={6}
                />
                <FieldError>{fieldErrors.description?.[0]}</FieldError>
              </div>
            </>
          )}

          {/* ─── STEP 2: Location ───────────────────────── */}
          {step === 2 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="divisionId">{t("fields.division")}</Label>
                  <Select
                    id="divisionId"
                    value={form.divisionId}
                    onChange={(e) => update("divisionId", e.target.value)}
                  >
                    <option value="">{t("placeholders.division")}</option>
                    {locations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameEn} / {d.nameBn}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="districtId">{t("fields.district")}</Label>
                  <Select
                    id="districtId"
                    value={form.districtId}
                    onChange={(e) => update("districtId", e.target.value)}
                    disabled={!form.divisionId}
                  >
                    <option value="">{t("placeholders.district")}</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameEn} / {d.nameBn}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="areaLocality">{t("fields.areaLocality")}</Label>
                <Input
                  id="areaLocality"
                  value={form.areaLocality}
                  onChange={(e) => update("areaLocality", e.target.value)}
                  placeholder={t("placeholders.areaLocality")}
                  invalid={!!fieldErrors.areaLocality?.length}
                />
                <FieldError>{fieldErrors.areaLocality?.[0]}</FieldError>
              </div>

              <div>
                <Label htmlFor="fullAddress">{t("fields.fullAddress")}</Label>
                <Textarea
                  id="fullAddress"
                  value={form.fullAddress}
                  onChange={(e) => update("fullAddress", e.target.value)}
                  placeholder={t("placeholders.fullAddress")}
                  invalid={!!fieldErrors.fullAddress?.length}
                  rows={3}
                />
                <FieldError>{fieldErrors.fullAddress?.[0]}</FieldError>
              </div>
            </>
          )}

          {/* ─── STEP 3: Details ────────────────────────── */}
          {step === 3 && (
            <>
              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <div>
                  <Label htmlFor="price">{t("fields.price")} (BDT)</Label>
                  <Input
                    id="price"
                    inputMode="numeric"
                    value={form.price}
                    onChange={(e) => update("price", e.target.value)}
                    placeholder="0"
                    invalid={!!fieldErrors.price?.length}
                  />
                  <FieldError>{fieldErrors.price?.[0]}</FieldError>
                </div>
                <div>
                  <Label htmlFor="priceUnit">{t("fields.priceUnit")}</Label>
                  <Select
                    id="priceUnit"
                    value={form.priceUnit}
                    onChange={(e) =>
                      update("priceUnit", e.target.value as FormState["priceUnit"])
                    }
                  >
                    <option value="TOTAL">{t("priceUnit.TOTAL")}</option>
                    <option value="PER_KATHA">{t("priceUnit.PER_KATHA")}</option>
                    <option value="PER_SQFT">{t("priceUnit.PER_SQFT")}</option>
                    <option value="PER_MONTH">{t("priceUnit.PER_MONTH")}</option>
                  </Select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.isNegotiable}
                  onChange={(e) => update("isNegotiable", e.target.checked)}
                  className="h-4 w-4 rounded-sm border-line accent-brand"
                />
                {t("fields.negotiable")}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="landSize">{t("fields.landSize")}</Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      id="landSize"
                      inputMode="numeric"
                      value={form.landSize}
                      onChange={(e) => update("landSize", e.target.value)}
                      placeholder="0"
                    />
                    <Select
                      value={form.landSizeUnit}
                      onChange={(e) =>
                        update("landSizeUnit", e.target.value as FormState["landSizeUnit"])
                      }
                      className="w-32"
                    >
                      <option value="KATHA">{t("areaUnit.KATHA")}</option>
                      <option value="BIGHA">{t("areaUnit.BIGHA")}</option>
                      <option value="DECIMAL">{t("areaUnit.DECIMAL")}</option>
                      <option value="ACRE">{t("areaUnit.ACRE")}</option>
                      <option value="SQFT">{t("areaUnit.SQFT")}</option>
                      <option value="SQM">{t("areaUnit.SQM")}</option>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="buildingSizeSqft">
                    {t("fields.buildingSize")} (sq.ft.)
                  </Label>
                  <Input
                    id="buildingSizeSqft"
                    inputMode="numeric"
                    value={form.buildingSizeSqft}
                    onChange={(e) => update("buildingSizeSqft", e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="bedrooms">{t("fields.bedrooms")}</Label>
                  <Input
                    id="bedrooms"
                    inputMode="numeric"
                    value={form.bedrooms}
                    onChange={(e) => update("bedrooms", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">{t("fields.bathrooms")}</Label>
                  <Input
                    id="bathrooms"
                    inputMode="numeric"
                    value={form.bathrooms}
                    onChange={(e) => update("bathrooms", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="floors">{t("fields.floors")}</Label>
                  <Input
                    id="floors"
                    inputMode="numeric"
                    value={form.floors}
                    onChange={(e) => update("floors", e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="condition">{t("fields.condition")}</Label>
                  <Select
                    id="condition"
                    value={form.condition}
                    onChange={(e) =>
                      update("condition", e.target.value as FormState["condition"])
                    }
                  >
                    <option value="">{t("placeholders.optional")}</option>
                    <option value="NEW">{t("condition.NEW")}</option>
                    <option value="EXCELLENT">{t("condition.EXCELLENT")}</option>
                    <option value="GOOD">{t("condition.GOOD")}</option>
                    <option value="FAIR">{t("condition.FAIR")}</option>
                    <option value="NEEDS_RENOVATION">{t("condition.NEEDS_RENOVATION")}</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ownershipType">{t("fields.ownership")}</Label>
                  <Select
                    id="ownershipType"
                    value={form.ownershipType}
                    onChange={(e) =>
                      update("ownershipType", e.target.value as FormState["ownershipType"])
                    }
                  >
                    <option value="">{t("placeholders.optional")}</option>
                    <option value="FREEHOLD">{t("ownership.FREEHOLD")}</option>
                    <option value="LEASEHOLD">{t("ownership.LEASEHOLD")}</option>
                    <option value="GOVERNMENT">{t("ownership.GOVERNMENT")}</option>
                    <option value="UNKNOWN">{t("ownership.UNKNOWN")}</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="sellerNotes">
                  {t("fields.sellerNotes")}{" "}
                  <span className="text-xs font-normal text-ink-muted">
                    ({t("private")})
                  </span>
                </Label>
                <Textarea
                  id="sellerNotes"
                  value={form.sellerNotes}
                  onChange={(e) => update("sellerNotes", e.target.value)}
                  placeholder={t("placeholders.sellerNotes")}
                  rows={3}
                />
              </div>
            </>
          )}

          {/* ─── STEP 4: Images ─────────────────────────── */}
          {step === 4 && propertyId && (
            <>
              <div>
                <h2 className="text-base font-semibold text-ink">
                  {t("images.title")}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {t("images.subtitle")}
                </p>
              </div>

              <ImageUploader propertyId={propertyId} />

              <p className="text-xs text-ink-muted">{t("images.hint")}</p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
                disabled={submitting}
                className="h-10 rounded-md border border-line bg-card px-4 text-sm text-ink-muted transition-colors hover:text-ink disabled:opacity-60"
              >
                {t("actions.back")}
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting}
              className="h-10 rounded-md border border-line bg-card px-4 text-sm text-ink transition-colors hover:bg-surface disabled:opacity-60"
            >
              {t("actions.saveDraft")}
            </button>
          </div>

          {step < 4 ? (
            <button
              type="button"
              onClick={handleSaveAndContinue}
              disabled={submitting}
              className="h-10 rounded-md bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {submitting ? t("actions.saving") : t("actions.saveAndContinue")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={submitting}
              className="h-10 rounded-md bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {submitting ? t("actions.submitting") : t("actions.submitForReview")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}