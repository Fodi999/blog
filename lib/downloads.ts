import { getEnv } from '@/lib/cf';
import { CATALOG } from '@/lib/catalog-version';
import type { Locale } from '@/lib/i18n';

/* The library as downloadable files (R2, under downloads/). One PAGE per size — its own address
   /library/<slug>/<page> — and on it the OPTIONS that change the geometry (thread cosmetic / real, a bearing's
   seals and balls), each with STEP, STL, 3MF and GLB. Written by scripts/downloads-json.py from the export of the
   Monge test window (scripts/monge): every geometry placed by the program, its body checked by the kernel, its STEP
   read back and compared, its STL checked closed; only what passed is here. */

export type DlFormat = 'step' | 'stl' | '3mf' | 'glb';
export const FORMATS: DlFormat[] = ['step', 'stl', '3mf', 'glb'];

type Text = string | Record<Locale, string>;

export type DlOption = {
  id: string;
  label: Record<Locale, string>;
  /** File sizes in FORMATS order; null — no such file (the print option has no STEP). */
  bytes: (number | null)[];
  /** Overall size as printed (Z up), mm, largest first. */
  sizeMm: number[];
  /** Steel 7850 kg/m³ × the mesh volume. */
  massKg: number;
  bodies: number;
  /** The kernel's report of every body; STEP read back and the same; the STL closed (one body). */
  checks: [boolean, boolean, boolean];
  /** The 3D-printing option: Monge's print check for FDM (nozzle 0.4, layer 0.2, overhangs to 45° / 3 mm) in the way
      it lies on the bed (up "-y" — head down, "y" — as it stands); the least wall, the longest overhang, PLA grams. */
  print?: { ok: boolean; up: string; wall: number; reach: number; overMm2: number; pla: number };
};

export type DlPage = {
  id: string;
  group: Text;
  label: Text;
  /** The standard whose row this size is, and the row's key (size, name or diameter). */
  std?: string | null;
  row?: string | null;
  /** Size in bytes of the render of this size's own geometry (downloads/<slug>/<page>/<slug>-<page>.webp); none — only the family's image. */
  image?: number;
  options: DlOption[];
};

type Family = { checked: string; version: string; pages: DlPage[] };

/* The data lives in R2, content-addressed: catalog/downloads-<sha12>.json, put there by `npm run catalog:upload`
   before every deploy (lib/catalog-version.ts names it — a deploy reads exactly the catalogue it was built with, a
   rollback finds its own). It is read once per worker and checked against its SHA-256. Where it comes from, in
   turn: memory → R2 (three tries) → the copy this Cloudflare location keeps in its cache → the repository's file
   (the build, plain `next dev`). Nothing at all — `CatalogUnavailable`: pages answer an error (never an empty
   catalogue that would turn every size into a 404 and be cached), the API answers 503. */
export const CATALOG_KEY = CATALOG.key;

export class CatalogUnavailable extends Error {
  constructor(why: string) {
    super(`catalogue ${CATALOG.version} unavailable: ${why}`);
  }
}

let all: Record<string, Family> = {};
let loaded: { source: 'r2' | 'edge-cache' | 'file'; at: string; ms: number } | null = null;
let failedAt = 0;
/** Bumped on every load: what is built from the data (lib/catalog) is rebuilt when it changes. */
export let generation = 0;

const EDGE_KEY = `https://catalog.monge.invalid/${CATALOG.sha256}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** A read that does not answer in `ms` counts as failed (a hung remote binding in a build must not hang the build). */
export function within<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${what}: no answer in ${ms} ms`)), ms))]);
}

async function sha256(buf: ArrayBuffer): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('');
}

type Edge = { match(k: string): Promise<Response | undefined>; put(k: string, r: Response): Promise<void> };
const edge = (): Edge | null => ((globalThis as { caches?: { default?: Edge } }).caches?.default ?? null);

async function fromR2(): Promise<ArrayBuffer | null> {
  const { FILES } = await getEnv();
  if (!FILES) return null;
  const key = process.env.MONGE_CATALOG_KEY ?? CATALOG.key;
  for (const wait of [0, 150, 400]) {
    if (wait) await sleep(wait);
    try {
      const o = await within(FILES.get(key), 5_000, 'R2 get');
      if (o) return await within(new Response(o.body).arrayBuffer(), 10_000, 'R2 body');
      return null; // not there: trying again will not put it there
    } catch (error) {
      console.warn('[catalogue] R2 read failed', error);
    }
  }
  return null;
}

async function fromEdge(): Promise<ArrayBuffer | null> {
  try {
    const r = await edge()?.match(EDGE_KEY);
    return r ? await r.arrayBuffer() : null;
  } catch {
    return null;
  }
}

async function fromFile(): Promise<ArrayBuffer | null> {
  try {
    // the repository's file (the build, plain next dev); the path is put together so the bundler leaves it out
    const fs = await import('node:fs/promises');
    const file = process.env.MONGE_CATALOG_FILE ?? [process.cwd(), 'data', 'downloads.json'].join('/');
    const b = await fs.readFile(file);
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

/** Every entry point calls this before it reads the catalogue (pages, API, files, sitemap).
    Only the loaded catalogue is shared between requests — never a load in progress: on Workers a promise belongs
    to the request that made it, and when that request ends (or is cut off for its CPU time) the promise never
    settles, so every later request waiting on it would fail until the instance is gone. Two requests that meet an
    empty instance at once each load it. */
export async function ensureDownloads(): Promise<void> {
  if (loaded) return;
  if (failedAt && Date.now() - failedAt < 5_000) throw new CatalogUnavailable('failed moments ago');
  const t0 = Date.now();
  const tried: string[] = [];
  for (const [source, get] of [['r2', fromR2], ['edge-cache', fromEdge], ['file', fromFile]] as const) {
    const buf = await get();
    if (loaded) return; // another request finished first
    if (!buf) {
      tried.push(`${source}: none`);
      continue;
    }
    const sum = await sha256(buf);
    if (sum !== CATALOG.sha256) {
      tried.push(`${source}: sha256 ${sum.slice(0, 12)} ≠ ${CATALOG.sha256.slice(0, 12)}`);
      continue;
    }
    if (loaded) return;
    all = JSON.parse(new TextDecoder().decode(buf)) as Record<string, Family>;
    generation++;
    loaded = { source, at: new Date().toISOString(), ms: Date.now() - t0 };
    failedAt = 0;
    if (source === 'r2') {
      // keep a copy at this location for the day R2 does not answer
      try {
        await edge()?.put(EDGE_KEY, new Response(buf, { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=31536000, immutable' } }));
      } catch {
        // no cache here (next dev): fine
      }
    }
    return;
  }
  failedAt = Date.now();
  throw new CatalogUnavailable(tried.join('; '));
}

/** What the worker serves: the catalogue's version and where this worker got it from. */
export function catalogStatus() {
  return { version: CATALOG.version, sha256: CATALOG.sha256, bytes: CATALOG.bytes, key: CATALOG.key, monge: CATALOG.monge, models: CATALOG.models, sizes: CATALOG.sizes, loaded };
}

export function downloadsOf(slug: string) {
  return all[slug];
}

export function pageOf(slug: string, id: string): DlPage | undefined {
  return all[slug]?.pages.find((p) => p.id === id);
}

export function allPages(): { slug: string; page: DlPage }[] {
  return Object.entries(all).flatMap(([slug, v]) => v.pages.map((page) => ({ slug, page })));
}

/** The pages as the browser's configurator needs them: no parameters, facts or checksums (those are for the API). */
export function clientPages(pages: DlPage[]): DlPage[] {
  return pages.map((p) => ({
    id: p.id,
    group: p.group,
    label: p.label,
    ...(p.image ? { image: p.image } : {}),
    options: p.options.map((o) => ({ id: o.id, label: o.label, bytes: o.bytes, sizeMm: o.sizeMm, massKg: o.massKg, bodies: o.bodies, checks: o.checks, ...(o.print ? { print: o.print } : {}) })),
  }));
}

/** For a size's own page: that size in full, every other size only as a choice (id, group, label, its options' ids
    and names) — the browser needs no more to go to another size's address. */
export function navPages(pages: DlPage[], current: string): DlPage[] {
  return clientPages(pages).map((p) => (p.id === current ? p : ({ id: p.id, group: p.group, label: p.label, options: p.options.map((o) => ({ id: o.id, label: o.label })) } as unknown as DlPage)));
}

export function text(v: Text, locale: Locale): string {
  return typeof v === 'string' ? v : v[locale];
}

export function fileKey(slug: string, page: string, option: string, f: DlFormat): string {
  return `downloads/${slug}/${page}/${option}/${slug}-${page}-${option}.${f}`;
}

export function totals() {
  return {
    pages: Object.values(all).reduce((n, x) => n + x.pages.length, 0),
    geometries: Object.values(all).reduce((n, x) => n + x.pages.reduce((m, p) => m + p.options.length, 0), 0),
  };
}
