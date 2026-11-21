'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ModelViewer, type ViewerLabels } from '@/components/ModelViewer';
import type { DlConfig, DlFormat } from '@/lib/downloads';
import type { Dict, Locale } from '@/lib/i18n';

type Props = {
  locale: Locale;
  configs: DlConfig[];
  defaultId?: string;
  title: string;
  poster: string;
  finish?: 'steel' | 'satin' | 'source';
  view?: [number, number];
  rotate?: [number, number, number];
  t: Dict['item'];
  licence: { href: string; label: string; note: string };
  viewer: ViewerLabels;
  /** The right column's text (category, title, summary, the generator's card), rendered on the server. */
  children: React.ReactNode;
};

const FORMATS: DlFormat[] = ['step', 'stl', '3mf', 'glb'];

function size(locale: Locale, bytes: number): string {
  const nf = (n: number, d: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: d }).format(n);
  return bytes >= 1e6 ? `${nf(bytes / 1048576, 1)} MB` : `${nf(Math.max(1, Math.round(bytes / 1024)), 0)} KB`;
}

const tick = (
  <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 text-signal" fill="none" aria-hidden="true">
    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** A library part with its ready configurations: pick one — the 3D view shows it and its files download. */
export function PartConfigurator({ locale, configs, defaultId, title, poster, finish, view, rotate, t, licence, viewer, children }: Props) {
  const [id, setId] = useState(defaultId && configs.some((c) => c.id === defaultId) ? defaultId : configs[0].id);
  const c = configs.find((x) => x.id === id) ?? configs[0];
  const d = t.dl;
  const nf = (n: number, digits = 1) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n);
  const mass = c.massKg >= 1 ? `${nf(c.massKg, 2)} kg` : `${nf(c.massKg * 1000, c.massKg < 0.01 ? 2 : 1)} g`;

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="animate-reveal lg:sticky lg:top-24 lg:self-start">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-hairline-ink-strong bg-[radial-gradient(ellipse_at_50%_55%,rgba(92,210,255,.10),transparent_65%)] bg-ink-2">
          <div className="blueprint absolute inset-0 opacity-70" aria-hidden="true" />
          <ModelViewer
            key={c.id}
            src={`/api/files/${c.files.glb.key}`}
            poster={poster}
            alt={`${title} — ${c.name[locale]}`}
            finish={finish}
            view={view}
            rotate={rotate}
            labels={viewer}
            loadingLabel={t.loading}
            fallbackLabel={t.noWebgl}
            className="absolute inset-0"
          />
          <span className="pointer-events-none absolute top-3 left-3 rounded-full border border-hairline-ink-strong bg-ink/75 px-3 py-1 font-mono text-[12px] text-on-ink backdrop-blur-sm">{c.name[locale]}</span>
        </div>
        <p className="mt-3 text-center font-mono text-[11.5px] text-on-ink-muted">{t.viewerHint}</p>
      </div>

      <div className="animate-reveal [animation-delay:120ms]">
        {children}

        <section aria-labelledby="dl-title" className="mt-8 rounded-xl border border-signal/35 bg-ink-2 p-5 shadow-[0_20px_60px_-30px_rgba(196,255,77,.35)]">
          <h2 id="dl-title" className="font-display text-[22px] font-semibold text-on-ink">
            {d.title}
          </h2>
          <label htmlFor="dl-config" className="mt-4 block text-[13px] text-on-ink-muted">
            {d.config} <span className="font-mono text-[12px]">({configs.length})</span>
          </label>
          <select
            id="dl-config"
            value={c.id}
            onChange={(e) => setId(e.target.value)}
            className="mt-1.5 w-full cursor-pointer rounded-lg border border-hairline-ink-strong bg-ink px-3 py-2.5 font-mono text-[14px] text-on-ink outline-none focus:border-signal"
          >
            {configs.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name[locale]}
              </option>
            ))}
          </select>

          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline-ink bg-hairline-ink text-[13px]">
            <div className="bg-ink px-3 py-2">
              <dt className="text-on-ink-muted">{d.size}</dt>
              <dd className="mt-0.5 font-mono text-on-ink">{c.sizeMm.map((v) => nf(v, 1)).join(' × ')} mm</dd>
            </div>
            <div className="bg-ink px-3 py-2">
              <dt className="text-on-ink-muted">{d.mass}</dt>
              <dd className="mt-0.5 font-mono text-on-ink">≈ {mass}</dd>
            </div>
          </dl>

          <ul className="mt-4 grid gap-1.5 text-[13px] text-on-ink-muted">
            {c.checks.kernel ? <li className="flex items-center gap-2">{tick}{d.checks.kernel}</li> : null}
            {c.checks.step ? <li className="flex items-center gap-2">{tick}{d.checks.step}</li> : null}
            {c.checks.stl ? <li className="flex items-center gap-2">{tick}{d.checks.stl}</li> : null}
          </ul>

          <ul className="mt-5 grid gap-2">
            {FORMATS.map((f) => {
              const file = c.files[f];
              return (
                <li key={f}>
                  <a
                    href={`/api/files/${file.key}?download=1`}
                    download
                    className="group flex items-center justify-between gap-3 rounded-lg border border-hairline-ink-strong px-3.5 py-2.5 transition-colors hover:border-signal hover:bg-signal/[.06]"
                    data-ga-event="file_download"
                    data-ga-item-id={file.key.split('/')[1]}
                    data-ga-label={`${f}:${c.id}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-12 rounded-md bg-on-ink/10 py-0.5 text-center font-mono text-[11.5px] font-medium text-on-ink uppercase">{f}</span>
                      <span className="text-[13.5px] text-on-ink-muted group-hover:text-on-ink">{d.formats[f]}</span>
                    </span>
                    <span className="flex items-center gap-2 font-mono text-[12px] text-on-ink-muted">
                      {size(locale, file.bytes)}
                      <span className="text-[15px] text-on-ink group-hover:text-signal" aria-hidden="true">
                        ↓
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-[12.5px] leading-relaxed text-on-ink-muted">
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
