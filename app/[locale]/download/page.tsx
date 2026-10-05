import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/sections';
import { siteButtonVariants } from '@/components/site/Button';
import { getDict, isLocale, localPath } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';

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

  return (
    <>
      <PageHero eyebrow={t.download.version} title={t.download.title} lead={t.download.lead} />
      <section className="content-frame grid gap-5 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border border-signal/40 bg-[linear-gradient(160deg,rgba(196,255,77,.08),rgba(13,17,23,.95)_55%)] p-8" data-reveal>
          <div className="flex items-center gap-4 text-on-ink">
            {apple}
            <div>
              <h2 className="font-display text-[22px] font-semibold">{t.download.macTitle}</h2>
              <p className="font-mono text-[11.5px] text-signal">{t.download.version}</p>
            </div>
          </div>
          <p className="mt-5 text-[15px] text-on-ink-muted">{t.download.macText}</p>
          <Link href={localPath(locale, '/contact?kind=early_access&platform=mac')} className={`${siteButtonVariants({ variant: 'primary' })} mt-8`} data-ga-event="download_request" data-ga-label="mac">
            {t.download.macCta}
          </Link>
        </div>
        <div className="rounded-3xl border border-hairline-ink bg-ink-2 p-8" data-reveal style={{ '--reveal-delay': '90ms' } as React.CSSProperties}>
          <div className="flex items-center gap-4 text-on-ink">
            {windows}
            <div>
              <h2 className="font-display text-[22px] font-semibold">{t.download.winTitle}</h2>
              <p className="font-mono text-[11.5px] text-steel">{t.download.soon}</p>
            </div>
          </div>
          <p className="mt-5 text-[15px] text-on-ink-muted">{t.download.winText}</p>
          <Link href={localPath(locale, '/contact?kind=early_access&platform=windows')} className={`${siteButtonVariants({ variant: 'ghost' })} mt-8`} data-ga-event="download_request" data-ga-label="windows">
            {t.download.winCta}
          </Link>
        </div>
      </section>
      <section className="content-frame mt-10">
        <div className="rounded-3xl border border-hairline-ink p-7" data-reveal>
          <h2 className="font-mono text-[12px] tracking-[.14em] text-on-ink-muted uppercase">{t.download.reqTitle}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {t.download.req.map((r) => (
              <li key={r} className="text-[15px] text-on-ink">
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
