import { en } from '@/lib/dict/en';
import { pl } from '@/lib/dict/pl';
import { ru } from '@/lib/dict/ru';

export const locales = ['pl', 'ru', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'pl';

export const localeNames: Record<Locale, string> = { pl: 'Polski', ru: 'Русский', en: 'English' };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function localPath(locale: Locale, path = ''): string {
  const normalized = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalized}`;
}

export type Dict = typeof ru;

const dictionaries: Record<Locale, Dict> = { pl, ru, en };

export function getDict(locale: Locale): Dict {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

/** Puts values into a text: fill('Версия {version}', { version: '0.15.20' }). Unknown names stay as they are. */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (all, name: string) => (name in values ? String(values[name]) : all));
}
