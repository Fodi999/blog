import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as sharedGenerateMetadata } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const dynamic = 'force-static';

const SECTIONS = [
  'usage', 'content', 'intellectual', 'disclaimer',
  'liability', 'changes', 'governing',
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: l } = await params;
  setRequestLocale(l);
  const locale = l as 'pl' | 'en' | 'uk' | 'ru';
  const t = await getTranslations({ locale, namespace: 'terms' });

  return sharedGenerateMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    locale,
    path: '/terms',
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'terms' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t('meta.title'),
    description: t('meta.description'),
    url: `https://dima-fomin.pl/${locale}/terms`,
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
        iconName="fileText"
        title={t('title')}
        lastUpdated={t('lastUpdated')}
        intro={t('intro')}
        sections={sections}
        relatedLabel={t('relatedPages')}
        relatedLinks={[
          { href: `/${locale}/privacy`, label: t('privacyLink') },
          { href: `/${locale}/cookies`, label: t('cookiesLink') },
        ]}
      />
    </>
  );
}
