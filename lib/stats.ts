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

/** Downloads by part (slug → count) and, for one part, by size (page id → count). */
export async function downloadsBySlug(): Promise<Record<string, number>> {
  const { DB } = await getEnv();
  if (!DB) return {};
  try {
    // key = downloads/<slug>/<page>/<option>/<file>
    const { results } = await DB.prepare(
      "SELECT substr(key, 11, instr(substr(key, 11), '/') - 1) AS slug, SUM(count) AS n FROM downloads WHERE key LIKE 'downloads/%' GROUP BY slug",
    ).all<{ slug: string; n: number }>();
    return Object.fromEntries(results.map((r) => [r.slug, r.n]));
  } catch {
    return {};
  }
}

export async function downloadsOfPage(slug: string, page: string): Promise<number | null> {
  const { DB } = await getEnv();
  if (!DB) return null;
  try {
    const r = await DB.prepare('SELECT COALESCE(SUM(count), 0) AS n FROM downloads WHERE key LIKE ?').bind(`downloads/${slug}/${page}/%`).first<{ n: number }>();
    return r?.n ?? 0;
  } catch {
    return null;
  }
}
