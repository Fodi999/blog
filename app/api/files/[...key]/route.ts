import { getEnv } from '@/lib/cf';
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

/* Files from the R2 bucket. Anything under "public/" or "downloads/" (the library's free models: STEP, STL, 3MF,
   GLB of every ready configuration) and every library file marked "free" is served to everyone; Pro files answer
   402 until the licence service (Monge app sign-in) is connected. `?download=1` saves the file (attachment) and
   counts it in D1 `downloads` (key and a number — nothing about the visitor). */
export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
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
  const object = await FILES.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  // the type from the object's metadata (not writeHttpMetadata: the dev proxy of the bucket cannot pass a Headers)
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  const type = object.httpMetadata?.contentType || TYPES[ext];
  if (type) headers.set('content-type', type);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=86400, stale-while-revalidate=604800');
  const save = new URL(request.url).searchParams.has('download');
  headers.set('content-disposition', `${save ? 'attachment' : 'inline'}; filename="${key.split('/').pop()}"`);
  if (save && DB && key.startsWith('downloads/')) {
    try {
      await DB.prepare("INSERT INTO downloads (key, count, last_at) VALUES (?, 1, datetime('now')) ON CONFLICT(key) DO UPDATE SET count = count + 1, last_at = excluded.last_at").bind(key).run();
    } catch (error) {
      console.warn('[files] download not counted', error);
    }
  }
  return new Response(object.body, { headers });
}
