import type { Metadata } from 'next';
import { defaultLocale, getDict, locales, type Locale } from '@/lib/i18n';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dima-fomin.pl';

/** The developer's channels. */
export const YOUTUBE_URL = 'https://www.youtube.com/@fodifood';
export const INSTAGRAM_URL = 'https://www.instagram.com/fodifood';
export const TELEGRAM_URL = 'https://t.me/fodi999';
/** The developer's own address (published at his request) and his photo. */
export const EMAIL = 'fodi85999@gmail.com';
export const PHOTO = '/media/dima-fomin.webp';

/** The video about Monge shown on the site (Russian, 9:07, 13.10.2026, Monge 0.12.1). */
export const VIDEO = { id: 'VfdRDYKCte0', url: 'https://youtu.be/VfdRDYKCte0', duration: '9:07' } as const;

export const ogLocale: Record<Locale, string> = { pl: 'pl_PL', ru: 'ru_RU', en: 'en_US' };

export function languageAlternates(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`])),
    'x-default': `${SITE_URL}/${defaultLocale}${path}`,
  };
}

/** A description for search results: at most `max` characters, cut after a sentence or a word, never mid-word. */
export function clip(text: string, max = 160): string {
  const s = text.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const sentence = cut.lastIndexOf('. ');
  if (sentence > max * 0.55) return cut.slice(0, sentence + 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:—–-]\s*$/, '')}…`;
}

/** Per-page metadata with canonical + hreflang + Open Graph. `path` excludes the locale. */
export function pageMetadata(locale: Locale, path: string, title: string | undefined, fullDescription: string, image?: string): Metadata {
  const t = getDict(locale);
  const description = clip(fullDescription);
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
