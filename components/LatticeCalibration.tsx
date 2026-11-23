import calibration from '@/data/lattice-calibration.json';
import type { Dict, Locale } from '@/lib/i18n';
import { evaluate, latticeOf, profileOf, type BuildName, type Overall, type Profile } from '@/lib/lattices';

/* THE CHECK AGAINST PUBLISHED SAMPLES (the user's rule 5): printed lattices from papers — successes and failures, each
   re-read at its source — run through the very same evaluate() the page uses, under the experiment's own conditions
   (its material's profile, its layer where the paper states it, the direction it was built in). The table says where
   Monge's verdict agrees with the print and where it does not, both ways: stricter than the print (a sample that built
   is "outside") and — the dangerous one — softer (a sample that failed is "within"). Nothing here tunes the rules. */

type T = Dict['latticesPage'];
export type Outcome = 'built' | 'built_with_defects' | 'failed' | 'partly_failed' | 'powder_trapped';
export type CalCase = {
  id: string;
  source_title: string;
  authors_year: string;
  source_url: string;
  process: string;
  material: string;
  machine: string;
  /** the layer the paper states, µm; null — not stated (the profile's layer is used, and the table says so) */
  layer_um: number | null;
  lattice_as_named: string;
  /** one of the page's kinds; null — no kind of the library matches: not compared */
  kind: string | null;
  /** null — the paper gives no cell size in mm, or the sample is not a cell */
  cell_mm: number | null;
  wall_mm: number | null;
  /** the material share the paper states, 0..1 — used for τ when it gives no wall */
  share: number | null;
  build: BuildName;
  /** the profile of the experiment's material and process; null — no profile for it (e.g. electron beam): not compared */
  profile: string | null;
  outcome: Outcome;
  outcome_words: string;
  where: string;
  /** why it is not compared, or what of the conditions matters, per language */
  note?: Partial<Record<Locale, string>>;
};
type CalData = { made: string; method: string; cases: CalCase[] };
export const calSet = calibration as unknown as CalData;

const built = (o: Outcome) => o === 'built' || o === 'built_with_defects';

/** τ of a case: its wall over its cell, or — given only the material share — the wall whose passport share is that. */
function tauOf(c: CalCase): number | null {
  if (c.cell_mm === null) return null;
  if (c.wall_mm !== null) return c.wall_mm / c.cell_mm;
  const kind = c.kind ? latticeOf(c.kind) : undefined;
  if (!kind || c.share === null) return null;
  const rows = [...kind.rows].sort((a, b) => a.tau - b.tau);
  for (let i = 0; i + 1 < rows.length; i++) {
    const [a, b] = [rows[i], rows[i + 1]];
    if (c.share >= a.share && c.share <= b.share) return a.tau + ((c.share - a.share) / (b.share - a.share)) * (b.tau - a.tau);
  }
  return null;
}

/** The case's profile with the experiment's layer, where the paper states it (the reach is read at the layer printed). */
function profileFor(c: CalCase): Profile | null {
  const p = c.profile ? profileOf(c.profile) : undefined;
  if (!p) return null;
  if (c.layer_um === null) return p;
  const layer = c.layer_um / 1000;
  return {
    ...p,
    limits: p.limits.map((l) => (l.key === 'layer' ? { ...l, value: layer, source_title: `${c.authors_year} — ${l.key}`, source_url: c.source_url, basis: `Measured experiment: layer ${c.layer_um} µm`, conditions: c.machine || l.conditions, material: c.material, range: '' } : l)),
  };
}

export type CalRow = { c: CalCase; tau: number | null; overall: Overall | null; failing: string[]; unknown: string[]; agree: 'agree' | 'stricter' | 'softer' | 'open' | 'none' };

export function calRows(): CalRow[] {
  return calSet.cases.map((c) => {
    const kind = c.kind ? latticeOf(c.kind) : undefined;
    const profile = profileFor(c);
    const tau = tauOf(c);
    if (!kind || !profile || tau === null || c.cell_mm === null || tau < kind.tau_min - 1e-9 || tau > kind.tau_max + 1e-9) return { c, tau, overall: null, failing: [], unknown: [], agree: 'none' };
    const ev = evaluate(kind, tau, c.cell_mm, profile, c.build);
    if (!ev.verdict) return { c, tau, overall: null, failing: [], unknown: [], agree: 'none' };
    const overall = ev.verdict.overall;
    const failing = ev.verdict.criteria.filter((x) => x.status === 'fail').map((x) => x.key);
    const unknown = ev.verdict.criteria.filter((x) => x.status === 'unknown').map((x) => x.key);
    // trapped powder or resin is the channel's to catch: the row agrees only if the channel check fails it — a verdict
    // that is "outside" for another reason while the channel passes is the channel rule being softer than the print
    const channel = ev.verdict.criteria.find((x) => x.key === 'channel');
    const agree: CalRow['agree'] =
      c.outcome === 'powder_trapped' && channel
        ? channel.status === 'fail'
          ? 'agree'
          : channel.status === 'ok'
            ? 'softer'
            : 'open'
        : overall === 'unknown'
          ? 'open'
          : built(c.outcome) === (overall === 'within')
            ? 'agree'
            : built(c.outcome)
              ? 'stricter'
              : 'softer';
    return { c, tau, overall, failing, unknown, agree };
  });
}

const AGREE_TONE: Record<CalRow['agree'], string> = {
  agree: 'border-signal/50 text-signal',
  stricter: 'border-[#ffb648]/60 text-[#ffc56e]',
  softer: 'border-[#ff6b5b]/60 text-[#ff8f82]',
  open: 'border-hairline-ink-strong text-on-ink-muted',
  none: 'border-hairline-ink-strong text-on-ink-muted',
};

export function LatticeCalibration({ locale, t }: { locale: Locale; t: T }) {
  const s = t.calibration;
  const rows = calRows();
  const num = (v: number, d: number) => v.toLocaleString(locale, { maximumFractionDigits: d });
  const names = (keys: string[]) => keys.map((k) => t.verdict.criteria[k as keyof T['verdict']['criteria']]).join(', ');
  const count = (a: CalRow['agree']) => rows.filter((r) => r.agree === a).length;
  return (
    <div>
      <p className="mt-2 max-w-[82ch] text-[14.5px] leading-relaxed text-on-ink-muted">
        {s.summary
          .replace('{n}', String(rows.length))
          .replace('{agree}', String(count('agree')))
          .replace('{stricter}', String(count('stricter')))
          .replace('{softer}', String(count('softer')))
          .replace('{open}', String(count('open')))
          .replace('{none}', String(count('none')))}
      </p>
      <div role="region" aria-label={s.title} tabIndex={0} className="mt-5 overflow-x-auto rounded-xl border border-hairline-ink-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal">
        <table className="w-full min-w-[56rem] text-left text-[13px]">
          <caption className="sr-only">{s.title}</caption>
          <thead className="bg-ink-2/80 text-on-ink-muted">
            <tr>
              {[s.head.source, s.head.conditions, s.head.lattice, s.head.published, s.head.monge, s.head.agree].map((h) => (
                <th key={h} scope="col" className="px-3 py-2.5 align-bottom font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const c = r.c;
              const kind = c.kind ? latticeOf(c.kind) : undefined;
              return (
                <tr key={c.id} className="border-t border-hairline-ink align-top">
                  <td className="px-3 py-2.5">
                    <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="text-on-ink underline underline-offset-2 hover:text-signal">
                      <span lang="en">{c.authors_year}</span>
                      <span aria-hidden="true"> ↗</span>
                      <span className="sr-only"> ({t.newTab})</span>
                    </a>
                    <span className="mt-0.5 block text-[12px] text-on-ink-muted" lang="en">
                      {c.source_title}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-on-ink-muted">
                    <span className="block font-mono text-on-ink">{c.process}</span>
                    <span className="block" lang="en">
                      {c.material}
                    </span>
                    {c.machine ? (
                      <span className="block" lang="en">
                        {c.machine}
                      </span>
                    ) : null}
                    <span className="block">{c.layer_um !== null ? s.layer.replace('{um}', String(c.layer_um)) : r.overall ? s.layerProfile : s.layerNone}</span>
                  </td>
                  <td className="px-3 py-2.5 text-on-ink-muted">
                    <span className="block text-on-ink">{kind ? kind.names[locale] : <span lang="en">{c.lattice_as_named}</span>}</span>
                    <span className="block font-mono">
                      {[
                        ...(c.cell_mm !== null ? [s.cell.replace('{cell}', num(c.cell_mm, 2))] : []),
                        ...(c.wall_mm !== null ? [s.wall.replace('{wall}', num(c.wall_mm, 3))] : c.share !== null ? [s.share.replace('{share}', num(c.share * 100, 1))] : []),
                      ].join(' · ') || '—'}
                    </span>
                    {r.overall && r.tau !== null ? <span className="block font-mono">τ = {num(r.tau, 3)} · {c.build}</span> : null}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="block font-medium text-on-ink">{s.outcome[c.outcome]}</span>
                    <span className="mt-0.5 block text-[12px] text-on-ink-muted" lang="en">
                      “{c.outcome_words}” — {c.where}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-on-ink-muted">
                    {r.overall ? (
                      <>
                        <span className="block font-medium text-on-ink">{t.verdict.overall[r.overall]}</span>
                        {r.failing.length ? <span className="block">{s.failing.replace('{list}', names(r.failing))}</span> : null}
                        {r.unknown.length ? <span className="block">{s.unknownBy.replace('{list}', names(r.unknown))}</span> : null}
                        <span className="block text-[12px]">{s.profile.replace('{profile}', profileOf(c.profile ?? '')?.title[locale] ?? '—')}</span>
                      </>
                    ) : (
                      <span className="block">{s.notCompared}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap ${AGREE_TONE[r.agree]}`}>{s.agree[r.agree]}</span>
                    {c.note?.[locale] ? <span className="mt-1.5 block text-[12px] leading-snug text-on-ink-muted">{c.note[locale]}</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 max-w-[82ch] text-[13px] leading-relaxed text-on-ink-muted">{s.method}</p>
    </div>
  );
}
