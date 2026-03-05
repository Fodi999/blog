import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { ChevronLeft } from 'lucide-react';
import ConverterClient, { type UnitGroups } from './ConverterClient';
import { QuickExamplesClient } from './QuickExamplesClient';
import { getUnits } from './action';
import { JsonLd } from '@/components/JsonLd';

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'chefTools' });
  return genMeta({
    title: t('tools.converter.title'),
    description: t('tools.converter.description'),
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: '/chef-tools/converter',
  });
}

export default async function ConverterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'chefTools' });

  // Load localized unit groups from API (falls back to static in ConverterClient)
  const apiUnits = await getUnits(locale);
  const groups: UnitGroups | undefined = apiUnits ?? undefined;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-24">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: t('tools.converter.title'),
        description: t('tools.converter.description'),
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        url: `https://dima-fomin.pl/${locale}/chef-tools/converter`,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      }} />
      <Link
        href="/chef-tools"
        className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        <ChevronLeft className="h-4 w-4" />
        {t('back')}
      </Link>

      <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-tight sm:leading-[0.9] mb-3 sm:mb-4">
        {t('tools.converter.title')}<span className="text-primary">.</span>
      </h1>
      <p className="text-base sm:text-lg text-muted-foreground font-medium mb-8 sm:mb-12">
        {t('tools.converter.description')}
      </p>

      <ConverterClient groups={groups} />

      {/* FAQ JsonLd */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: (t.raw('tools.converter.faq.items') as Array<{ q: string; a: string }>).map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      }} />

      {/* How-to */}
      <section className="mt-12 sm:mt-20">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic mb-5">
          {t('tools.converter.howToUse.title')}<span className="text-primary">.</span>
        </h2>
        <ol className="space-y-3">
          {(t.raw('tools.converter.howToUse.steps') as string[]).map((step, i) => (
            <li key={i} className="flex items-start gap-3 sm:gap-4">
              <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground font-black text-xs sm:text-sm flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm sm:text-base font-medium text-foreground pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* For whom */}
      <section className="mt-10 sm:mt-14 border-2 border-border/60 rounded-3xl p-5 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic mb-4 sm:mb-5">
          {t('tools.converter.forWhom.title')}<span className="text-primary">.</span>
        </h2>
        <ul className="flex flex-wrap gap-2 mb-4 sm:mb-5">
          {(t.raw('tools.converter.forWhom.items') as string[]).map((item) => (
            <li
              key={item}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 text-primary font-bold text-xs sm:text-sm uppercase tracking-wide"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
          {t('tools.converter.forWhom.text')}
        </p>
      </section>

      <QuickExamplesClient
        title={t('tools.converter.quickExamples.title')}
        items={t.raw('tools.converter.quickExamples.items') as Array<{ label: string; value: string; from: string; to: string }>}
      />

      {/* SEO text */}
      <section className="mt-12 sm:mt-16 border-t border-border/40 pt-10 sm:pt-12">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic mb-5">
          {t('tools.converter.seoText.title')}<span className="text-primary">.</span>
        </h2>
        <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
          <p>{t('tools.converter.seoText.p1')}</p>
          <p>{t('tools.converter.seoText.p2')}</p>
          <p>{t('tools.converter.seoText.p3')}</p>
          <p>{t('tools.converter.seoText.p4')}</p>
        </div>
      </section>

      {/* FAQ visible */}
      <section className="mt-10 sm:mt-14 mb-8">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic mb-5">
          {t('tools.converter.faq.title')}<span className="text-primary">.</span>
        </h2>
        <div className="space-y-3">
          {(t.raw('tools.converter.faq.items') as Array<{ q: string; a: string }>).map(({ q, a }) => (
            <details
              key={q}
              className="group border-2 border-border/60 rounded-2xl overflow-hidden"
            >
              <summary className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 cursor-pointer font-black text-xs sm:text-sm uppercase tracking-wide select-none hover:bg-muted/40 transition-colors">
                <span className="leading-snug">{q}</span>
                <span className="flex-shrink-0 text-primary text-xl leading-none group-open:rotate-45 transition-transform mt-0.5">+</span>
              </summary>
              <p className="px-4 sm:px-6 pb-4 sm:pb-5 pt-2 text-muted-foreground font-medium leading-relaxed text-xs sm:text-sm border-t border-border/40">
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing SEO text */}
      <section className="mt-10 sm:mt-14 mb-8">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic mb-4">
          {t('tools.converter.closingText.title')}<span className="text-primary">.</span>
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
          {t('tools.converter.closingText.text')}
        </p>
      </section>
    </div>
  );
}
