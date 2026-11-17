// 📍 /apps/web/src/components/auth/login-form.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-error";
import { FormAlert, FieldError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      await login(identifier, password);
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
        <Label htmlFor="identifier">{t("identifierLabel")}</Label>
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          placeholder={t("identifierPlaceholder")}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          invalid={!!fieldErrors.identifier?.length}
          required
        />
        <FieldError>{fieldErrors.identifier?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="password">{t("passwordLabel")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          invalid={!!fieldErrors.password?.length}
          required
        />
        <FieldError>{fieldErrors.password?.[0]}</FieldError>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {submitting ? t("loggingIn") : t("loginButton")}
      </button>

      <p className="text-center text-sm text-ink-muted">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          {t("registerLink")}
        </Link>
      </p>
    </form>
  );
}