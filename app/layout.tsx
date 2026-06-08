import type { Metadata } from 'next';
import { Archivo_Black, Inter } from 'next/font/google';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import './globals.css';

const display = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const text = Inter({ subsets: ['latin'], variable: '--font-text' });

export const metadata: Metadata = {
  metadataBase: new URL('https://dima-fomin.pl'),
  title: { default: 'Dima Fomin', template: '%s | Dima Fomin' },
  description: 'Blog i sklep Dima Fomin.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body className={`${display.variable} ${text.variable}`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
