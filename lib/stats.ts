import { getEnv } from '@/lib/cf';

/* The public counters of the site: downloads of the library's files (D1 `downloads`: a number per file, nothing about
   the visitor) and who is on the site now (D1 `presence`: a random number per open page, seen in the last minute).
   Without the database every counter is null and nothing is shown. */

export const ONLINE_WINDOW = 75; // seconds: a page says it is open every 45 s while it is visible

export type SiteStats = { online: number | null; downloads: number | null };

export async function siteStats(): Promise<SiteStats> {
  const { DB } = await getEnv();
  if (!DB) return { online: null, downloads: null };
  try {
    const now = Math.floor(Date.now() / 1000);
    const [o, d] = await Promise.all([
      DB.prepare('SELECT COUNT(*) AS n FROM presence WHERE seen > ?').bind(now - ONLINE_WINDOW).first<{ n: number }>(),
      DB.prepare('SELECT COALESCE(SUM(count), 0) AS n FROM downloads').first<{ n: number }>(),
    ]);
    return { online: o?.n ?? 0, downloads: d?.n ?? 0 };
  } catch (error) {
    console.warn('[stats] unavailable', error);
    return { online: null, downloads: null };
  }
}

/* The downloads of every library file in one query, kept a minute per worker: the pages read their counts from it
   instead of asking D1 each. */
let counts: { at: number; byKey: Map<string, number> } | null = null;
async function allCounts(): Promise<Map<string, number> | null> {
  if (counts && Date.now() - counts.at < 60_000) return counts.byKey;
  const { DB } = await getEnv();
  if (!DB) return null;
  try {
    const { results } = await DB.prepare("SELECT key, count FROM downloads WHERE key LIKE 'downloads/%'").all<{ key: string; count: number }>();
    counts = { at: Date.now(), byKey: new Map(results.map((r) => [r.key, r.count])) };
    return counts.byKey;
  } catch {
    return counts?.byKey ?? null;
  }
}

/** Downloads by part (slug → count). */
export async function downloadsBySlug(): Promise<Record<string, number>> {
  const m = await allCounts();
  const out: Record<string, number> = {};
  for (const [k, n] of m ?? []) {
    const slug = k.split('/')[1];
    out[slug] = (out[slug] ?? 0) + n;
  }
  return out;
}

/** Downloads of one size (all its options and files). */
export async function downloadsOfPage(slug: string, page: string): Promise<number | null> {
  const m = await allCounts();
  if (!m) return null;
  const prefix = `downloads/${slug}/${page}/`;
  let n = 0;
  for (const [k, c] of m) if (k.startsWith(prefix)) n += c;
  return n;
}
