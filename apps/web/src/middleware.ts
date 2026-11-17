// 📍 /apps/web/src/middleware.ts
//
// Handles locale detection & redirection.
// A request to / → /en (or /bn depending on Accept-Language header).

import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip /api, /_next, /_vercel, and any path containing a dot (files)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};