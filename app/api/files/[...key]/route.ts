import { getEnv } from '@/lib/cf';
import { getItems } from '@/lib/library';

const TYPES: Record<string, string> = {
  glb: 'model/gltf-binary',
  step: 'model/step',
  stp: 'model/step',
  stl: 'model/stl',
  dxf: 'image/vnd.dxf',
  pdf: 'application/pdf',
  png: 'image/png',
  webp: 'image/webp',
  dmg: 'application/x-apple-diskimage',
};

/* Files from the R2 bucket. Anything under "public/" and every library file marked
   "free" is served to everyone; Pro files answer 402 until the licence service
   (Monge app sign-in) is connected. */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params;
  const key = parts.map(decodeURIComponent).join('/');
  if (!key || key.includes('..')) return new Response('Not found', { status: 404 });

  const items = await getItems();
  const file = items.flatMap((i) => i.files).find((f) => f.href === key || f.href === `/api/files/${key}`);
  const isPublic = key.startsWith('public/') || file?.access === 'free';
  if (!isPublic) {
    return Response.json({ error: 'pro_required', message: 'This file is available with Monge Pro.' }, { status: 402 });
  }

  const { FILES } = await getEnv();
  if (!FILES) return new Response('Storage unavailable', { status: 503 });
  const object = await FILES.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  if (!headers.get('content-type') && TYPES[ext]) headers.set('content-type', TYPES[ext]);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=86400, stale-while-revalidate=604800');
  headers.set('content-disposition', `inline; filename="${key.split('/').pop()}"`);
  return new Response(object.body, { headers });
}
