import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LeadForm } from '@/components/LeadForm';
import { PageHero } from '@/components/sections';
import { getDict, isLocale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return pageMetadata(locale, '/contact', t.contact.title, t.contact.lead);
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const sp = await searchParams;
  const kind = typeof sp.kind === 'string' ? sp.kind : 'early_access';
  const context = ['plan', 'platform']
    .map((k) => (typeof sp[k] === 'string' ? `${k}=${String(sp[k]).slice(0, 40)}` : ''))
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <PageHero eyebrow={t.nav.contact} title={t.contact.title} lead={t.contact.lead} />
      <section className="content-frame">
        <div className="max-w-3xl rounded-[32px] border border-hairline-ink bg-ink-2 p-7 md:p-10">
          <LeadForm locale={locale} t={t.form} initialKind={kind} context={context} />
        </div>
      </section>
    </>
  );
}
