import type { Metadata } from 'next';
import { Archivo_Black, Inter, Montserrat } from 'next/font/google';
import { AnalyticsClickTracker } from '@/components/AnalyticsEvents';
import { CookieConsent } from '@/components/CookieConsent';
import './globals.css';

const display = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const text = Inter({ subsets: ['latin'], variable: '--font-text' });
const cyrillicDisplay = Montserrat({ subsets: ['latin', 'cyrillic'], weight: '900', variable: '--font-cyrillic-display' });

export const metadata: Metadata = {
  metadataBase: new URL('https://dima-fomin.pl'),
  title: { default: 'Dima Fomin | Blog o Trójmieście', template: '%s | Dima Fomin' },
  description: 'Autorski blog z Gdańska o Trójmieście: Gdańsk, Sopot, Gdynia, lokalne życie, miejsca, jedzenie i praca z produktem.',
  keywords: ['Trójmiasto', 'Gdańsk', 'Sopot', 'Gdynia', 'blog Gdańsk', 'blog Trójmiasto'],
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    url: 'https://dima-fomin.pl',
    siteName: 'Dima Fomin',
    title: 'Dima Fomin | Blog o Trójmieście',
    description: 'Lokalny blog z Gdańska o Trójmieście, jedzeniu, miejscach i codziennym życiu nad morzem.'
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body className={`${display.variable} ${text.variable} ${cyrillicDisplay.variable}`}>
        <main>{children}</main>
        <AnalyticsClickTracker />
        <CookieConsent />
      </body>
    </html>
  );
}
