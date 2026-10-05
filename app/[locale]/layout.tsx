import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Manrope, Unbounded } from 'next/font/google';
import { notFound } from 'next/navigation';
import { AnalyticsClickTracker } from '@/components/AnalyticsEvents';
import { CookieConsent } from '@/components/CookieConsent';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { RevealObserver } from '@/components/Reveal';
import { getDict, isLocale, locales } from '@/lib/i18n';
import { ogLocale, SITE_URL } from '@/lib/seo';
import { THREE_IMPORT_MAP } from '@/lib/three';
import '../globals.css';

// All three faces cover Latin + Cyrillic, so pl / ru / en share one stack.
const display = Unbounded({ subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['400', '500', '600', '700'], variable: '--font-heading' });
const body = Manrope({ subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['400', '500', '600', '700'], variable: '--font-body' });
const code = JetBrains_Mono({ subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['400', '500'], variable: '--font-code' });

export const dynamicParams = false;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#07090c',
  colorScheme: 'dark',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.meta.title, template: '%s | Monge' },
    description: t.meta.description,
    applicationName: 'Monge',
    openGraph: { type: 'website', siteName: 'Monge', locale: ogLocale[locale], title: t.meta.title, description: t.meta.description, images: [{ url: '/og.png' }] },
    icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
  };
}

export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);

  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${display.variable} ${body.variable} ${code.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script type="importmap" dangerouslySetInnerHTML={{ __html: JSON.stringify(THREE_IMPORT_MAP) }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-full focus:bg-signal focus:px-4 focus:py-2 focus:text-ink">
          Skip to content
        </a>
        <Header locale={locale} nav={t.nav} />
        <main id="main">{children}</main>
        <Footer locale={locale} />
        <RevealObserver />
        <AnalyticsClickTracker />
        <CookieConsent />
      </body>
    </html>
  );
}
