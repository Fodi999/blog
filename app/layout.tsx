import type { Metadata } from 'next';
import Script from 'next/script';
import { Archivo_Black, Inter, Montserrat } from 'next/font/google';
import { AnalyticsClickTracker } from '@/components/AnalyticsEvents';
import './globals.css';

const display = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const text = Inter({ subsets: ['latin'], variable: '--font-text' });
const cyrillicDisplay = Montserrat({ subsets: ['latin', 'cyrillic'], weight: '900', variable: '--font-cyrillic-display' });

export const metadata: Metadata = {
  metadataBase: new URL('https://dima-fomin.pl'),
  title: { default: 'Dima Fomin', template: '%s | Dima Fomin' },
  description: 'Blog i sklep Dima Fomin.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="pl">
      <body className={`${display.variable} ${text.variable} ${cyrillicDisplay.variable}`}>
        <main>{children}</main>
        <AnalyticsClickTracker />
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
