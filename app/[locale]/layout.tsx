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
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL('https://dima-fomin.pl'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'pl': '/pl',
        'en': '/en',
        'ru': '/ru',
        'uk': '/uk',
      },
    },
    verification: {
      google: 'google-site-verification-id',
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      images: ['https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg'],
      locale: locale,
      type: 'website',
      siteName: 'Dima Fomin',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg'],
      creator: '@dimafomin',
    },
  };
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
          <NextIntlClientProvider messages={messages}>
            <Header />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
            <Toaster position="top-right" richColors />
          </NextIntlClientProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
