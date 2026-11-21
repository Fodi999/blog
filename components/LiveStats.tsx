'use client';

import { useEffect, useSyncExternalStore } from 'react';

/* The site's live counters for everyone to see: who is on the site now and how many files were downloaded.
   One heartbeat per open page (Header mounts <Presence/>): a random id made in this page's memory — not a cookie,
   nothing kept on the device, no IP — said to /api/presence every 45 s while the tab is visible. */

type Stats = { online: number | null; downloads: number | null };
let stats: Stats = { online: null, downloads: null };
const subs = new Set<() => void>();
const set = (s: Stats) => {
  stats = s;
  subs.forEach((f) => f());
};
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};

/** A download was started on this page: the counter moves at once (the server counts it too). */
export function countDownload() {
  if (stats.downloads != null) set({ ...stats, downloads: stats.downloads + 1 });
}

let pageId: string | null = null;

export function Presence() {
  useEffect(() => {
    if (!pageId) pageId = crypto.randomUUID();
    let stop = false;
    const beat = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const r = await fetch('/api/presence', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: pageId }), keepalive: true });
        if (r.ok && !stop) set((await r.json()) as Stats);
      } catch {
        // offline: the counters stay as they were
      }
    };
    beat();
    const t = setInterval(beat, 45_000);
    document.addEventListener('visibilitychange', beat);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener('visibilitychange', beat);
    };
  }, []);
  return null;
}

type Labels = { online: string; downloads: string };

/** «● 3 on the site now · 1 204 downloads» — nothing until the first answer, nothing without the database. */
export function LiveStats({ locale, t, compact = false, className = '' }: { locale: string; t: Labels; compact?: boolean; className?: string }) {
  const s = useSyncExternalStore(subscribe, () => stats, () => stats);
  if (s.online == null && s.downloads == null) return null;
  const nf = new Intl.NumberFormat(locale);
  return (
    <p className={`flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12.5px] text-on-ink-muted ${className}`} aria-live="polite">
      {s.online != null ? (
        <span className="inline-flex items-center gap-2" title={t.online}>
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-signal" />
          </span>
          <span className="text-on-ink tabular-nums">{nf.format(Math.max(1, s.online))}</span>
          {compact ? null : <span>{t.online}</span>}
        </span>
      ) : null}
      {s.downloads != null ? (
        <span className="inline-flex items-center gap-1.5" title={t.downloads}>
          <span aria-hidden="true">↓</span>
          <span className="text-on-ink tabular-nums">{nf.format(s.downloads)}</span>
          {compact ? null : <span>{t.downloads}</span>}
        </span>
      ) : null}
    </p>
  );
}
