// 📍 /apps/web/src/i18n/navigation.ts
//
// Locale-aware navigation helpers.
// Use these instead of next/link and next/navigation to preserve
// the current locale in the URL automatically.

import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);