// 📍 /apps/web/src/lib/fonts.ts
//
// Two font families, both loaded via next/font/google so they
// are self-hosted (no external requests, no layout shift).
//
// Latin text → Inter. Bengali text → Noto Sans Bengali.
// Browser automatically falls through to the correct font.

import { Inter, Noto_Sans_Bengali } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-noto-bengali",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});