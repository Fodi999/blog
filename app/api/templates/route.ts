import { getEnv } from '@/lib/cf';
import { authorized, denied, PREFIX } from '@/lib/templates';

export const dynamic = 'force-dynamic';

/** GET /api/templates — every template's meta.json (Monge token required). */
export async function GET(request: Request) {
  const env = await getEnv();
  if (!authorized(request, env)) return denied();
  if (!env.FILES) return Response.json({ error: 'storage_unavailable' }, { status: 503 });

  const slugs: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.FILES.list({ prefix: PREFIX, delimiter: '/', cursor });
    slugs.push(...page.delimitedPrefixes.map((p) => p.slice(PREFIX.length).replace(/\/$/, '')));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  const templates = await Promise.all(
    slugs.map(async (slug) => {
      const meta = await env.FILES!.get(`${PREFIX}${slug}/meta.json`);
      const data = meta ? ((await new Response(meta.body).json().catch(() => ({}))) as Record<string, unknown>) : {};
      return { slug, ...data };
    }),
  );
  return Response.json({ templates }, { headers: { 'cache-control': 'no-store' } });
}
