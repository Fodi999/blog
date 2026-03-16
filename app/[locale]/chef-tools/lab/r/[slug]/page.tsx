import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { SharedRecipeClient } from './SharedRecipeClient';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'chefTools.tools.lab' });

  // Try to fetch shared recipe for OG title
  let title = t('sharedRecipeTitle') + ' | Chef Tools';
  let description = t('sharedRecipeDesc');
  try {
    const res = await fetch(`${API_BASE}/public/tools/shared-recipe/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.title) {
        title = data.title + ' — ' + t('sharedRecipeTitle') + ' | Chef Tools';
      }
      const count = data.ingredients?.length || 0;
      description = `${count} ingredients analyzed — ${t('sharedRecipeDesc')}`;
    }
  } catch { /* fallback to defaults */ }

  return genMeta({
    title,
    description,
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: `/chef-tools/lab/r/${slug}`,
  });
}

export default async function SharedRecipePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <SharedRecipeClient slug={slug} locale={locale} />;
}
