import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Faq, PageHero, PricingPlans, SectionHeading, StatusBoard } from '@/components/sections';
import { getDict, isLocale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return pageMetadata(locale, '/pricing', t.pricing.eyebrow, `${t.pricing.title}. ${t.pricing.lead}`);
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  return (
    <>
      <PageHero eyebrow={t.pricing.eyebrow} title={t.pricing.title} lead={t.pricing.lead} />
      <section className="content-frame">
        <PricingPlans locale={locale} t={t.pricing} />
      </section>
      <section className="content-frame mt-24">
        <SectionHeading eyebrow={t.status.eyebrow} title={t.status.title} />
        <div className="mt-10">
          <StatusBoard t={t.status} />
        </div>
      </section>
      <section className="content-frame mt-24 grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeading eyebrow={t.faq.eyebrow} title={t.faq.title} />
        <Faq t={t.faq} />
      </section>
    </>
  );
}
