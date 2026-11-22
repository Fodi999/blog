import { getEnv, type R2Range } from '@/lib/cf';
import { FORMATS, downloadsOf, ensureDownloads } from '@/lib/downloads';
import { getItems } from '@/lib/library';

const TYPES: Record<string, string> = {
  glb: 'model/gltf-binary',
  step: 'model/step',
  stp: 'model/step',
  stl: 'model/stl',
  '3mf': 'model/3mf',
  dxf: 'image/vnd.dxf',
  pdf: 'application/pdf',
  png: 'image/png',
  webp: 'image/webp',
  dmg: 'application/x-apple-diskimage',
};

const OPEN_CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, HEAD, OPTIONS', 'access-control-allow-headers': 'range', 'access-control-expose-headers': 'content-length, content-range, accept-ranges, etag, repr-digest' };

/** SHA-256 of a library file (from the catalogue: downloads/<slug>/<page>/<option>/<file>), base64 for Repr-Digest. */
function digest(key: string): string | null {
  const m = /^downloads\/([a-z0-9-]+)\/([a-z0-9_-]+)\/([a-z0-9-]+)\/[^/]+\.([a-z0-9]+)$/.exec(key);
  if (!m) return null;
  const page = downloadsOf(m[1])?.pages.find((p) => p.id === m[2]);
  const opt = page?.options.find((o) => o.id === m[3]) as { sha?: (string | null)[] } | undefined;
  const hex = opt?.sha?.[FORMATS.indexOf(m[4] as (typeof FORMATS)[number])];
  if (!hex) return null;
  const bytes = hex.match(/../g)!.map((h) => parseInt(h, 16));
  return btoa(String.fromCharCode(...bytes));
}

/** «bytes=0-99», «bytes=100-», «bytes=-500» → an R2 range; anything else (several ranges, garbage) → none. */
function rangeOf(h: string | null, size: number): { r: R2Range; start: number; end: number } | 'bad' | null {
  if (!h) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(h.trim());
  if (!m || (!m[1] && !m[2])) return null;
  let start: number, end: number;
  if (!m[1]) {
    const n = Math.min(Number(m[2]), size);
    start = size - n;
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  }
  if (start >= size || end < start) return 'bad';
  return { r: { offset: start, length: end - start + 1 }, start, end };
}

/* Files from the R2 bucket. Anything under "public/" or "downloads/" (the library's free models: STEP, STL, 3MF, GLB
   and the renders of every size) and every library file marked "free" is served to everyone — GET, HEAD, ranges,
   CORS open; Pro files answer 402 until the licence service is connected. `?download=1` saves the file (attachment)
   and counts it in D1 `downloads` (key and a number — nothing about the visitor); a viewer loading a GLB, a HEAD or
   a range is not a download. */
async function serve(request: Request, params: Promise<{ key: string[] }>, head: boolean) {
  const { key: parts } = await params;
  const key = parts.map(decodeURIComponent).join('/');
  if (!key || key.includes('..')) return new Response('Not found', { status: 404 });

  const open = key.startsWith('public/') || key.startsWith('downloads/');
  const file = open ? undefined : (await getItems()).flatMap((i) => i.files).find((f) => f.href === key || f.href === `/api/files/${key}`);
  const isPublic = open || file?.access === 'free';
  if (!isPublic) {
    return Response.json({ error: 'pro_required', message: 'This file is available with Monge Pro.' }, { status: 402 });
  }

  const { FILES, DB } = await getEnv();
  if (!FILES) return new Response('Storage unavailable', { status: 503 });
  const meta = await FILES.head(key);
  if (!meta) return new Response('Not found', { status: 404, headers: open ? OPEN_CORS : {} });

  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  const headers = new Headers(open ? OPEN_CORS : {});
  // the type from the object's metadata (not writeHttpMetadata: the dev proxy of the bucket cannot pass a Headers)
  const type = meta.httpMetadata?.contentType || TYPES[ext];
  if (type) headers.set('content-type', type);
  headers.set('etag', meta.httpEtag);
  headers.set('accept-ranges', 'bytes');
  headers.set('cache-control', 'public, max-age=86400, stale-while-revalidate=604800');
  // the checksum comes from the catalogue; without it (unreachable) the file is still served, only without the digest
  let d: string | null = null;
  if (key.startsWith('downloads/')) {
    try {
      await ensureDownloads();
      d = digest(key);
    } catch {
      d = null;
    }
  }
  if (d) headers.set('repr-digest', `sha-256=:${d}:`);
  const url = new URL(request.url);
  const save = url.searchParams.has('download');
  headers.set('content-disposition', `${save ? 'attachment' : 'inline'}; filename="${key.split('/').pop()}"`);

  const range = rangeOf(request.headers.get('range'), meta.size);
  if (range === 'bad') {
    headers.set('content-range', `bytes */${meta.size}`);
    return new Response(null, { status: 416, headers });
  }
  if (head) {
    headers.set('content-length', String(meta.size));
    return new Response(null, { status: 200, headers });
  }
  if (range) {
    const object = await FILES.get(key, { range: range.r });
    if (!object) return new Response('Not found', { status: 404, headers });
    headers.set('content-range', `bytes ${range.start}-${range.end}/${meta.size}`);
    headers.set('content-length', String(range.end - range.start + 1));
    return new Response(object.body, { status: 206, headers });
  }
  const object = await FILES.get(key);
  if (!object) return new Response('Not found', { status: 404, headers });
  headers.set('content-length', String(meta.size));
  if (save && DB && key.startsWith('downloads/')) {
    try {
      await DB.prepare("INSERT INTO downloads (key, count, last_at) VALUES (?, 1, datetime('now')) ON CONFLICT(key) DO UPDATE SET count = count + 1, last_at = excluded.last_at").bind(key).run();
    } catch (error) {
      console.warn('[files] download not counted', error);
    }
  }
  return new Response(object.body, { headers });
}

export function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  return serve(request, params, false);
}

export function HEAD(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  return serve(request, params, true);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: OPEN_CORS });
}
