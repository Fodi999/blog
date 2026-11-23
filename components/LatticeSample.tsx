'use client';

import { useState } from 'react';
import { ModelViewer } from '@/components/ModelViewer';
import type { Dict, Locale } from '@/lib/i18n';
import type { Sample } from '@/lib/lattices';
import { fileUrl } from '@/lib/textures';

type T = Dict['latticesPage'];

/* The sample cube of the chosen kind: REAL geometry built by Monge (data/lattice-samples.json), not the demo passport —
   a 3D view of its GLB, the numbers Monge measured and its files with SHA-256. */
export function LatticeSample({ sample, name, locale, t }: { sample: Sample | undefined; name: string; locale: Locale; t: T }) {
  const s = t.sample;
  // the 3D view loads only when asked: a sample's GLB is 1–10 MB (the render stands in until then)
  const [shown, setShown] = useState<string | null>(null);
  if (!sample) return <p className="text-[14px] text-on-ink-muted">{s.none}</p>;
  const n = (v: number, d = 1) => v.toLocaleString(locale, { maximumFractionDigits: d });
  const size = (b: number) => (b >= 1e6 ? `${n(b / 1e6, 1)} ${t.units.mb}` : `${n(b / 1e3, 0)} ${t.units.kb}`);
  const glb = sample.files.find((f) => f.format === 'glb');
  const facts: [string, string][] = [
    [s.cube, `${n(sample.cube_mm, 0)} × ${n(sample.cube_mm, 0)} × ${n(sample.cube_mm, 0)} ${t.units.mm}`],
    [s.cell, `${n(sample.cell_mm, 2)} ${t.units.mm}`],
    [s.wall, `${n(sample.wall_mm, 2)} ${t.units.mm}`],
    [s.share, `${n(sample.share * 100, 0)} %`],
    [s.volume, `${n(sample.volume_cm3, 1)} ${t.units.cm3}`],
    [s.triangles, n(sample.triangles, 0)],
    [s.pieces, n(sample.pieces, 0)],
  ];
  return (
    <section aria-label={s.title} className="rounded-xl border border-signal/30 bg-ink-2/60 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-[22px] font-semibold text-on-ink">{s.title}</h3>
        <span className="rounded-full border border-signal/50 px-2.5 py-0.5 font-mono text-[11.5px] text-signal">{s.badge}</span>
      </div>
      <p className="mt-1.5 max-w-[70ch] text-[13.5px] leading-relaxed text-on-ink-muted">{s.lead}</p>
      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-hairline-ink-strong bg-[radial-gradient(ellipse_at_50%_40%,#2a3038,#0b0e12_70%)]">
          {glb && shown === glb.key ? (
            <ModelViewer key={glb.key} src={fileUrl(glb.key)} poster={fileUrl(sample.render)} alt={`${name} — ${s.title}`} loadingLabel={s.loading} fallbackLabel={s.fallback} className="absolute inset-0" />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- the sample's render from R2, as the viewer's own poster */}
              <img src={fileUrl(sample.render)} alt={`${name} — ${s.title}`} loading="lazy" decoding="async" className="absolute inset-0 size-full object-contain" />
              {glb ? (
                <button
                  type="button"
                  onClick={() => setShown(glb.key)}
                  className="absolute right-3 bottom-3 rounded-lg border border-signal/60 bg-ink/85 px-3 py-1.5 text-[13px] font-semibold text-signal hover:bg-signal/10"
                >
                  {s.show3d.replace('{size}', size(glb.bytes))}
                </button>
              ) : null}
            </>
          )}
        </div>
        <div>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline-ink-strong bg-hairline-ink-strong">
            {facts.map(([k, v]) => (
              <div key={k} className="bg-ink/90 px-3 py-2.5">
                <dt className="text-[12px] text-on-ink-muted">{k}</dt>
                <dd className="mt-0.5 font-mono text-[13.5px] text-on-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <ul className="mt-4 grid gap-2">
            {sample.files.map((f) => (
              <li key={f.key} className="rounded-lg border border-hairline-ink-strong px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[13px] text-on-ink">
                    {f.format.toUpperCase()} · {size(f.bytes)}
                  </span>
                  <a href={fileUrl(f.key, true)} download className="text-[13px] font-semibold text-signal hover:underline">
                    {s.download} {f.format.toUpperCase()}
                  </a>
                </div>
                <p className="mt-1 font-mono text-[10.5px] break-all text-on-ink-muted">
                  {s.sha} {f.sha256}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] leading-relaxed text-on-ink-muted">{s.note}</p>
        </div>
      </div>
    </section>
  );
}
