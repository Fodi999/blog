import { LogoMark } from '@/components/Logo';
import { fill, type Dict, type Locale } from '@/lib/i18n';
import { benchmarks, fmtMemory, fmtTime, plural, status } from '@/lib/status';
import { statusValues } from '@/lib/statusText';

/* Parts of the "drawing sheet" the site is laid out as: the title block with the project data,
   the kernel test protocol, the revision table of the development log and plain spec lists.
   Thick rule = outer frame of a drawing, thin rules = its inner lines. */

const frame = 'border-2 border-on-ink/45';
const line = 'border-hairline-ink-strong';

function Cell({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex min-h-[74px] flex-col justify-between gap-2 px-4 py-3 ${className}`}>
      <span className="text-[12px] leading-none text-on-ink-muted">{label}</span>
      <span className="font-display text-[17px] leading-snug font-medium text-on-ink">{children}</span>
    </div>
  );
}

/** The title block (основная надпись) of the site: what Monge is, its stage, version, start and checks. */
export function TitleBlock({ locale, t, className = '' }: { locale: Locale; t: Dict; className?: string }) {
  const b = t.block;
  const v = statusValues(locale, t);
  return (
    <section aria-label={b.label} className={`${frame} grid grid-cols-2 bg-ink md:grid-cols-[1.5fr_1fr_1fr_150px] ${className}`}>
      <Cell label={b.product} className={`col-span-2 border-b md:col-span-1 md:border-r ${line}`}>
        {b.productValue}
      </Cell>
      <Cell label={b.stage} className={`border-r border-b ${line}`}>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-signal" aria-hidden="true" />
          {b.stageValue}
        </span>
      </Cell>
      <Cell label={b.version} className={`border-b md:border-r ${line}`}>
        <span className="font-mono text-[14px]">
          {status.version}
          <span className="block text-[12px] text-on-ink-muted">{v.versionDate}</span>
        </span>
      </Cell>
      <div className={`hatch col-span-2 row-span-1 flex items-center justify-center gap-3 border-b px-4 py-4 md:col-span-1 md:row-span-3 md:flex-col md:border-b-0 ${line}`}>
        <LogoMark className="size-11" />
        <span className="font-display text-[15px] font-semibold tracking-[.2em] text-on-ink">MONGE</span>
      </div>
      <Cell label={b.kernel} className={`col-span-2 border-b md:col-span-1 md:border-r ${line}`}>
        {b.kernelValue}
      </Cell>
      <Cell label={b.started} className={`border-r border-b ${line}`}>
        {b.startedValue}
      </Cell>
      <Cell label={b.check} className={`border-b md:border-r ${line}`}>
        <span className="font-mono text-[14px]">{fill(b.checkValue, v)}</span>
      </Cell>
      <Cell label={b.developer} className={`col-span-2 border-b md:col-span-1 md:border-r md:border-b-0 ${line}`}>
        {b.developerValue}
      </Cell>
      <Cell label={b.platform} className={`border-r ${line}`}>
        {b.platformValue}
      </Cell>
      <Cell label={b.updated} className={`md:border-r ${line}`}>
        <span className="font-mono text-[14px]">{v.checked}</span>
      </Cell>
    </section>
  );
}

/** A plain list of terms and their descriptions, ruled like a specification table. */
export function SpecList({ items, className = '' }: { items: string[][]; className?: string }) {
  return (
    <dl className={`border-t ${line} ${className}`}>
      {items.map(([term, desc]) => (
        <div key={term} className={`grid gap-1 border-b py-4 sm:grid-cols-[150px_1fr] sm:gap-6 ${line}`}>
          <dt className="text-[14px] text-on-ink-muted">{term}</dt>
          <dd className="text-[16px] leading-relaxed text-on-ink">{desc}</dd>
        </div>
      ))}
    </dl>
  );
}

const pass = (
  <svg viewBox="0 0 16 16" className="size-4 text-signal" fill="none" aria-hidden="true">
    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const failMark = (
  <svg viewBox="0 0 16 16" className="size-4 text-destructive" fill="none" aria-hidden="true">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/** The kernel test protocol: the daily check in three numbers, then the measured tests. */
export function Protocol({ locale, t }: { locale: Locale; t: Dict }) {
  const p = t.protocol;
  const v = statusValues(locale, t);
  const summary = [
    { n: v.passed, noun: plural(locale, status.tests.passed, t.plurals.tests), rest: fill(p.summary.tests, v) },
    { n: v.fixed, noun: plural(locale, status.cases.fixed, t.plurals.kernelErrors), rest: p.summary.fixed },
    { n: v.open, noun: plural(locale, status.cases.open, t.plurals.cases), rest: fill(p.summary.open, v) },
  ];
  return (
    <div>
      <div className={`${frame} grid md:grid-cols-3`}>
        {summary.map((s, i) => (
          <p key={i} className={`px-5 py-5 text-[15px] leading-snug text-on-ink-muted ${i < 2 ? `border-b md:border-r md:border-b-0 ${line}` : ''}`}>
            <span className="mb-2 block font-mono text-[34px] leading-none font-medium text-on-ink tabular-nums">{s.n}</span>
            <span className="text-on-ink">{s.noun}</span> {s.rest}
          </p>
        ))}
      </div>

      {/* Wide screens: the table. */}
      <table className="mt-8 hidden w-full border-collapse text-left md:table">
        <thead>
          <tr className={`border-b-2 border-on-ink/45 text-[13px] text-on-ink-muted`}>
            <th scope="col" className="py-3 pr-4 font-normal">{p.columns.test}</th>
            <th scope="col" className="py-3 pr-4 font-normal">{p.columns.result}</th>
            <th scope="col" className="py-3 pr-4 text-right font-normal">{p.columns.time}</th>
            <th scope="col" className="py-3 pr-4 text-right font-normal">{p.columns.memory}</th>
            <th scope="col" className="w-8 py-3 font-normal">
              <span className="sr-only">{p.pass}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {benchmarks.map((b) => (
            <tr key={b.id} className={`border-b align-top ${line}`}>
              <th scope="row" className="py-4 pr-6 text-[15.5px] font-medium text-on-ink">{p.rows[b.id].name}</th>
              <td className={`py-4 pr-6 text-[15px] leading-snug ${b.ok ? 'text-on-ink-muted' : 'text-on-ink'}`}>{p.rows[b.id].result}</td>
              <td className="py-4 pr-4 text-right font-mono text-[13.5px] whitespace-nowrap text-on-ink tabular-nums">{fmtTime(locale, b)}</td>
              <td className="py-4 pr-4 text-right font-mono text-[13.5px] whitespace-nowrap text-on-ink tabular-nums">{fmtMemory(locale, b.memory)}</td>
              <td className="py-4">
                {b.ok ? pass : failMark}
                <span className="sr-only">{b.ok ? p.pass : p.fail}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Phones: the same rows, one under another. */}
      <ul className={`mt-6 border-t md:hidden ${line}`}>
        {benchmarks.map((b) => (
          <li key={b.id} className={`border-b py-4 ${line}`}>
            <div className="flex items-start justify-between gap-4">
              <span className="text-[15.5px] font-medium text-on-ink">{p.rows[b.id].name}</span>
              <span className="mt-1 shrink-0">
                {b.ok ? pass : failMark}
                <span className="sr-only">{b.ok ? p.pass : p.fail}</span>
              </span>
            </div>
            <p className="mt-1.5 text-[14.5px] leading-snug text-on-ink-muted">{p.rows[b.id].result}</p>
            {b.time || b.memory ? (
              <p className="mt-2 flex flex-wrap gap-x-5 font-mono text-[13px] text-on-ink tabular-nums">
                {b.time ? <span>{`${p.columns.time}: ${fmtTime(locale, b)}`}</span> : null}
                {b.memory ? <span>{`${p.columns.memory}: ${fmtMemory(locale, b.memory)}`}</span> : null}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="mt-5 max-w-3xl text-[13.5px] leading-relaxed text-on-ink-muted">{fill(p.note, v)}</p>
    </div>
  );
}

/** The development log as a drawing's revision table: date, version, what changed. */
export function Revisions({ t }: { t: Dict }) {
  const p = t.progress;
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b-2 border-on-ink/45 text-[13px] text-on-ink-muted">
          <th scope="col" className="py-3 pr-4 font-normal">{p.columns.date}</th>
          <th scope="col" className="hidden py-3 pr-4 font-normal sm:table-cell">{p.columns.rev}</th>
          <th scope="col" className="py-3 font-normal">{p.columns.what}</th>
        </tr>
      </thead>
      <tbody>
        {p.rows.map((r) => (
          <tr key={r.date} className={`border-b align-top ${line}`}>
            <th scope="row" className="py-3.5 pr-4 font-mono text-[13px] font-normal whitespace-nowrap text-on-ink">
              {r.date}
              <span className="mt-1 block text-on-ink-muted sm:hidden">{r.rev === '—' ? '' : r.rev}</span>
            </th>
            <td className="hidden py-3.5 pr-4 font-mono text-[13px] text-on-ink-muted sm:table-cell">{r.rev}</td>
            <td className="py-3.5 text-[15px] leading-snug text-on-ink">{r.text}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
