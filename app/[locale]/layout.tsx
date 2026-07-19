import type { Metadata } from 'next';
import { Archivo_Black, Inter, Montserrat } from 'next/font/google';
import { notFound } from 'next/navigation';
import { AnalyticsClickTracker } from '@/components/AnalyticsEvents';
import { CookieConsent } from '@/components/CookieConsent';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { getCopy, isLocale, locales } from '@/lib/i18n';
import { ogLocale, SITE_URL } from '@/lib/seo';
import '../globals.css';

const display = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const text = Inter({ subsets: ['latin'], variable: '--font-text' });
const cyrillicDisplay = Montserrat({ subsets: ['latin', 'cyrillic'], weight: '900', variable: '--font-cyrillic-display' });

// This layout renders <html>, so the locale segment is the root of the tree.
// Unknown locales must not reach it — they fall through to the default 404.
export const dynamicParams = false;

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
    <html lang={locale}>
      <body className={`${display.variable} ${text.variable} ${cyrillicDisplay.variable}`}>
        <main>
          <div className={`locale locale--${locale}`}>
            <Header locale={locale} />
            {children}
            <Footer locale={locale} />
          </div>
        </main>
        <AnalyticsClickTracker />
        <CookieConsent />
      </body>
    </html>
  );
}
