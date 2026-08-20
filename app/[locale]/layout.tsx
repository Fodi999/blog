import type { Metadata, Viewport } from 'next';
import { Manrope, Playfair_Display } from 'next/font/google';
import { notFound } from 'next/navigation';
import { AnalyticsClickTracker } from '@/components/AnalyticsEvents';
import { CookieConsent } from '@/components/CookieConsent';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { getCopy, isLocale, locales } from '@/lib/i18n';
import { ogLocale, SITE_URL } from '@/lib/seo';
import '../globals.css';

// Both faces cover Cyrillic natively (verified against Next's font manifest),
// so pl/en/ru/uk all share one font stack — no per-locale swap needed.
const display = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '900'],
  style: ['normal', 'italic'],
  variable: '--font-heading',
});
const text = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
});

// This layout renders <html>, so the locale segment is the root of the tree.
// Unknown locales must not reach it — they fall through to the default 404.
export const dynamicParams = false;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f1ece1' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a08' },
  ],
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getCopy(locale);
  const title = locale === 'pl' ? 'Dima Fomin | Blog i catering w Trójmieście' : 'Dima Fomin';
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: '%s | Dima Fomin' },
    description: t.home.lead,
    keywords: locale === 'pl' ? ['Trójmiasto', 'Gdańsk', 'Sopot', 'Gdynia', 'blog Trójmiasto', 'catering Trójmiasto', 'catering Gdańsk'] : undefined,
    openGraph: {
      type: 'website',
      locale: ogLocale[locale],
      url: `${SITE_URL}/${locale}`,
      siteName: 'Dima Fomin',
      title,
      description: t.home.lead,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body className={`${display.variable} ${text.variable}`}>
        <main>
          <Header locale={locale} />
          {children}
          <Footer locale={locale} />
        </main>
        <AnalyticsClickTracker />
        <CookieConsent />
      </body>
    </html>
  );
}
