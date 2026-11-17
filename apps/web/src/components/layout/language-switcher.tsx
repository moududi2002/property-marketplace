// 📍 /apps/web/src/components/layout/language-switcher.tsx
"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: "en" | "bn"): void => {
    if (next === locale) return;
    startTransition(() => {
      // pathname comes WITHOUT locale prefix from next-intl's helper
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div className="flex items-center gap-1.5 text-sm select-none">
      <button
        type="button"
        onClick={() => switchTo("en")}
        disabled={isPending}
        className={cn(
          "transition-colors",
          locale === "en"
            ? "font-semibold text-brand"
            : "text-ink-muted hover:text-ink",
        )}
      >
        EN
      </button>
      <span className="text-line-strong">/</span>
      <button
        type="button"
        onClick={() => switchTo("bn")}
        disabled={isPending}
        className={cn(
          "transition-colors",
          locale === "bn"
            ? "font-semibold text-brand"
            : "text-ink-muted hover:text-ink",
        )}
      >
        বাংলা
      </button>
    </div>
  );
}