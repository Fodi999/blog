import { getItems } from '@/lib/library';

/* The catalogue as JSON — read by the Monge app's library panel. */
export async function GET() {
  const items = await getItems();
  return Response.json(
    { version: 1, items },
    { headers: { 'cache-control': 'public, max-age=300, stale-while-revalidate=3600', 'access-control-allow-origin': '*' } },
  );
}
