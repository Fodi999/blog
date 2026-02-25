import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Providers } from '@/components/Providers';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import '../globals.css';
import { generateMetadata as sharedGenerateMetadata } from '@/lib/metadata';

export const viewport: Viewport = {
  themeColor: '#ef4444',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: l } = await params;
  const locale = l as 'pl' | 'en' | 'uk' | 'ru';
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return sharedGenerateMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: '',
  });
}

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: '--font-inter',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: '--font-noto-sans-jp',
  weight: ['400', '500', '700'],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="antialiased min-h-screen">
        <Providers>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Header locale={locale} />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer locale={locale} />
            <Toaster position="top-right" richColors />
          </NextIntlClientProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
