import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as sharedGenerateMetadata } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const dynamic = 'force-static';

const SECTIONS = [
  'controller', 'collect', 'usage', 'cookies',
  'thirdParty', 'storage', 'legalBasis', 'rights', 'contact',
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: l } = await params;
  setRequestLocale(l);
  const locale = l as 'pl' | 'en' | 'uk' | 'ru';
  const t = await getTranslations({ locale, namespace: 'privacy' });

  return sharedGenerateMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    locale,
    path: '/privacy',
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'privacy' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t('meta.title'),
    description: t('meta.description'),
    url: `https://dima-fomin.pl/${locale}/privacy`,
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
    extra: t.has(`sections.${key}.supervisory`)
      ? t(`sections.${key}.supervisory`)
      : undefined,
  }));

  return (
    <>
      <JsonLd data={jsonLd} />
      <LegalPageLayout
        iconName="shield"
        title={t('title')}
        lastUpdated={t('lastUpdated')}
        intro={t('intro')}
        sections={sections}
        relatedLabel={t('relatedPages')}
        relatedLinks={[
          { href: `/${locale}/terms`, label: t('termsLink') },
          { href: `/${locale}/cookies`, label: t('cookiesLink') },
        ]}
      />
    </>
  );
}
