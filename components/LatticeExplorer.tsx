'use client';

import { useId, useState } from 'react';
import { DemoBadge } from '@/components/DemoBadge';
import { LatticeSample } from '@/components/LatticeSample';
import { LatticeWindow } from '@/components/LatticeWindow';
import type { Dict, Locale } from '@/lib/i18n';
import {
  BUILD_NAMES,
  FAMILIES,
  clampTau,
  evaluate,
  isDemo,
  latticeOf,
  lattices,
  limitOf,
  profileOf,
  profileSet,
  profiles,
  reachAt,
  sampleOf,
  type Build,
  type BuildName,
  type Criterion,
  type Downskin,
  type LatticeKind,
  type Limit,
  type Overall,
  type Profile,
  type Quantity,
  type Row,
  type Status,
} from '@/lib/lattices';

/* The lattice explorer: a kind, a cell size in mm, a wall, a build direction and a print process give the cell's
   passport and — only with a cell size — the check against the process's limits, each limit with its source. All of it
   is computed here, in the browser, by the pure functions of lib/lattices.ts; no threshold lives in this file. */

type T = Dict['latticesPage'];
type Mode = 'share' | 'mm';

// ── numbers ──

const num = (locale: Locale, v: number, min: number, max = min) => v.toLocaleString(locale, { minimumFractionDigits: min, maximumFractionDigits: max });
/** a number to put back into an input: no grouping, so it reads again */
const inputNum = (locale: Locale, v: number, max: number) => v.toLocaleString(locale, { maximumFractionDigits: max, useGrouping: false });
/** "0,8" and "0.8" → 0.8; "" → null; anything else → NaN */
function parseNum(text: string): number | null {
  const s = text.replace(/[\s  ]/g, '').replace(',', '.');
  if (!s) return null;
  return /^\+?(\d+\.?\d*|\.\d+)$/.test(s) ? Number(s) : NaN;
}
const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (all, k: string) => (k in values ? values[k] : all));

type Fmt = ReturnType<typeof formats>;
function formats(locale: Locale, t: T) {
  const mm = (v: number) => `${num(locale, v, v < 10 ? 2 : 1)} ${t.units.mm}`;
  /** a source's number exactly as it gives it; a layer too (0.0025 mm must not read 0.00) */
  const exactMm = (v: number) => `${num(locale, v, 0, 4)} ${t.units.mm}`;
  /** a measured length set against a limit: three decimals, so the words never say "0.38 < 0.38" */
  const mmFine = (v: number) => `${num(locale, v, 2, 3)} ${t.units.mm}`;
  const deg = (v: number) => `${num(locale, v, 0, 2)}°`;
  const cells = (v: number) => num(locale, v, 3);
  const tau = (v: number) => num(locale, v, 2, 3);
  const pct = (v: number) => `${num(locale, v * 100, 1)} %`;
  const cell = (v: number) => `${num(locale, v, 0, 3)} ${t.units.mm}`;
  const q = (x: Quantity, exact = false) => (x.unit === 'mm' ? (exact ? exactMm(x.value) : mm(x.value)) : x.unit === 'deg' ? deg(x.value) : num(locale, x.value, 0));
  /** the cell's own measured value next to a limit */
  const measured = (x: Quantity) => (x.unit === 'mm' ? mmFine(x.value) : q(x));
  const limit = (l: Limit) => q({ value: l.value, unit: l.unit }, true);
  return { mm, exactMm, deg, cells, tau, pct, cell, q, measured, limit };
}

// ── small parts ──

const tone: Record<Status | Overall, string> = {
  ok: 'border-signal/50 bg-signal/10 text-signal',
  within: 'border-signal/50 bg-signal/10 text-signal',
  fail: 'border-[#ff6b5b]/60 bg-[#ff6b5b]/10 text-[#ff8f82]',
  outside: 'border-[#ff6b5b]/60 bg-[#ff6b5b]/10 text-[#ff8f82]',
  unknown: 'border-[#ffb648]/60 bg-[#ffb648]/10 text-[#ffc56e]',
};

/** A status in words and colour (the words carry it; the colour only repeats them). */
function Chip({ status, label }: { status: Status | Overall; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap ${tone[status]}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}

/** "—" in a table cell, with the reason for screen readers and on hover. */
function Dash({ label }: { label: string }) {
  return (
    <span title={label} className="text-on-ink-muted">
      —<span className="sr-only"> {label}</span>
    </span>
  );
}

function Lines({ items }: { items: string[] }) {
  return (
    <span className="grid gap-0.5">
      {items.map((x, i) => (
        <span key={i} className="block whitespace-nowrap">
          {x}
        </span>
      ))}
    </span>
  );
}

function ExternalLink({ href, children, newTab }: { href: string; children: React.ReactNode; newTab: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="break-words text-on-ink underline underline-offset-2 hover:text-signal">
      <span lang="en">{children}</span>
      <span aria-hidden="true"> ↗</span>
      <span className="sr-only"> ({newTab})</span>
    </a>
  );
}

const labelCls = 'block text-[13px] font-medium text-on-ink';
const fieldCls =
  'w-full rounded-lg border border-hairline-ink-strong bg-ink px-3 py-2.5 font-mono text-[16px] text-on-ink outline-none placeholder:text-on-ink-muted/60 focus:border-signal aria-[invalid=true]:border-[#ffb648] md:text-[14px]';
const selectCls = 'mt-1.5 w-full cursor-pointer rounded-lg border border-hairline-ink-strong bg-ink px-3 py-2.5 text-[16px] text-on-ink outline-none focus:border-signal md:text-[14px]';
const pillCls =
  'inline-flex rounded-full border border-hairline-ink-strong px-3 py-1.5 text-[13px] text-on-ink-muted transition-colors hover:text-on-ink peer-checked:border-signal peer-checked:bg-signal/10 peer-checked:text-signal peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal';

// ── the passport ──

type PassportKey = keyof T['passport']['rows'];

function Passport({ t, f, locale, kind, row, build, cellMm, profileAngle, profileLayer }: { t: T; f: Fmt; locale: Locale; kind: LatticeKind; row: Row; build: Build; cellMm: number | null; profileAngle?: number; profileLayer?: number }) {
  const a = cellMm;
  const need = <Dash label={t.passport.needsCell} />;
  const same = <Dash label={t.passport.sameAtAnyCell} />;
  // three angles, and the profile's own where the passport has the share at it
  const angles = [...new Set([30, 45, 60, ...(profileAngle !== undefined ? [profileAngle] : [])])].filter((d) => build.below.some(([x]) => x === d)).sort((x, y) => x - y);
  const lam = (l: number) => num(locale, l, 2, 4);
  // with a cell: the reach at the profile's layer first (when the passport has it), then at each of its layers in mm
  const atProfile = a && profileLayer !== undefined ? reachAt(build, profileLayer / a) : null;
  const reachMm = a
    ? [
        ...(atProfile && atProfile.found
          ? [fill(t.passport.reachProfile, { layer: f.exactMm(profileLayer as number), reach: atProfile.cells === null ? t.passport.noSupport : f.mm(atProfile.cells * a) })]
          : []),
        ...build.reach.map(([l, r]) => fill(t.passport.reachLayer, { layer: f.exactMm(l * a), reach: r === null ? t.passport.noSupport : f.mm(r * a) })),
      ]
    : [];
  const belowAt = (d: number) => build.below.find(([x]) => x === d)?.[1];
  const line = (key: PassportKey, cells: React.ReactNode, phys: React.ReactNode) => ({ key, cells, phys });
  const general = [
    line('tau', f.tau(row.tau), a ? f.mm(row.tau * a) : need),
    line('share', num(locale, row.share, 3), f.pct(row.share)),
    line('voids', String(row.voids), same),
    line('pieces', String(row.pieces), same),
    line('channels', <Lines items={row.channels.map(f.cells)} />, a ? <Lines items={row.channels.map((c) => f.mm(c * a))} /> : need),
    line('channel', f.cells(row.channel), a ? f.mm(row.channel * a) : need),
    line('ligament', f.cells(row.ligament), a ? f.mm(row.ligament * a) : need),
    line('area', num(locale, row.area, 2), a ? `${num(locale, row.area / a, row.area / a < 1 ? 3 : 2)} ${t.units.perMm}` : need),
  ];
  const printed = [
    line('min_slope', f.deg(build.min_slope), same),
    line(
      'below',
      <Lines
        items={angles.map((d) => {
          const s = belowAt(d);
          return `${f.deg(d)}: ${s === undefined ? '—' : f.pct(s)}`;
        })}
      />,
      same,
    ),
    line(
      'reach',
      <Lines items={build.reach.map(([l, r]) => fill(t.passport.reachLayer, { layer: `λ ${lam(l)}`, reach: r === null ? t.passport.noSupport : f.cells(r) }))} />,
      a ? <Lines items={reachMm} /> : need,
    ),
    line('starts', String(build.starts), same),
  ];
  const cellCls = 'px-3 py-2.5 align-top font-mono text-on-ink tabular-nums md:px-4';
  const tr = (r: ReturnType<typeof line>) => {
    const [name, def] = t.passport.rows[r.key];
    return (
      <tr key={r.key} className="border-t border-hairline-ink">
        <th scope="row" className="px-3 py-2.5 align-top font-normal md:px-4">
          <span className="block text-on-ink">{name}</span>
          <span className="mt-0.5 block text-[12px] leading-snug text-on-ink-muted">{fill(def, { meaning: t.meanings[kind.wall_meaning] })}</span>
        </th>
        <td className={cellCls}>{r.cells}</td>
        <td className={cellCls}>{r.phys}</td>
      </tr>
    );
  };
  return (
    <div role="region" aria-label={t.passport.title} tabIndex={0} className="mt-4 overflow-x-auto rounded-xl border border-hairline-ink-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal">
      <table className="w-full text-left text-[13px] md:text-[13.5px]">
        <caption className="sr-only">
          {t.passport.title}: {kind.names[locale]}, τ = {f.tau(row.tau)}
          {isDemo ? ` — ${t.demoBadge}` : ''}
        </caption>
        <thead className="bg-ink-2/80 text-on-ink-muted">
          <tr>
            <th scope="col" className="px-3 py-2.5 font-medium md:px-4">
              {t.passport.measure}
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium md:px-4">
              {t.passport.cells}
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium md:px-4">
              {a ? fill(t.passport.physical, { cell: f.cell(a) }) : t.passport.physicalNone}
            </th>
          </tr>
        </thead>
        <tbody>{general.map(tr)}</tbody>
        <tbody>
          <tr className="border-t border-hairline-ink-strong bg-ink-2/50">
            <th scope="rowgroup" colSpan={3} className="px-3 py-2 text-left text-[12.5px] font-medium text-steel md:px-4">
              {fill(t.passport.buildGroup, { build: build.name, name: t.builds[build.name] })}
            </th>
          </tr>
          {printed.map(tr)}
        </tbody>
      </table>
    </div>
  );
}

// ── the check ──

function LimitSource({ l, t, f, profile }: { l: Limit; t: T; f: Fmt; profile: Profile }) {
  return (
    <li className="text-[12.5px] leading-relaxed text-on-ink-muted">
      <p>
        <span className="font-mono text-on-ink">
          {t.limitNames[l.key]} {f.limit(l)}
        </span>
        {' — '}
        <ExternalLink href={l.source_url} newTab={t.newTab}>
          {l.source_title}
        </ExternalLink>
      </p>
      <p>
        {t.verdict.process}: <span className="font-mono">{profile.process}</span> · {t.verdict.material}: <span lang="en">{l.material}</span>
      </p>
      <p>
        {t.verdict.conditions}: <span lang="en">{l.conditions}</span>
      </p>
      {l.range ? (
        <p>
          {t.verdict.range}: <span lang="en">{l.range}</span>
        </p>
      ) : null}
      <details className="mt-1">
        <summary className="cursor-pointer text-on-ink hover:text-signal">{t.verdict.basis}</summary>
        <p className="mt-1" lang="en">
          {l.basis}
        </p>
      </details>
    </li>
  );
}

function CriterionCard({ c, t, f, profile }: { c: Criterion; t: T; f: Fmt; profile: Profile }) {
  const limitText =
    c.why === 'no_supports'
      ? t.verdict.notNeeded
      : c.key === 'starts'
        ? t.verdict.startsRule
        : c.limits.length
          ? c.limits.map((l) => `${t.limitNames[l.key]} ${f.limit(l)}`).join(' · ')
          : t.verdict.noLimit;
  // the cell's own number as measured, the sources' numbers exactly as they give them
  const values: Record<string, string> = Object.fromEntries(
    Object.entries(c.values).map(([k, q]) => [k, k === 'measured' ? f.measured(q) : k === 'most' || k === 'least' || k === 'layer' ? f.q(q, true) : f.q(q, k !== 'n')]),
  );
  return (
    <li className="rounded-xl border border-hairline-ink-strong bg-ink-2/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-[15px] font-semibold text-on-ink">{t.verdict.criteria[c.key]}</h4>
        <Chip status={c.status} label={t.verdict.status[c.status]} />
      </div>
      <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13px]">
        <dt className="text-on-ink-muted">{t.verdict.measured}</dt>
        <dd className="font-mono text-on-ink">{c.measured ? f.measured(c.measured) : '—'}</dd>
        <dt className="text-on-ink-muted">{t.verdict.limit}</dt>
        <dd className="text-on-ink">{limitText}</dd>
      </dl>
      <p className="mt-2 text-[13px] leading-snug text-on-ink-muted">{fill(t.verdict.why[c.why], values)}</p>
      {c.missing.length ? <p className="mt-1.5 text-[12.5px] text-[#ffc56e]">{fill(t.verdict.missing, { keys: c.missing.map((k) => t.limitNames[k]).join(', ') })}</p> : null}
      {c.limits.length ? (
        <ul className="mt-3 grid gap-3 border-t border-hairline-ink pt-3">
          {c.limits.map((l) => (
            <LimitSource key={l.key} l={l} t={t} f={f} profile={profile} />
          ))}
        </ul>
      ) : null}
      {c.source ? (
        <div className="mt-3 border-t border-hairline-ink pt-3 text-[12.5px] leading-relaxed text-on-ink-muted">
          <p>
            <ExternalLink href={c.source.url} newTab={t.newTab}>
              {c.source.title}
            </ExternalLink>
          </p>
          <p lang="en">{c.source.basis}</p>
        </div>
      ) : null}
      {isDemo ? <DemoBadge label={t.demoBadge} className="mt-3" /> : null}
    </li>
  );
}

/** The share of the surface flatter than the profile's angle: shown with its source, not judged. */
function DownskinCard({ d, t, f, profile }: { d: Downskin; t: T; f: Fmt; profile: Profile }) {
  return (
    <li className="rounded-xl border border-dashed border-hairline-ink-strong p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-[15px] font-semibold text-on-ink">{t.verdict.downskin.title}</h4>
        <span className="rounded-full border border-hairline-ink-strong px-2.5 py-0.5 text-[12px] text-on-ink-muted">{t.verdict.downskin.badge}</span>
      </div>
      <p className="mt-2 text-[13px] leading-snug text-on-ink">
        {d.share === null ? fill(t.verdict.downskin.none, { angle: f.limit(d.angle) }) : fill(t.verdict.downskin.text, { share: f.pct(d.share), angle: f.limit(d.angle) })}
      </p>
      <p className="mt-1.5 text-[12.5px] leading-snug text-on-ink-muted">{t.verdict.downskin.why}</p>
      <ul className="mt-3 grid gap-3 border-t border-hairline-ink pt-3">
        <LimitSource l={d.angle} t={t} f={f} profile={profile} />
      </ul>
    </li>
  );
}

// ── the explorer ──

export function LatticeExplorer({ locale, t }: { locale: Locale; t: T }) {
  const uid = useId();
  const id = (s: string) => `${uid}-${s}`;
  const [kindId, setKindId] = useState(lattices[0].kind);
  const [cellText, setCellText] = useState('');
  const [mode, setMode] = useState<Mode>('share');
  const [wallText, setWallText] = useState(() => inputNum(locale, 0.1, 3));
  const [buildSel, setBuildSel] = useState<'auto' | BuildName>('auto');
  const [profileId, setProfileId] = useState(profiles[0].id);

  const f = formats(locale, t);
  const kind = latticeOf(kindId) ?? lattices[0];
  const profile = profileOf(profileId) ?? profiles[0];

  // the cell: empty — no verdict (rule 1); not a positive number — said so, and still no verdict
  const cellVal = parseNum(cellText);
  const cellMm = cellVal !== null && cellVal > 0 ? cellVal : null;
  const cellError = cellText.trim() !== '' && cellMm === null;

  // the wall: a share of the cell, or mm once a cell is given; held to the kind's range, and the page says when
  const wallVal = parseNum(wallText);
  const wallOk = wallVal !== null && wallVal > 0;
  const inMm = mode === 'mm' && cellMm !== null;
  const asked = wallOk ? (inMm ? wallVal / cellMm : wallVal) : null;
  const held = asked === null ? { tau: clampTau(kind, 0.1).tau, clamped: null } : clampTau(kind, asked);
  const tau = held.tau;
  const showWall = (tv: number) => (inMm && cellMm !== null ? `${f.mm(tv * cellMm)} (τ = ${f.tau(tv)})` : `τ = ${f.tau(tv)}`);
  const range = { min: f.tau(kind.tau_min), max: f.tau(kind.tau_max) };
  const wallMsg =
    asked === null
      ? fill(t.explorer.wallInvalid, { used: f.tau(tau) })
      : held.clamped
        ? fill(t.explorer.wallClamped, { asked: showWall(asked), used: showWall(tau), ...range })
        : fill(t.explorer.wallRange, range);
  const wallWarn = asked === null || held.clamped !== null;

  // a wall out of the kind's range (or not a number) gets no verdict: the passport row shown is the nearest wall's, and
  // a verdict on it would be about a wall nobody asked for
  const wallHeld = asked === null || held.clamped !== null;
  const ev = evaluate(kind, tau, wallHeld ? null : cellMm, profile, buildSel === 'auto' ? undefined : buildSel);
  const verdict = ev.verdict;
  const angle = limitOf(profile, 'angle');
  const layer = limitOf(profile, 'layer');

  const onCell = (text: string) => {
    const v = parseNum(text);
    if (mode === 'mm' && !(v !== null && v > 0)) {
      // a wall in mm means nothing without a cell: back to the share of the cell, at the wall it had
      setMode('share');
      setWallText(inputNum(locale, tau, 4));
    }
    setCellText(text);
  };
  const onMode = (m: Mode) => {
    if (m === mode) return;
    if (m === 'mm') {
      if (cellMm === null) return;
      setWallText(inputNum(locale, tau * cellMm, 3));
    } else setWallText(inputNum(locale, tau, 4));
    setMode(m);
  };

  const buildLabel = ev.build ? `${ev.build.name} (${t.builds[ev.build.name]})` : '—';
  const noRowText = fill(t.verdict.noRow, { asked: asked === null ? '—' : showWall(asked), ...range, used: f.tau(tau) });
  const summary =
    cellMm === null
      ? fill(t.explorer.summary, { kind: kind.names[locale], tau: f.tau(tau), build: buildLabel })
      : fill(t.explorer.summaryCell, { kind: kind.names[locale], cell: f.cell(cellMm), wall: f.mm(tau * cellMm), tau: f.tau(tau), build: buildLabel });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:gap-10">
      <form onSubmit={(e) => e.preventDefault()} aria-label={t.explorer.title} className="grid content-start gap-6 rounded-xl border border-hairline-ink-strong bg-ink-2/60 p-4 md:p-5">
        <fieldset>
          <legend className={labelCls}>{t.explorer.kind}</legend>
          <div className="mt-2 grid gap-3">
            {FAMILIES.map((fam) => (
              <div key={fam}>
                <p id={id(`family-${fam}`)} className="text-[12px] font-medium text-steel">
                  {t.families[fam]}
                </p>
                <div role="group" aria-labelledby={id(`family-${fam}`)} className="mt-1.5 flex flex-wrap gap-1.5">
                  {lattices
                    .filter((k) => k.family === fam)
                    .map((k) => (
                      <label key={k.kind} className="cursor-pointer">
                        <input type="radio" name={id('kind')} value={k.kind} checked={k.kind === kind.kind} onChange={() => setKindId(k.kind)} className="peer sr-only" />
                        <span className={pillCls}>{k.names[locale]}</span>
                      </label>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={id('cell')} className={labelCls}>
            {t.explorer.cell}
          </label>
          <input
            id={id('cell')}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            value={cellText}
            placeholder={t.explorer.cellPlaceholder}
            onChange={(e) => onCell(e.target.value)}
            aria-invalid={cellError || undefined}
            aria-describedby={id('cell-note')}
            className={`mt-1.5 ${fieldCls}`}
          />
          <p id={id('cell-note')} aria-live="polite" className={`mt-1.5 text-[12.5px] leading-snug ${cellError ? 'text-[#ffc56e]' : 'text-on-ink-muted'}`}>
            {cellError ? t.explorer.cellInvalid : cellMm === null ? t.explorer.cellHint : fill(t.explorer.cellSet, { cell: num(locale, cellMm, 0, 3) })}
          </p>
        </div>

        <div>
          <p id={id('wall-label')} className={labelCls}>
            {t.explorer.wall} — {t.meanings[kind.wall_meaning]}
          </p>
          <fieldset className="mt-1.5">
            <legend className="sr-only">{t.explorer.wallAs}</legend>
            <div className="inline-flex rounded-lg border border-hairline-ink-strong p-0.5">
              {(['share', 'mm'] as const).map((m) => {
                const off = m === 'mm' && cellMm === null;
                return (
                  <label key={m} className={off ? 'cursor-not-allowed' : 'cursor-pointer'}>
                    <input
                      type="radio"
                      name={id('mode')}
                      value={m}
                      checked={(m === 'mm') === inMm}
                      disabled={off}
                      onChange={() => onMode(m)}
                      aria-describedby={off ? id('mm-note') : undefined}
                      className="peer sr-only"
                    />
                    <span className="block rounded-md px-3 py-1.5 text-[13px] text-on-ink-muted transition-colors peer-checked:bg-signal/10 peer-checked:text-signal peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-signal peer-disabled:opacity-40">
                      {m === 'mm' ? t.explorer.wallMm : t.explorer.wallShare}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {cellMm === null ? (
            <p id={id('mm-note')} className="mt-1.5 text-[12px] leading-snug text-on-ink-muted">
              {t.explorer.wallMmNeedsCell}
            </p>
          ) : null}
          <div className="relative mt-2">
            <input
              id={id('wall')}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              value={wallText}
              onChange={(e) => setWallText(e.target.value)}
              aria-labelledby={`${id('wall-label')} ${id('wall-unit')}`}
              aria-invalid={wallWarn || undefined}
              aria-describedby={id('wall-note')}
              className={`${fieldCls} pr-12`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[13px] text-on-ink-muted" aria-hidden="true">
              {inMm ? t.units.mm : 'τ'}
            </span>
            <span id={id('wall-unit')} className="sr-only">
              {inMm ? t.explorer.wallMm : t.explorer.wallShare}
            </span>
          </div>
          <p id={id('wall-note')} aria-live="polite" className={`mt-1.5 text-[12.5px] leading-snug ${wallWarn ? 'text-[#ffc56e]' : 'text-on-ink-muted'}`}>
            {wallMsg}
          </p>
        </div>

        <div>
          <label htmlFor={id('build')} className={labelCls}>
            {t.explorer.build}
          </label>
          <select id={id('build')} value={buildSel} onChange={(e) => setBuildSel(e.target.value as 'auto' | BuildName)} aria-describedby={id('build-note')} className={selectCls}>
            <option value="auto">{ev.best ? fill(t.explorer.buildAuto, { name: `${ev.best} — ${t.builds[ev.best]}` }) : t.explorer.buildAutoNoCell}</option>
            {BUILD_NAMES.map((b) => (
              <option key={b} value={b}>
                {b} — {t.builds[b]}
              </option>
            ))}
          </select>
          <p id={id('build-note')} className="mt-1.5 text-[12px] leading-snug text-on-ink-muted">
            {t.explorer.buildHint}
          </p>
        </div>

        <div>
          <label htmlFor={id('profile')} className={labelCls}>
            {t.explorer.profile}
          </label>
          <select id={id('profile')} value={profile.id} onChange={(e) => setProfileId(e.target.value)} aria-describedby={id('profile-note')} className={selectCls}>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title[locale]}
              </option>
            ))}
          </select>
          <div id={id('profile-note')} className="mt-2 grid gap-1 text-[12.5px] leading-snug text-on-ink-muted">
            <p>
              {t.explorer.process}: <span className="font-mono text-on-ink">{profile.process}</span> · {t.explorer.material}: <span className="text-on-ink">{profile.material ?? t.explorer.anyMaterial}</span>
            </p>
            {profile.note ? <p>{profile.note[locale]}</p> : null}
            {!profileSet.verified ? <p className="text-[#ffc56e]">{t.explorer.unverified}</p> : null}
          </div>
        </div>
      </form>

      <div className="min-w-0">
        <LatticeSample sample={sampleOf(kind.kind)} name={kind.names[locale]} locale={locale} t={t} />
        <p className="mt-8 font-mono text-[12.5px] leading-relaxed text-on-ink-muted">{summary}</p>

        <section aria-labelledby={id('passport')} className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id={id('passport')} className="font-display text-[24px] font-semibold text-on-ink">
              {t.passport.title}
            </h3>
            {isDemo ? <DemoBadge label={t.demoBadge} /> : null}
          </div>
          {ev.row && ev.build ? (
            <>
              <Passport t={t} f={f} locale={locale} kind={kind} row={ev.row} build={ev.build} cellMm={cellMm} profileAngle={angle?.value} profileLayer={layer?.value} />
              {ev.row.between ? <p className="mt-2 text-[12.5px] text-on-ink-muted">{fill(t.passport.between, { a: f.tau(ev.row.between[0]), b: f.tau(ev.row.between[1]) })}</p> : null}
            </>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-hairline-ink-strong p-4 text-[14px] text-on-ink-muted">{t.passport.noData}</p>
          )}
        </section>

        <section aria-labelledby={id('verdict')} className="mt-10">
          <h3 id={id('verdict')} className="font-display text-[24px] font-semibold text-on-ink">
            {t.verdict.title}
          </h3>
          {/* one live region that is always there, so a screen reader hears each new verdict */}
          <p role="status" className="sr-only">
            {verdict ? `${t.verdict.overall[verdict.overall]}. ${fill(t.verdict.overallText[verdict.overall], { profile: profile.title[locale] })}` : cellMm !== null && wallHeld ? noRowText : t.verdict.needCell}
          </p>
          {verdict ? (
            <>
              <div className={`mt-4 rounded-xl border p-4 md:p-5 ${tone[verdict.overall]}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip status={verdict.overall} label={t.verdict.overall[verdict.overall]} />
                  {isDemo ? <DemoBadge label={t.demoBadge} /> : null}
                </div>
                <p className="mt-2 text-[14.5px] leading-snug text-on-ink">
                  {fill(t.verdict.overallText[verdict.overall], { profile: profile.title[locale] })}
                </p>
              </div>
              {!profile.trapped ? <p className="mt-3 text-[13px] text-on-ink-muted">{t.verdict.noChannel}</p> : null}
              <ul className="mt-4 grid gap-3">
                {verdict.criteria.map((c) => (
                  <CriterionCard key={c.key} c={c} t={t} f={f} profile={profile} />
                ))}
                {ev.downskin ? <DownskinCard d={ev.downskin} t={t} f={f} profile={profile} /> : null}
              </ul>
            </>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-hairline-ink-strong p-4 text-[14.5px] leading-snug text-on-ink">
              {cellMm !== null && wallHeld ? noRowText : t.verdict.needCell}
            </p>
          )}
          <section aria-labelledby={id('window')} className="mt-8">
            <h4 id={id('window')} className="font-display text-[20px] font-semibold text-on-ink">
              {t.window.title}
            </h4>
            <p className="mt-1.5 max-w-[75ch] text-[13.5px] leading-relaxed text-on-ink-muted">{t.window.lead}</p>
            <LatticeWindow
              kind={kind}
              profile={profile}
              build={buildSel === 'auto' ? undefined : buildSel}
              cellMm={cellMm}
              wallMm={cellMm !== null && asked !== null ? (inMm ? (wallVal as number) : asked * cellMm) : null}
              locale={locale}
              t={t}
              onPick={(cell, wall) => {
                setCellText(inputNum(locale, cell, 2));
                setMode('mm');
                setWallText(inputNum(locale, wall, 2));
              }}
            />
          </section>
          <div className="mt-5 rounded-xl border border-hairline-ink-strong p-4">
            <h4 className="text-[13.5px] font-semibold text-on-ink">{t.verdict.notesTitle}</h4>
            <ul className="mt-2 grid gap-1.5">
              {[...t.verdict.notes, ...(isDemo ? [t.verdict.demoNote] : [])].map((n) => (
                <li key={n} className="flex gap-2.5 text-[13px] leading-snug text-on-ink-muted">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#ffb648]" aria-hidden="true" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
