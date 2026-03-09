import { getTranslations } from 'next-intl/server';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { ChefToolsTabs } from './ChefToolsTabs';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'chefTools' });
  return genMeta({
    title: t('meta.title'),
    description: t('meta.description'),
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: '/chef-tools',
  });
}

/* ── Tab definitions ─────────────────────────────────────────────────────── */

const tabDefs = [
  {
    id: 'tools',
    iconKey: 'tools',
    items: [
      { href: '/chef-tools/converter', iconKey: 'converter', key: 'converter' },
    ],
  },
  {
    id: 'tables',
    iconKey: 'tables',
    items: [
      { href: '/chef-tools/fish-season', iconKey: 'fishSeason', key: 'fishSeason' },
      { href: '/chef-tools/ingredient-analyzer', iconKey: 'ingredientAnalyzer', key: 'ingredientAnalyzer' },
    ],
  },
  {
    id: 'products',
    iconKey: 'products',
    items: [
      { href: '/chef-tools/ingredients', iconKey: 'ingredientsCatalog', key: 'ingredientsCatalog' },
    ],
  },
];

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default async function ChefToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'chefTools' });

  /* Build serializable tab data for the client component */
  const tabs = tabDefs.map(({ id, iconKey, items }) => ({
    id,
    label: t(`tabs.${id}`),
    desc: t(`tabs.${id}Desc`),
    iconKey,
    items: items.map(({ href, iconKey: ik, key }) => ({
      href,
      iconKey: ik,
      title: t(`tools.${key}.title`),
      description: t(`tools.${key}.description`),
      openLabel: t('open'),
    })),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Schema.org */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: t('title'),
          description: t('description'),
          url: `https://dima-fomin.pl/${locale}/chef-tools`,
          isPartOf: {
            '@type': 'WebSite',
            name: 'Dima Fomin',
            url: 'https://dima-fomin.pl',
          },
        }}
      />

      {/* Header — same pattern as /blog */}
      <div className="mb-16 md:mb-24 border-t border-primary/20 pt-12">
        <h1 className="text-6xl md:text-8xl font-black mb-6 text-foreground tracking-tighter uppercase italic">
          {t('title')}<span className="text-primary">.</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl font-medium tracking-tight">
          {t('description')}
        </p>
      </div>

      {/* Horizontal Tabs */}
      <ChefToolsTabs tabs={tabs} />
    </div>
  );
}
