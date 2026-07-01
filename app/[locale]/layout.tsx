import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { getCopy, isLocale, locales } from '@/lib/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getCopy(locale);
  return {
    title: {
      default: locale === 'pl' ? 'Dima Fomin | Blog o Trójmieście' : 'Dima Fomin',
      template: '%s | Dima Fomin'
    },
    description: t.home.lead,
    keywords: locale === 'pl' ? ['Trójmiasto', 'Gdańsk', 'Sopot', 'Gdynia', 'blog Trójmiasto'] : undefined,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className={`locale locale--${locale}`} lang={locale}>
      <Header locale={locale} />
      {children}
      <Footer locale={locale} />
    </div>
  );
}
