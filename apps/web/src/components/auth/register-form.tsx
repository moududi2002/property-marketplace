// 📍 /apps/web/src/components/auth/register-form.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-error";
import { FormAlert, FieldError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function update<K extends keyof typeof form>(key: K, value: string): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      await register({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      router.push("/account");
      router.refresh();
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

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error && <FormAlert>{error}</FormAlert>}

      <div>
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input
          id="name"
          autoComplete="name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          invalid={!!fieldErrors.name?.length}
          required
        />
        <FieldError>{fieldErrors.name?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="phone">{t("phoneLabel")}</Label>
        <Input
          id="phone"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          invalid={!!fieldErrors.phone?.length}
          required
        />
        <FieldError>{fieldErrors.phone?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="email">
          {t("emailLabel")}{" "}
          <span className="text-xs font-normal text-ink-muted">({t("optional")})</span>
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          invalid={!!fieldErrors.email?.length}
        />
        <FieldError>{fieldErrors.email?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="password">{t("passwordLabel")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          invalid={!!fieldErrors.password?.length}
          required
        />
        <FieldError>{fieldErrors.password?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(e) => update("confirmPassword", e.target.value)}
          invalid={!!fieldErrors.confirmPassword?.length}
          required
        />
        <FieldError>{fieldErrors.confirmPassword?.[0]}</FieldError>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {submitting ? t("registering") : t("registerButton")}
      </button>

      <p className="text-center text-sm text-ink-muted">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}