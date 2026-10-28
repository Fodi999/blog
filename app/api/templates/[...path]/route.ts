import { getEnv } from '@/lib/cf';
import { authorized, denied, FILE, PREFIX, SLUG } from '@/lib/templates';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 50 * 1024 * 1024;

/* /api/templates/<slug>         → meta.json of the template
   /api/templates/<slug>/<file>  → one file of the template
   GET reads, PUT writes; both need the Monge token. */
function target(parts: string[]): string | null {
  const [slug, file, ...rest] = parts.map(decodeURIComponent);
  if (!slug || !SLUG.test(slug) || rest.length) return null;
  if (file === undefined) return `${PREFIX}${slug}/meta.json`;
  return FILE.test(file) && !file.includes('..') ? `${PREFIX}${slug}/${file}` : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const env = await getEnv();
  if (!authorized(request, env)) return denied();
  const key = target((await params).path);
  if (!key) return Response.json({ error: 'bad_path' }, { status: 400 });
  if (!env.FILES) return Response.json({ error: 'storage_unavailable' }, { status: 503 });
  const object = await env.FILES.get(key);
  if (!object) return Response.json({ error: 'not_found' }, { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('cache-control', 'no-store');
  return new Response(object.body, { headers });
}

export async function PUT(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const env = await getEnv();
  if (!authorized(request, env)) return denied();
  const parts = (await params).path;
  const key = target(parts);
  if (!key) return Response.json({ error: 'bad_path' }, { status: 400 });
  if (!env.FILES) return Response.json({ error: 'storage_unavailable' }, { status: 503 });
  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_BYTES) return Response.json({ error: 'too_large' }, { status: 413 });

  if (key.endsWith('/meta.json')) {
    // the template's card: keep it valid JSON and stamp it
    let meta: Record<string, unknown>;
    try {
      meta = JSON.parse(new TextDecoder().decode(body)) as Record<string, unknown>;
    } catch {
      return Response.json({ error: 'bad_json' }, { status: 400 });
    }
    meta.slug = decodeURIComponent(parts[0]);
    meta.updated = new Date().toISOString();
    await env.FILES.put(key, JSON.stringify(meta, null, 2), { httpMetadata: { contentType: 'application/json' } });
    return Response.json({ ok: true, key });
  }

  const type = key.endsWith('.rhai') || key.endsWith('.txt') ? 'text/plain; charset=utf-8' : 'application/octet-stream';
  await env.FILES.put(key, body, { httpMetadata: { contentType: type } });
  return Response.json({ ok: true, key, bytes: body.byteLength });
}
