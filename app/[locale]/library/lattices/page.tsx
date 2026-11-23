import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DemoBadge } from '@/components/DemoBadge';
import { LatticeCalibration } from '@/components/LatticeCalibration';
import { LatticeExplorer } from '@/components/LatticeExplorer';
import { PageHero } from '@/components/sections';
import { getDict, isLocale } from '@/lib/i18n';
import { REVIEWED, indexable, isDemo, lattices, profiles, type Limit, type LimitKey, type Process } from '@/lib/lattices';
import { pageMetadata } from '@/lib/seo';

/* The lattice library: Monge's twelve lattice kinds, the cell's passport and its check against a print process, each
   limit with its source, material and conditions. The data is the kernel's (lib/lattices.ts); the page says what on it
   is measured and what is still being checked, and stays out of search results until the section is reviewed. */
export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const p = getDict(locale).latticesPage;
  const meta = pageMetadata(locale, '/library/lattices', p.title, p.lead);
  return indexable ? meta : { ...meta, robots: { index: false, follow: true } };
}

type Use = { key: LimitKey; value: number; unit: Limit['unit']; materials: string[] };
type Source = { title: string; url: string; uses: Map<Process, Use[]>; noSupports: Process[] };

/** Every source the profiles cite, once, with the numbers taken from it by process. */
function sourcesOfProfiles(): Source[] {
  const all = new Map<string, Source>();
  const sourceOf = (title: string, url: string) => {
    const known = all.get(url);
    if (known) return known;
    const fresh: Source = { title, url, uses: new Map(), noSupports: [] };
    all.set(url, fresh);
    return fresh;
  };
  for (const pr of profiles) {
    for (const l of pr.limits) {
      const s = sourceOf(l.source_title, l.source_url);
      const uses = s.uses.get(pr.process) ?? [];
      // the material the SOURCE gives the number for (not the profile's): a number shared by profiles is one use
      const same = uses.find((u) => u.key === l.key && u.value === l.value);
      if (same) same.materials.push(l.material);
      else uses.push({ key: l.key, value: l.value, unit: l.unit, materials: [l.material] });
      s.uses.set(pr.process, uses);
    }
    if (pr.supports_source) sourceOf(pr.supports_source.title, pr.supports_source.url).noSupports.push(pr.process);
  }
  return [...all.values()];
}

export default async function LatticesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const p = t.latticesPage;
  const tauNum = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  const limitNum = (u: Use) => {
    const v = u.value.toLocaleString(locale, { maximumFractionDigits: 4 });
    return u.unit === 'deg' ? `${v}°` : u.unit === 'mm' ? `${v} ${p.units.mm}` : v;
  };
  // each number with the material its source names (in the source's own words)
  const useText = (u: Use) => `${p.limitNames[u.key]} ${limitNum(u)} (${[...new Set(u.materials)].join('; ')})`;
  const sources = sourcesOfProfiles();

  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} lead={p.lead} />

      {isDemo ? (
        <section aria-labelledby="demo-title" className="content-frame">
          <div role="note" className="rounded-xl border border-[#ffb648]/50 bg-[#ffb648]/[.07] p-5 md:p-6">
            <h2 id="demo-title" className="flex items-center gap-2.5 font-display text-[21px] font-semibold text-[#ffc56e]">
              <svg viewBox="0 0 16 16" className="size-5 shrink-0" fill="none" aria-hidden="true">
                <path d="M8 2.2l6.2 11.3H1.8L8 2.2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M8 6.6v3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="8" cy="11.7" r=".8" fill="currentColor" />
              </svg>
              {p.demoTitle}
            </h2>
            <p className="mt-2 max-w-[82ch] text-[15px] leading-relaxed text-on-ink">{p.demoText}</p>
          </div>
        </section>
      ) : (
        <section aria-labelledby="status-title" className="content-frame">
          <div role="note" className="rounded-xl border border-signal/30 bg-signal/[.05] p-5 md:p-6">
            <h2 id="status-title" className="font-display text-[21px] font-semibold text-on-ink">
              {p.statusTitle}
            </h2>
            <ul className="mt-3 grid max-w-[90ch] gap-2">
              {p.statusItems.map((x) => (
                <li key={x} className="flex gap-2.5 text-[14.5px] leading-relaxed text-on-ink-muted">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-signal" aria-hidden="true" />
                  {x}
                </li>
              ))}
            </ul>
            {!REVIEWED ? <p className="mt-3 text-[13px] font-medium text-[#ffc56e]">{p.testNote}</p> : null}
          </div>
        </section>
      )}

      <section aria-labelledby="explorer-title" className="content-frame mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="explorer-title" className="font-display text-[clamp(28px,3.4vw,40px)] font-semibold text-on-ink">
              {p.explorer.title}
            </h2>
            <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-on-ink-muted">{p.explorer.lead}</p>
          </div>
          {isDemo ? <DemoBadge label={p.demoBadge} /> : null}
        </div>
        <div className="mt-6">
          <LatticeExplorer locale={locale} t={p} />
        </div>
      </section>

      <section aria-labelledby="calibration-title" className="content-frame mt-20">
        <h2 id="calibration-title" className="font-display text-[clamp(26px,3vw,36px)] font-semibold text-on-ink">
          {p.calibration.title}
        </h2>
        <p className="mt-2 max-w-[82ch] text-[14.5px] leading-relaxed text-on-ink-muted">{p.calibration.lead}</p>
        <LatticeCalibration locale={locale} t={p} />
      </section>

      <section aria-labelledby="kinds-title" className="content-frame mt-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="kinds-title" className="font-display text-[clamp(26px,3vw,36px)] font-semibold text-on-ink">
            {p.kindsTitle}
          </h2>
          {isDemo ? <DemoBadge label={p.demoBadge} /> : null}
        </div>
        <p className="mt-2 max-w-[80ch] text-[14.5px] leading-relaxed text-on-ink-muted">{p.kindsLead}</p>
        <div role="region" aria-labelledby="kinds-title" tabIndex={0} className="mt-5 overflow-x-auto rounded-xl border border-hairline-ink-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal">
          <table className="w-full text-left text-[13.5px]">
            <caption className="sr-only">
              {p.kindsTitle}
              {isDemo ? ` — ${p.demoBadge}` : ''}
            </caption>
            <thead className="bg-ink-2/80 text-on-ink-muted">
              <tr>
                {[p.kindsTable.kind, p.kindsTable.family, p.kindsTable.wall, p.kindsTable.range, p.kindsTable.voids].map((h) => (
                  <th key={h} scope="col" className="px-4 py-2.5 font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lattices.map((k) => {
                const voids = [...new Set(k.rows.map((r) => r.voids))].sort((a, b) => a - b);
                return (
                  <tr key={k.kind} className="border-t border-hairline-ink">
                    <th scope="row" className="px-4 py-2.5 font-normal">
                      <span className="block text-on-ink">{k.names[locale]}</span>
                      <span className="font-mono text-[11.5px] text-on-ink-muted">{k.kind}</span>
                    </th>
                    <td className="px-4 py-2.5 text-on-ink-muted">{p.families[k.family]}</td>
                    <td className="px-4 py-2.5 text-on-ink-muted">{p.meanings[k.wall_meaning]}</td>
                    <td className="px-4 py-2.5 font-mono whitespace-nowrap text-on-ink tabular-nums">
                      {tauNum(k.tau_min)}–{tauNum(k.tau_max)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-on-ink tabular-nums">{voids.join('–')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="how-title" className="content-frame mt-20">
        <h2 id="how-title" className="font-display text-[clamp(26px,3vw,36px)] font-semibold text-on-ink">
          {p.howTitle}
        </h2>
        <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-hairline-ink-strong bg-hairline-ink-strong md:grid-cols-2">
          {p.how.map(([term, text]) => (
            <div key={term} className="bg-ink/90 p-5">
              <dt className="font-display text-[19px] font-semibold text-on-ink">{term}</dt>
              <dd className="mt-2 text-[14.5px] leading-relaxed text-on-ink-muted">{text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="sources-title" className="content-frame mt-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="sources-title" className="font-display text-[clamp(26px,3vw,36px)] font-semibold text-on-ink">
            {p.sourcesTitle}
          </h2>
          {isDemo ? <DemoBadge label={p.demoBadge} /> : null}
        </div>
        <p className="mt-2 max-w-[82ch] text-[14.5px] leading-relaxed text-on-ink-muted">{p.sourcesLead}</p>
        <ol className="mt-6 border-t border-hairline-ink-strong">
          {sources.map((s, i) => (
            <li key={s.url} className="flex gap-4 border-b border-hairline-ink-strong py-3 text-[14px] leading-snug text-on-ink-muted">
              <span className="w-6 shrink-0 font-mono text-[12px] text-steel tabular-nums">{i + 1}</span>
              <span className="min-w-0">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="break-words text-on-ink underline-offset-4 hover:text-signal hover:underline">
                  <span lang="en">{s.title}</span>
                  <span aria-hidden="true"> ↗</span>
                  <span className="sr-only"> ({p.newTab})</span>
                </a>
                <span className="mt-1 block text-[12.5px]">
                  {p.usedBy}:{' '}
                  {[
                    ...[...s.uses].map(([process, uses]) => `${process} — ${uses.map(useText).join(', ')}`),
                    ...s.noSupports.map((process) => `${process} — ${p.supportsFlag}`),
                  ].join('; ')}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
