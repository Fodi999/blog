import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DirectContacts } from '@/components/DirectContacts';
import { LeadForm } from '@/components/LeadForm';
import { PageHero, SectionHeading } from '@/components/sections';
import { fill, getDict, isLocale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';
import { statusValues } from '@/lib/statusText';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return pageMetadata(locale, '/download', t.download.title, t.download.lead);
}

const apple = (
  <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden="true">
    <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8s2.1-1.2 2.9-2.4c.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.4-.9-2.4-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z" />
  </svg>
);
const windows = (
  <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden="true">
    <path d="M3 5.5l7.5-1v7H3v-6zm0 13l7.5 1v-7H3v6zm8.5 1.2L21 21v-8.5h-9.5v7.2zm0-15.4v7.2H21V3l-9.5 1.3z" />
  </svg>
);

export default async function DownloadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const d = t.download;
  const v = statusValues(locale, t);

  const platforms = [
    { icon: apple, title: d.macTitle, state: d.macState, text: d.macText, first: true },
    { icon: windows, title: d.winTitle, state: d.winState, text: d.winText, first: false },
  ];

  return (
    <>
      <PageHero eyebrow={fill(d.status, v)} title={d.title} lead={d.lead} />
      <section className="content-frame grid border-2 border-on-ink/45 md:grid-cols-2">
        {platforms.map((p, i) => (
          <div key={p.title} className={`p-7 md:p-8 ${i === 0 ? 'border-b border-hairline-ink-strong md:border-r md:border-b-0' : ''}`}>
            <div className="flex items-center justify-between gap-4 text-on-ink">
              <span className="flex items-center gap-3">
                {p.icon}
                <h2 className="font-display text-[26px] font-semibold">{p.title}</h2>
              </span>
              <span className={`text-[14px] ${p.first ? 'text-signal' : 'text-on-ink-muted'}`}>{p.state}</span>
            </div>
            <p className="mt-5 text-[16px] leading-relaxed text-on-ink-muted">{p.text}</p>
          </div>
        ))}
      </section>

      <section className="content-frame mt-10">
        <h2 className="text-[15px] font-medium text-on-ink-muted">{d.reqTitle}</h2>
        <ul className="mt-3 grid border-t border-hairline-ink-strong sm:grid-cols-3">
          {d.req.map((r) => (
            <li key={r} className="border-b border-hairline-ink-strong py-3.5 text-[16px] text-on-ink sm:pr-6">
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section id="beta" aria-labelledby="beta-title" className="content-frame mt-20 scroll-mt-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <div>
            <SectionHeading id="beta-title" title={d.formTitle} lead={t.updates.text} />
            <DirectContacts t={t.contacts} className="mt-8" />
          </div>
          <div className="border-2 border-on-ink/45 p-6 md:p-8">
            <LeadForm locale={locale} t={t.form} beta context="download" />
          </div>
        </div>
      </section>
    </>
  );
}
