import { getEnv } from '@/lib/cf';

/* Quick check that the Cloudflare bindings are connected: GET /api/health */
export async function GET() {
  const { DB, FILES } = await getEnv();
  let items: number | null = null;
  let leads: number | null = null;
  let error: string | undefined;
  if (DB) {
    try {
      items = (await DB.prepare('SELECT COUNT(*) AS n FROM items').first<{ n: number }>())?.n ?? 0;
      leads = (await DB.prepare('SELECT COUNT(*) AS n FROM leads').first<{ n: number }>())?.n ?? 0;
    } catch (e) {
      error = String(e);
    }
  }
  return Response.json({ d1: Boolean(DB), r2: Boolean(FILES), items, leads, error }, { headers: { 'cache-control': 'no-store' } });
}
