// 📍 /apps/web/src/i18n/routing.ts
//
// Defines the supported locales and URL prefix strategy.
// "always" → every URL has /en or /bn prefix.

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "bn"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];