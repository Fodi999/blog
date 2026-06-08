import type { Metadata } from 'next';
import { Archivo_Black, Inter, Montserrat } from 'next/font/google';
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
  return (
    <html lang="pl">
      <body className={`${display.variable} ${text.variable} ${cyrillicDisplay.variable}`}>
        <main>{children}</main>
      </body>
    </html>
  );
}
