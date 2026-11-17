// 📍 /apps/web/src/components/layout/site-footer.tsx

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("Footer");
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: "/", label: t("linkHome") },
    { href: "/properties?purpose=SALE", label: t("linkBuy") },
    { href: "/properties?purpose=RENT", label: t("linkRent") },
    { href: "/sell", label: t("linkPost") },
    { href: "/about", label: t("linkAbout") },
    { href: "/contact", label: t("linkContact") },
  ];

  const divisions = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna"];

  return (
    <footer className="mt-16 border-t border-line bg-brand text-white/90">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        {/* ── About ───────────────────────────────────── */}
        <div>
          <h3 className="text-base font-semibold text-white">{t("aboutTitle")}</h3>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
            {t("aboutText")}
          </p>
        </div>

        {/* ── Quick Links ─────────────────────────────── */}
        <div>
          <h3 className="text-base font-semibold text-white">{t("quickLinks")}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-white/75 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Locations ───────────────────────────────── */}
        <div>
          <h3 className="text-base font-semibold text-white">
            {t("locationsTitle")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {divisions.map((div) => (
              <li key={div}>
                <Link
                  href={`/properties?location=${div.toLowerCase()}`}
                  className="text-white/75 transition-colors hover:text-white"
                >
                  {div}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Contact ─────────────────────────────────── */}
        <div>
          <h3 className="text-base font-semibold text-white">
            {t("contactTitle")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li>+880 1700 000000</li>
            <li>support@example.com</li>
            <li>Dhaka, Bangladesh</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-5 text-center text-xs text-white/60">
          © {currentYear} Property Marketplace. {t("rights")}
        </div>
      </div>
    </footer>
  );
}