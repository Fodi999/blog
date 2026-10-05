import type { Metadata } from 'next';
import { defaultLocale, getDict, locales, type Locale } from '@/lib/i18n';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dima-fomin.pl';

export const ogLocale: Record<Locale, string> = { pl: 'pl_PL', ru: 'ru_RU', en: 'en_US' };

export function languageAlternates(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`])),
    'x-default': `${SITE_URL}/${defaultLocale}${path}`,
  };
}

/** Per-page metadata with canonical + hreflang + Open Graph. `path` excludes the locale. */
export function pageMetadata(locale: Locale, path: string, title: string | undefined, description: string, image?: string): Metadata {
  const t = getDict(locale);
  const url = `${SITE_URL}/${locale}${path}`;
  const ogImage = image ?? '/og.png';
  return {
    title: title ?? { absolute: t.meta.title },
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: 'website',
      url,
      siteName: 'Monge',
      locale: ogLocale[locale],
      title: title ? `${title} | Monge` : t.meta.title,
      description,
      images: [{ url: ogImage }],
    },
    twitter: { card: 'summary_large_image', title: title ? `${title} | Monge` : t.meta.title, description, images: [ogImage] },
  };
}
