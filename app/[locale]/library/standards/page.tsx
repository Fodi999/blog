import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/sections';
import { StandardsFamilies } from '@/components/StandardsFamilies';
import { getDict, isLocale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return pageMetadata(locale, '/library/standards', t.standards.title, t.standards.lead);
}

export default async function StandardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  return (
    <>
      <PageHero eyebrow={t.nav.library} title={t.standards.title} lead={t.standards.lead} />
      <section className="content-frame">
        <StandardsFamilies locale={locale} t={t} />
        <p className="mt-8 max-w-3xl text-[13.5px] leading-relaxed text-on-ink-muted">{t.standards.notice}</p>
      </section>
    </>
  );
}
