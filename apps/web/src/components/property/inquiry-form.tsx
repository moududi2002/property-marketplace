// 📍 /apps/web/src/components/property/inquiry-form.tsx
//
// Buyer submits interest. No direct seller contact — this goes to
// the admin, who then coordinates with the seller.

"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-error";
import { submitInquiry } from "@/lib/api/public-properties";
import { FieldError, FormAlert } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface InquiryFormProps {
  propertyId: string;
}

export function InquiryForm({ propertyId }: InquiryFormProps) {
  const t = useTranslations("InquiryForm");
  const { user } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [preferredContactTime, setPreferredContactTime] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      await submitInquiry({
        propertyId,
        buyerName: name.trim(),
        buyerPhone: phone.trim(),
        buyerEmail: email.trim() || undefined,
        message: message.trim() || undefined,
        preferredContactTime: preferredContactTime.trim() || undefined,
      });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setError(t("genericError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-md border border-brand/30 bg-brand-light px-4 py-5 text-sm text-brand">
        <p className="font-semibold">{t("successTitle")}</p>
        <p className="mt-1 text-brand/90">{t("successMessage")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <FormAlert>{error}</FormAlert>}

      <div>
        <Label htmlFor="inq-name">{t("name")}</Label>
        <Input
          id="inq-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          invalid={!!fieldErrors.buyerName?.length}
          required
        />
        <FieldError>{fieldErrors.buyerName?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="inq-phone">{t("phone")}</Label>
        <Input
          id="inq-phone"
          inputMode="numeric"
          placeholder="01XXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          invalid={!!fieldErrors.buyerPhone?.length}
          required
        />
        <FieldError>{fieldErrors.buyerPhone?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="inq-email">
          {t("email")}{" "}
          <span className="text-xs font-normal text-ink-muted">({t("optional")})</span>
        </Label>
        <Input
          id="inq-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          invalid={!!fieldErrors.buyerEmail?.length}
        />
        <FieldError>{fieldErrors.buyerEmail?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="inq-time">
          {t("preferredContactTime")}{" "}
          <span className="text-xs font-normal text-ink-muted">({t("optional")})</span>
        </Label>
        <Input
          id="inq-time"
          value={preferredContactTime}
          onChange={(e) => setPreferredContactTime(e.target.value)}
          placeholder={t("preferredContactTimePlaceholder")}
        />
      </div>

      <div>
        <Label htmlFor="inq-message">
          {t("message")}{" "}
          <span className="text-xs font-normal text-ink-muted">({t("optional")})</span>
        </Label>
        <Textarea
          id="inq-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("messagePlaceholder")}
          invalid={!!fieldErrors.message?.length}
        />
        <FieldError>{fieldErrors.message?.[0]}</FieldError>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {submitting ? t("sending") : t("send")}
      </button>

      <p className="text-xs text-ink-muted">{t("privacyNote")}</p>
    </form>
  );
}