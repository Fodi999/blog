import { getRequestConfig } from 'next-intl/server';

export const locales = ['pl', 'en', 'uk', 'ru'] as const;
export type Locale = (typeof locales)[number];

/**
 * DDD-style i18n: messages are split into bounded contexts under
 * `messages/{locale}/{domain}.json`. The loader merges all domain files
 * for the requested locale into a single message object that next-intl
 * can consume.
 *
 * Adding a new domain → add it to `DOMAINS` and create the JSON file
 * under each `messages/{locale}/` folder (script: scripts/split_messages_ddd.py).
 */
const DOMAINS = [
  'metadata',
  'nav',
  'chef-tools',
  'home',
  'recipes',
  'blog',
  'about',
  'contact',
  'footer',
  'legal',
  'recipe-analysis',
  'auth',
  'app',
  'billing',
] as const;

async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  const parts = await Promise.all(
    DOMAINS.map((d) =>
      import(`./messages/${locale}/${d}.json`).then((m) => m.default as Record<string, unknown>),
    ),
  );
  return Object.assign({}, ...parts);
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'pl';
  }

  return {
    locale,
    messages: await loadMessages(locale as Locale),
  };
});
