import type { Article, Ingredient, Product } from '@/lib/cms';
import { defaultLocale, locales, type Locale } from '@/lib/i18n';

export const SITE_URL = 'https://dima-fomin.pl';

export const ogLocale: Record<Locale, string> = { pl: 'pl_PL', en: 'en_US', ru: 'ru_RU', uk: 'uk_UA' };

function hasText(value?: string | null): boolean {
  return Boolean(value && value.trim());
}

// A locale counts as "translated" only when the CMS row has real content for
// it — otherwise the page renders fallback text from another language and
// must not be advertised via hreflang or the sitemap.
export function articleLocales(article: Article): Locale[] {
  const content: Record<Locale, string | null | undefined> = {
    pl: article.content_pl,
    en: article.content_en,
    ru: article.content_ru,
    uk: article.content_uk,
  };
  const available = locales.filter((locale) => hasText(content[locale]));
  return available.length > 0 ? available : [defaultLocale];
}

export function productLocales(product: Product): Locale[] {
  const names: Record<Locale, string | null | undefined> = {
    pl: product.name_pl,
    en: product.name_en,
    ru: product.name_ru,
    uk: product.name_uk,
  };
  const available = locales.filter((locale) => hasText(names[locale]));
  return available.length > 0 ? available : [defaultLocale];
}

export function ingredientLocales(ingredient: Ingredient): Locale[] {
  const names: Record<Locale, string | null | undefined> = {
    pl: ingredient.name_pl,
    en: ingredient.name_en,
    ru: ingredient.name_ru,
    uk: ingredient.name_uk,
  };
  const available = locales.filter((locale) => hasText(names[locale]));
  return available.length > 0 ? available : [defaultLocale];
}

export function languageAlternates(path: string, available: readonly Locale[] = locales): Record<string, string> {
  const xDefault = available.includes(defaultLocale) ? defaultLocale : available[0];
  return {
    ...Object.fromEntries(available.map((locale) => [locale, `${SITE_URL}/${locale}${path}`])),
    'x-default': `${SITE_URL}/${xDefault}${path}`,
  };
}

// The CMS serializes timestamps in three shapes: ISO strings (articles),
// "YYYY-MM-DD H:MM:SS.ffffff +00:00:00" (ingredients) and Rust `time`
// arrays [year, ordinal-day, hour, minute, second, ns] (products).
export function safeDate(value?: string | number[] | null): Date | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const [year, ordinal, hour = 0, minute = 0, second = 0] = value;
    if (!year || !ordinal) return undefined;
    const date = new Date(Date.UTC(year, 0, ordinal, hour, minute, second));
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2}):(\d{2})/);
  if (!match) return undefined;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6])));
}
