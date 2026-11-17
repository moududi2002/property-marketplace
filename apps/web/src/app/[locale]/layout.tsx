
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { inter, notoSansBengali } from "@/lib/fonts";
import { AuthProvider } from "@/providers/auth-provider";
import { NotificationsProvider } from "@/providers/notifications-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "Property Marketplace",
    template: "%s | Property Marketplace",
  },
  description:
    "Buy, sell, and rent properties across Bangladesh — every listing reviewed by our team.",
};

export function generateStaticParams(): { locale: string }[] {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as never)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${notoSansBengali.variable}`}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <NotificationsProvider>
              <div className="flex min-h-screen flex-col">
                <SiteHeader />
                <main className="flex-1">{children}</main>
                <SiteFooter />
              </div>
            </NotificationsProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}