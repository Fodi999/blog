import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DirectContacts } from '@/components/DirectContacts';
import { Protocol, SpecList } from '@/components/drawing';
import { LeadForm } from '@/components/LeadForm';
import { PageHero, SectionHeading } from '@/components/sections';
import { fill, getDict, isLocale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';
import { statusValues } from '@/lib/statusText';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return pageMetadata(locale, '/kernel', t.kernelPage.title, t.kernelPage.lead);
}

const row = 'content-frame grid gap-6 border-t-2 border-on-ink/45 pt-8 lg:grid-cols-[1fr_1.9fr] lg:gap-12';
const h2 = 'font-display text-[30px] leading-tight font-semibold text-on-ink';

export default async function KernelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const k = t.kernelPage;
  const v = statusValues(locale, t);

  return (
    <>
      <PageHero title={k.title} lead={k.lead} />

      <section aria-labelledby="what" className={row}>
        <h2 id="what" className={h2}>
          {k.whatTitle}
        </h2>
        <div className="grid max-w-[68ch] gap-5">
          {k.what.map((p) => (
            <p key={p} className="text-[17px] leading-relaxed text-on-ink">
              {p}
            </p>
          ))}
        </div>
      </section>

      <section aria-labelledby="caps" className={`${row} mt-16`}>
        <h2 id="caps" className={h2}>
          {k.capsTitle}
        </h2>
        <SpecList items={k.caps} />
      </section>

      <section id="protocol" aria-labelledby="protocol-title" className="content-frame mt-16 scroll-mt-24 border-t-2 border-on-ink/45 pt-8">
        <SectionHeading id="protocol-title" title={t.protocol.title} lead={fill(t.protocol.lead, v)} />
        <div className="mt-10">
          <Protocol locale={locale} t={t} />
        </div>
      </section>

      <section aria-labelledby="memory" className={`${row} mt-16`}>
        <h2 id="memory" className={h2}>
          {k.memoryTitle}
        </h2>
        <p className="max-w-[68ch] text-[17px] leading-relaxed text-on-ink">{fill(k.memory, v)}</p>
      </section>

      <section aria-labelledby="limits" className={`${row} mt-16`}>
        <h2 id="limits" className={h2}>
          {k.limitsTitle}
        </h2>
        <ul className="border-t border-hairline-ink-strong">
          {k.limits.map((l) => (
            <li key={l} className="flex gap-4 border-b border-hairline-ink-strong py-3.5 text-[16px] leading-snug text-on-ink">
              <span className="mt-[11px] h-px w-4 shrink-0 bg-destructive" aria-hidden="true" />
              {l}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="method" className={`${row} mt-16`}>
        <h2 id="method" className={h2}>
          {k.methodTitle}
        </h2>
        <div className="grid max-w-[68ch] gap-4">
          {k.method.map((m) => (
            <p key={m} className="text-[16.5px] leading-relaxed text-on-ink-muted">
              {fill(m, v)}
            </p>
          ))}
        </div>
      </section>

      <section id="beta" aria-labelledby="beta-title" className="content-frame mt-24 scroll-mt-24">
        <div className="grid gap-10 border-2 border-on-ink/45 p-6 md:p-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <SectionHeading id="beta-title" title={t.updates.title} lead={t.updates.text} />
            <DirectContacts t={t.contacts} className="mt-8" />
          </div>
          <LeadForm locale={locale} t={t.form} beta context="kernel" />
        </div>
      </section>
    </>
  );
}
