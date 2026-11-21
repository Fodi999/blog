'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { countDownload } from '@/components/LiveStats';
import { ModelViewer, type ViewerLabels } from '@/components/ModelViewer';
import { fileKey, FORMATS, text, type DlPage } from '@/lib/downloads';
import { fill, type Dict, type Locale } from '@/lib/i18n';

type Props = {
  locale: Locale;
  slug: string;
  pages: DlPage[];
  /** The page (size) it opens on, and on the size's own page: go to another size's address when one is picked. */
  pageId?: string;
  navigate?: boolean;
  title: string;
  poster: string;
  finish?: 'steel' | 'satin' | 'source';
  view?: [number, number];
  rotate?: [number, number, number];
  t: Dict['item'];
  licence: { href: string; label: string; note: string };
  viewer: ViewerLabels;
  /** The right column's text above the panel, rendered on the server. */
  children: React.ReactNode;
};

function size(locale: Locale, bytes: number): string {
  const nf = (n: number, d: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: d }).format(n);
  return bytes >= 1e6 ? `${nf(bytes / 1048576, 1)} MB` : `${nf(Math.max(1, Math.round(bytes / 1024)), 0)} KB`;
}

const tick = (
  <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 text-signal" fill="none" aria-hidden="true">
    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const selectCls = 'mt-1.5 w-full cursor-pointer rounded-lg border border-hairline-ink-strong bg-ink px-3 py-2.5 font-mono text-[14px] text-on-ink outline-none focus:border-signal';

/** A library part by size: pick the size, its variant and the option — the 3D view shows it and its four files download. */
export function PartConfigurator({ locale, slug, pages, pageId, navigate = false, title, poster, finish, view, rotate, t, licence, viewer, children }: Props) {
  const router = useRouter();
  const [pid, setPid] = useState(pageId && pages.some((p) => p.id === pageId) ? pageId : pages[0].id);
  const page = pages.find((p) => p.id === pid) ?? pages[0];
  // opens on the real thread (the print option is chosen on purpose), else the last option
  const first = (p: DlPage) => (p.options.find((o) => o.id === 'exact') ?? p.options.filter((o) => o.id !== 'print').pop() ?? p.options[0]).id;
  const [oid, setOid] = useState(first(page));
  const opt = page.options.find((o) => o.id === oid) ?? page.options[0];
  const d = t.dl;
  const nf = (n: number, digits = 1) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n);
  const mass = opt.massKg >= 1 ? `${nf(opt.massKg, 2)} kg` : `${nf(opt.massKg * 1000, opt.massKg < 0.01 ? 2 : 1)} g`;

  const groupOf = (p: DlPage) => text(p.group, locale);
  const groups = Array.from(new Set(pages.map(groupOf)));
  const group = groupOf(page);
  const inGroup = pages.filter((p) => groupOf(p) === group);

  const pick = (next: DlPage) => {
    // keep the option when the new size has it (the thread stays real when the length changes)
    if (!next.options.some((o) => o.id === oid)) setOid(first(next));
    if (navigate) router.push(`/${locale}/library/${slug}/${next.id}`, { scroll: false });
    else setPid(next.id);
  };

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="animate-reveal lg:sticky lg:top-24 lg:self-start">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-hairline-ink-strong bg-[radial-gradient(ellipse_at_50%_55%,rgba(92,210,255,.10),transparent_65%)] bg-ink-2">
          <div className="blueprint absolute inset-0 opacity-70" aria-hidden="true" />
          <ModelViewer
            key={`${page.id}/${opt.id}`}
            src={`/api/files/${fileKey(slug, page.id, opt.id, 'glb')}`}
            poster={poster}
            alt={`${title} — ${text(page.label, locale)}`}
            finish={finish}
            view={view}
            rotate={rotate}
            labels={viewer}
            loadingLabel={t.loading}
            fallbackLabel={t.noWebgl}
            className="absolute inset-0"
          />
          <span className="pointer-events-none absolute top-3 left-3 rounded-full border border-hairline-ink-strong bg-ink/75 px-3 py-1 font-mono text-[12px] text-on-ink backdrop-blur-sm">
            {text(page.label, locale)}
            {page.options.length > 1 ? ` · ${opt.label[locale]}` : ''}
          </span>
        </div>
        <p className="mt-3 text-center font-mono text-[11.5px] text-on-ink-muted">{t.viewerHint}</p>
      </div>

      <div className="animate-reveal [animation-delay:120ms]">
        {children}

        <section aria-labelledby="dl-title" className="mt-8 rounded-xl border border-signal/35 bg-ink-2 p-5 shadow-[0_20px_60px_-30px_rgba(196,255,77,.35)]">
          <h2 id="dl-title" className="font-display text-[22px] font-semibold text-on-ink">
            {d.title}
          </h2>

          <div className={`mt-4 grid gap-3 ${groups.length > 1 && inGroup.length > 1 ? 'sm:grid-cols-2' : ''}`}>
            {groups.length > 1 ? (
              <label className="block text-[13px] text-on-ink-muted">
                {d.size_} <span className="font-mono text-[12px]">({groups.length})</span>
                <select value={group} onChange={(e) => pick(pages.find((p) => groupOf(p) === e.target.value)!)} className={selectCls}>
                  {groups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {inGroup.length > 1 ? (
              <label className="block text-[13px] text-on-ink-muted">
                {d.variant} <span className="font-mono text-[12px]">({inGroup.length})</span>
                <select value={page.id} onChange={(e) => pick(pages.find((p) => p.id === e.target.value)!)} className={selectCls}>
                  {inGroup.map((p) => (
                    <option key={p.id} value={p.id}>
                      {text(p.label, locale)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          {page.options.length > 1 ? (
            <fieldset className="mt-3">
              <legend className="text-[13px] text-on-ink-muted">{d.option}</legend>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {page.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={o.id === opt.id}
                    onClick={() => setOid(o.id)}
                    className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${o.id === opt.id ? 'border-signal bg-signal/10 text-signal' : 'border-hairline-ink-strong text-on-ink-muted hover:text-on-ink'}`}
                  >
                    {o.label[locale]}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline-ink bg-hairline-ink text-[13px]">
            <div className="bg-ink px-3 py-2">
              <dt className="text-on-ink-muted">{d.size}</dt>
              <dd className="mt-0.5 font-mono text-on-ink">{opt.sizeMm.map((v) => nf(v, 1)).join(' × ')} mm</dd>
            </div>
            <div className="bg-ink px-3 py-2">
              <dt className="text-on-ink-muted">{d.mass}</dt>
              <dd className="mt-0.5 font-mono text-on-ink">≈ {mass}</dd>
            </div>
          </dl>

          <ul className="mt-4 grid gap-1.5 text-[13px] text-on-ink-muted">
            {opt.checks[0] ? <li className="flex items-center gap-2">{tick}{d.checks.kernel}</li> : null}
            {opt.checks[1] ? <li className="flex items-center gap-2">{tick}{d.checks.step}</li> : null}
            {opt.checks[2] ? <li className="flex items-center gap-2">{tick}{d.checks.stl}</li> : null}
          </ul>

          {opt.print ? (
            <div className={`mt-4 rounded-lg border p-3 text-[13px] leading-snug ${opt.print.ok && opt.print.wall >= 0.8 ? 'border-signal/40 bg-signal/[.05]' : 'border-hairline-ink-strong bg-ink'}`}>
              <p className="font-medium text-on-ink">
                {d.print.title}: {d.print.lies[opt.print.up as '-y' | 'y'] ?? ''}
              </p>
              <ul className="mt-1.5 grid gap-1 text-on-ink-muted">
                <li className="flex items-start gap-2">
                  {opt.print.ok ? tick : <span className="mt-1 size-2 shrink-0 rounded-full bg-[#ffb648]" aria-hidden="true" />}
                  {opt.print.ok ? d.print.ok : fill(d.print.needs, { reach: nf(opt.print.reach, 1) })}
                </li>
                <li className="flex items-start gap-2">
                  {opt.print.wall >= 0.8 ? tick : <span className="mt-1 size-2 shrink-0 rounded-full bg-[#ffb648]" aria-hidden="true" />}
                  {opt.print.wall >= 0.8 ? fill(d.print.wall, { wall: nf(opt.print.wall, 2) }) : fill(d.print.thin, { wall: nf(opt.print.wall, 2) })}
                </li>
                <li className="pl-5 font-mono text-[12.5px] text-on-ink">{fill(d.print.pla, { pla: nf(opt.print.pla, 1) })}</li>
              </ul>
              <p className="mt-2 text-[12px] text-on-ink-muted">
                {d.print.clearance} {d.print.profile}
              </p>
            </div>
          ) : null}

          <ul className="mt-5 grid gap-2">
            {FORMATS.map((f, i) => opt.bytes[i] == null ? null : (
              <li key={f}>
                <a
                  href={`/api/files/${fileKey(slug, page.id, opt.id, f)}?download=1`}
                  download
                  onClick={countDownload}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-hairline-ink-strong px-3.5 py-2.5 transition-colors hover:border-signal hover:bg-signal/[.06]"
                  data-ga-event="file_download"
                  data-ga-item-id={slug}
                  data-ga-label={`${f}:${page.id}:${opt.id}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-12 rounded-md bg-on-ink/10 py-0.5 text-center font-mono text-[11.5px] font-medium text-on-ink uppercase">{f}</span>
                    <span className="text-[13.5px] text-on-ink-muted group-hover:text-on-ink">{d.formats[f]}</span>
                  </span>
                  <span className="flex items-center gap-2 font-mono text-[12px] text-on-ink-muted">
                    {size(locale, opt.bytes[i] ?? 0)}
                    <span className="text-[15px] text-on-ink group-hover:text-signal" aria-hidden="true">
                      ↓
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {!navigate ? (
            <Link href={`/${locale}/library/${slug}/${page.id}`} className="mt-4 inline-flex text-[13.5px] text-on-ink underline underline-offset-2 hover:text-signal">
              {d.sizePage} {text(page.label, locale)} →
            </Link>
          ) : null}
          <p className="mt-3 text-[12.5px] leading-relaxed text-on-ink-muted">
            {d.axes} {licence.note}{' '}
            <Link href={licence.href} className="text-on-ink underline underline-offset-2 hover:text-signal">
              {licence.label}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
