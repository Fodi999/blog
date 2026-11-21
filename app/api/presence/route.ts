import { getEnv } from '@/lib/cf';
import { ONLINE_WINDOW, siteStats } from '@/lib/stats';

export const dynamic = 'force-dynamic';

const ID = /^[0-9a-f-]{36}$/;

/* POST {id}: an open page says it is open (its random id, made in its memory — not a cookie, not kept on the device,
   no IP stored); the answer is the public counters: who is on the site in the last minute, downloads in all.
   GET: the counters only. */
export async function POST(request: Request) {
  const { DB } = await getEnv();
  let id = '';
  try {
    id = String(((await request.json()) as { id?: unknown }).id ?? '');
  } catch {
    // no body — just the counters
  }
  if (DB && ID.test(id)) {
    const now = Math.floor(Date.now() / 1000);
    try {
      await DB.prepare('INSERT INTO presence (id, seen) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET seen = excluded.seen').bind(id, now).run();
      // tidy now and then: pages gone for 5 minutes
      if (Math.random() < 0.1) await DB.prepare('DELETE FROM presence WHERE seen < ?').bind(now - 300).run();
    } catch (error) {
      console.warn('[presence] not stored', error);
    }
  }
  return Response.json(await siteStats(), { headers: { 'cache-control': 'no-store' } });
}

export async function GET() {
  return Response.json({ ...(await siteStats()), window: ONLINE_WINDOW }, { headers: { 'cache-control': 'no-store' } });
}
