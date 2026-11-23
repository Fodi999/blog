import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LibraryGrid } from '@/components/LibraryGrid';
import { SectionHeading } from '@/components/sections';
import { siteButtonVariants } from '@/components/site/Button';
import { StandardsFamilies } from '@/components/StandardsFamilies';
import { getDict, isLocale, localPath } from '@/lib/i18n';
import { getItems } from '@/lib/library';
import { pageMetadata } from '@/lib/seo';
import { fmtNum } from '@/lib/status';
import { standards, totalRows } from '@/lib/standards';
import { downloadsBySlug } from '@/lib/stats';
import { LiveStats } from '@/components/LiveStats';
import { LibrarySearch } from '@/components/LibrarySearch';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return pageMetadata(locale, '/library', t.library.title, t.library.lead);
}

export default async function LibraryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const counts = await downloadsBySlug();
  const items = (await getItems()).map((i) => ({ ...i, downloads: counts[i.slug] ?? 0 }));
  const generators = items.filter((i) => i.standards?.length);
  const stats: [string, string][] = [
    [fmtNum(locale, generators.length), t.library.stats.generators],
    [fmtNum(locale, generators.reduce((n, i) => n + (i.configs ?? 0), 0)), t.library.stats.configs],
    [fmtNum(locale, standards.length), t.library.stats.tables],
    [fmtNum(locale, totalRows), t.library.stats.rows],
  ];

  return (
    <>
      <section className="relative overflow-hidden pt-32 pb-12 md:pt-36">
        <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="content-frame relative animate-reveal">
          <h1 className="max-w-4xl font-display text-[clamp(40px,5.8vw,76px)] leading-[1] font-semibold tracking-[-.015em] text-balance text-on-ink">{t.library.title}</h1>
          <p className="mt-6 max-w-[64ch] text-[18px] leading-relaxed text-pretty text-on-ink-muted">{t.library.lead}</p>
          <dl className="mt-10 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline-ink-strong bg-hairline-ink-strong md:grid-cols-4">
            {stats.map(([n, label]) => (
              <div key={label} className="bg-ink/90 px-5 py-4">
                <dt className="sr-only">{label}</dt>
                <dd>
                  <span className="block font-mono text-[30px] leading-none font-medium text-on-ink tabular-nums">{n}</span>
                  <span className="mt-2 block text-[13.5px] text-on-ink-muted">{label}</span>
                </dd>
              </div>
            ))}
          </dl>
          <LiveStats locale={locale} t={t.live} className="mt-4" />
        </div>
      </section>

      <section className="content-frame">
        <LibrarySearch locale={locale} t={t.search} />
        <Link
          href={localPath(locale, '/library/print')}
          className="group mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-signal/35 bg-[linear-gradient(100deg,rgba(196,255,77,.08),transparent_60%)] px-5 py-4 transition-colors hover:border-signal"
        >
          <span>
            <span className="block font-display text-[20px] font-semibold text-on-ink">{t.printPage.title}</span>
            <span className="mt-1 block max-w-[80ch] text-[14px] text-on-ink-muted">{t.printPage.how[0][1]}</span>
          </span>
          <span className="font-semibold text-on-ink group-hover:text-signal">{t.library.open} →</span>
        </Link>
        <Link
          href={localPath(locale, '/library/textures')}
          className="group mb-8 -mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-hairline-ink-strong px-5 py-4 transition-colors hover:border-signal"
        >
          <span>
            <span className="block font-display text-[20px] font-semibold text-on-ink">{t.texturesPage.title}</span>
            <span className="mt-1 block max-w-[80ch] text-[14px] text-on-ink-muted">{t.texturesPage.cardLead}</span>
          </span>
          <span className="font-semibold text-on-ink group-hover:text-signal">{t.library.open} →</span>
        </Link>
        <LibraryGrid items={items} locale={locale} t={t.library} />
      </section>

      <section id="standards" aria-labelledby="standards-title" className="content-frame mt-24 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading id="standards-title" title={t.library.standardsTitle} lead={t.library.standardsLead} />
          <Link href={localPath(locale, '/library/standards')} className={siteButtonVariants({ variant: 'ghost' })}>
            {t.library.standardsLink} →
          </Link>
        </div>
        <div className="mt-10">
          <StandardsFamilies locale={locale} t={t} />
        </div>
      </section>

      <section className="content-frame mt-16">
        <div className="rounded-xl border border-dashed border-hairline-ink-strong p-7">
          <h2 className="text-[15px] font-medium text-steel">{t.library.soonTitle}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {t.library.soon.map((s) => (
              <span key={s} className="rounded-full border border-hairline-ink px-4 py-2 text-[14px] text-on-ink-muted">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
