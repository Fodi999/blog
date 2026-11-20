import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Eyebrow } from '@/components/sections';
import { fill, getDict, isLocale, locales, localPath } from '@/lib/i18n';
import { getItems } from '@/lib/library';
import { pageMetadata, SITE_URL } from '@/lib/seo';
import { dateShort, fmtNum } from '@/lib/status';
import { columnLabel, formatCell, getStandard, standards, standardTitle, unitOf } from '@/lib/standards';

export const revalidate = 600;

export function generateStaticParams() {
  return locales.flatMap((locale) => standards.map((s) => ({ locale, std: s.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; std: string }> }): Promise<Metadata> {
  const { locale, std } = await params;
  if (!isLocale(locale)) return {};
  const s = getStandard(std);
  if (!s) return {};
  const t = getDict(locale);
  const long = `${s.id} — ${standardTitle(s, locale)}`;
  const title = long.length <= 58 ? long : `${s.id} — ${t.standards.table}`;
  const desc = fill(t.standards.pageDesc, { title: standardTitle(s, locale), rows: fmtNum(locale, s.rows.length), checked: s.checked ? dateShort(locale, s.checked) : '—' });
  return pageMetadata(locale, `/library/standards/${s.slug}`, title, desc);
}

export default async function StandardPage({ params }: { params: Promise<{ locale: string; std: string }> }) {
  const { locale, std } = await params;
  if (!isLocale(locale)) notFound();
  const s = getStandard(std);
  if (!s) notFound();
  const t = getDict(locale);
  const items = (await getItems()).filter((i) => s.usedBy.includes(i.slug));
  const siblings = standards.filter((x) => x.family === s.family && x.id !== s.id);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${s.id} — ${standardTitle(s, locale)}`,
    description: s.title,
    url: `${SITE_URL}/${locale}/library/standards/${s.slug}`,
    inLanguage: locale,
    dateModified: s.checked ?? undefined,
    version: s.edition,
    variableMeasured: s.columns.filter(Boolean),
    creator: { '@type': 'Organization', name: 'Monge' },
    isAccessibleForFree: true,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="content-frame pt-28 md:pt-32">
        <Link href={localPath(locale, '/library/standards')} className="inline-flex items-center gap-2 text-[14px] text-on-ink-muted transition-colors hover:text-on-ink">
          ← {t.standards.back}
        </Link>
        <div className="mt-6 animate-reveal">
          <Eyebrow>{t.library.families[s.family]}</Eyebrow>
          <h1 className="mt-3 font-display text-[clamp(34px,4.6vw,58px)] leading-[1.02] font-semibold tracking-[-.01em] text-balance text-on-ink">
            <span className="text-steel">{s.id}</span> <span className="block text-[.6em] leading-tight text-on-ink">{standardTitle(s, locale)}</span>
          </h1>
          <p className="mt-4 max-w-[80ch] text-[15px] leading-relaxed text-on-ink-muted">{s.title}</p>
        </div>

        <dl className="mt-8 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline-ink-strong bg-hairline-ink-strong md:grid-cols-4">
          {[
            [t.standards.rows, fmtNum(locale, s.rows.length)],
            [t.standards.checked, s.checked ? dateShort(locale, s.checked) : '—'],
            [t.standards.edition, s.edition],
            [t.standards.usedBy, String(s.usedBy.length || '—')],
          ].map(([k, v]) => (
            <div key={k} className="bg-ink px-4 py-3">
              <dt className="text-[12.5px] text-on-ink-muted">{k}</dt>
              <dd className="mt-1 font-mono text-[15px] text-on-ink tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label={s.id} className="content-frame mt-10">
        <p className="mb-3 text-[13px] text-on-ink-muted">{t.standards.unitsNote}</p>
        <div className="overflow-x-auto rounded-xl border border-hairline-ink-strong">
          <table className="w-full border-collapse text-left font-mono text-[13px] tabular-nums">
            <thead className="sticky top-0 bg-ink-3">
              <tr className="border-b border-hairline-ink-strong">
                {s.columns.map((c) => {
                  const unit = unitOf(s, c);
                  return (
                    <th key={c} scope="col" className="px-3 py-2.5 align-bottom font-medium whitespace-nowrap text-on-ink">
                      {columnLabel(c) || ' '}
                      {unit ? <span className="ml-1 font-normal text-on-ink-muted">{unit}</span> : null}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r, i) => (
                <tr key={i} className="border-b border-hairline-ink last:border-b-0 odd:bg-white/[.015] hover:bg-steel/[.06]">
                  {s.columns.map((c, j) => (
                    <td key={c} className={`px-3 py-2 whitespace-nowrap ${j === 0 ? 'font-medium text-on-ink' : 'text-on-ink-muted'}`}>
                      {formatCell(locale, r[c], c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-frame mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-display text-[22px] font-semibold text-on-ink">{t.standards.sources}</h2>
          <ol className="mt-4 border-t border-hairline-ink-strong">
            {s.sources.map((src, i) => (
              <li key={i} className="flex gap-4 border-b border-hairline-ink-strong py-3 text-[14.5px] leading-snug text-on-ink-muted">
                <span className="font-mono text-[12px] text-steel">{i + 1}</span>
                {src}
              </li>
            ))}
          </ol>
          <p className="mt-5 text-[13px] leading-relaxed text-on-ink-muted">{t.standards.notice}</p>
        </div>
        <div className="grid content-start gap-8">
          {items.length ? (
            <div>
              <h2 className="font-display text-[22px] font-semibold text-on-ink">{t.standards.usedBy}</h2>
              <ul className="mt-4 grid gap-2">
                {items.map((i) => (
                  <li key={i.slug}>
                    <Link href={localPath(locale, `/library/${i.slug}`)} className="group flex items-center gap-4 rounded-xl border border-hairline-ink-strong bg-ink-2 p-2 pr-4 transition-colors hover:border-on-ink/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={i.image} alt="" width={96} height={72} loading="lazy" className="h-[60px] w-[80px] rounded-lg bg-ink object-contain" />
                      <span className="text-[14.5px] leading-snug text-on-ink group-hover:text-signal">{i.title[locale]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {siblings.length ? (
            <div>
              <h2 className="font-display text-[22px] font-semibold text-on-ink">{t.library.families[s.family]}</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {siblings.map((x) => (
                  <li key={x.id}>
                    <Link href={localPath(locale, `/library/standards/${x.slug}`)} className="inline-block rounded-full border border-hairline-ink-strong px-3.5 py-1.5 font-mono text-[12.5px] text-on-ink-muted transition-colors hover:border-steel hover:text-steel">
                      {x.id}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
