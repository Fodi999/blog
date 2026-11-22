'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n';

type Hit = { id: string; name: string; url: string; image: { url: string }; files: { format: string; download_url: string; bytes: number }[]; differs?: string[]; verification: { geometry: { kernel_body_report: boolean } } };
type Answer = { match: 'exact' | 'not_found' | 'browse'; total: number; results: Hit[]; notes: string[] };
type Labels = { placeholder: string; examples: string[]; found: string; none: string; nearest: string; label: string };

/** The library's search: asks the catalogue API (the browser never loads the library), shows the geometries that
    have everything asked or — none — says so and lists the nearest with what differs. */
export function LibrarySearch({ locale, t }: { locale: Locale; t: Labels }) {
  const [q, setQ] = useState('');
  const [a, setA] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const s = q.trim();
    if (s.length < 2) {
      setA(null);
      return;
    }
    const n = ++seq.current;
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetch(`/api/v1/models?q=${encodeURIComponent(s)}&locale=${locale}&limit=12`);
        const j = (await r.json()) as Answer;
        if (n === seq.current) setA(r.ok ? j : null);
      } catch {
        if (n === seq.current) setA(null);
      } finally {
        if (n === seq.current) setBusy(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [q, locale]);

  const nf = (b: number) => (b >= 1e6 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

  return (
    <div className="mb-10">
      <label htmlFor="lib-search" className="sr-only">
        {t.label}
      </label>
      <div className="relative">
        <input
          id="lib-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-hairline-ink-strong bg-ink-2 px-5 py-4 font-mono text-[15px] text-on-ink outline-none placeholder:text-on-ink-muted focus:border-signal"
        />
        {busy ? <span className="absolute top-1/2 right-4 size-2 -translate-y-1/2 animate-ping rounded-full bg-signal" aria-hidden="true" /> : null}
      </div>
      <p className="mt-2 flex flex-wrap gap-2 text-[12.5px] text-on-ink-muted">
        {t.examples.map((x) => (
          <button key={x} type="button" onClick={() => setQ(x)} className="rounded-full border border-hairline-ink px-2.5 py-0.5 font-mono hover:border-signal hover:text-on-ink">
            {x}
          </button>
        ))}
      </p>
      {a && a.match !== 'browse' ? (
        <div className="mt-4 rounded-xl border border-hairline-ink-strong bg-ink-2/70 p-4" aria-live="polite">
          <p className={`text-[14px] ${a.match === 'exact' ? 'text-signal' : 'text-[#ffb648]'}`}>
            {a.match === 'exact' ? `${t.found}: ${a.total}` : a.results.length ? t.nearest : t.none}
          </p>
          <ul className="mt-3 grid gap-2">
            {a.results.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-hairline-ink bg-ink px-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.image.url} alt="" width={64} height={48} loading="lazy" className="h-12 w-16 object-contain" />
                <Link href={h.url.replace(/^https?:\/\/[^/]+/, '')} className="min-w-[200px] flex-1 text-[14.5px] text-on-ink hover:text-signal">
                  {h.name}
                  {h.differs ? <span className="block text-[12px] text-[#ffb648]">≠ {h.differs.join('; ')}</span> : null}
                </Link>
                <span className="flex flex-wrap gap-1.5">
                  {h.files.map((f) => (
                    <a key={f.format} href={f.download_url} download className="rounded-md border border-hairline-ink-strong px-2 py-0.5 font-mono text-[11.5px] text-on-ink-muted uppercase hover:border-signal hover:text-on-ink" title={nf(f.bytes)}>
                      {f.format}
                    </a>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
