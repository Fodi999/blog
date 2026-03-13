import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as sharedGenerateMetadata } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const dynamic = 'force-static';

const SECTIONS = [
  'what', 'types', 'essential', 'analytics',
  'manage', 'thirdParty', 'updates',
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: l } = await params;
  setRequestLocale(l);
  const locale = l as 'pl' | 'en' | 'uk' | 'ru';
  const t = await getTranslations({ locale, namespace: 'cookiesPage' });

  return sharedGenerateMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    locale,
    path: '/cookies',
  });
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'cookiesPage' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t('meta.title'),
    description: t('meta.description'),
    url: `https://dima-fomin.pl/${locale}/cookies`,
    inLanguage: locale,
    publisher: {
      '@type': 'Person',
      name: 'Dima Fomin',
      url: 'https://dima-fomin.pl',
    },
    dateModified: '2026-03-13',
  };

  const sections = SECTIONS.map((key) => ({
    id: key,
    title: t(`sections.${key}.title`),
    text: t(`sections.${key}.text`),
    items: t.has(`sections.${key}.items`)
      ? (t.raw(`sections.${key}.items`) as string[])
      : undefined,
  }));

  return (
    <>
      <JsonLd data={jsonLd} />
      <LegalPageLayout
        iconName="cookie"
        title={t('title')}
        lastUpdated={t('lastUpdated')}
        intro={t('intro')}
        sections={sections}
        relatedLabel={t('relatedPages')}
        relatedLinks={[
          { href: `/${locale}/privacy`, label: t('privacyLink') },
          { href: `/${locale}/terms`, label: t('termsLink') },
        ]}
      />
    </>
  );
}
