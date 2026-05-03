/**
 * Image proxy — fetches images from remote origins (R2, CDN) server-side
 * and returns them with correct CORS headers so THREE.TextureLoader can
 * use them in WebGL without browser CORS blocks.
 *
 * Usage: /api/img?url=https://pub-xxx.r2.dev/products/abc.jpg
 */
import { type NextRequest, NextResponse } from 'next/server';

// Trusted image hosts — only these are proxied. Everything else gets
// a placeholder so the GPU renderer always receives a valid texture.
const ALLOWED_HOSTS = [
  'pub-aca11a32217e46129dd78b17f017d0a1.r2.dev',
  'r2.dev',
];

function isAllowed(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/** Redirect to the placeholder SVG — always a valid same-origin image. */
function placeholder() {
  return NextResponse.redirect(
    new URL('/images/food-placeholder.svg', 'http://localhost'),
    // Use 302 so the browser fetches it from the same origin.
    { status: 307, headers: { Location: '/images/food-placeholder.svg' } },
  );
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url');

  // No url → placeholder (GPU renderer needs something, not an error JSON).
  if (!raw) return placeholder();

  // Untrusted host (postimg.cc etc.) → placeholder, never 403.
  if (!isAllowed(raw)) return placeholder();

  try {
    const upstream = await fetch(raw, {
      cache: 'force-cache',
      // No extra headers — simple GET, avoids preflight on the server side.
    });

    // Upstream failed (404, 403, etc.) → placeholder so texture always loads.
    if (!upstream.ok) return placeholder();

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache 24 h in browser + CDN; immutable because product images
        // are content-addressed (UUID filenames).
        'Cache-Control': 'public, max-age=86400, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    // Network error, timeout, etc. → placeholder.
    return placeholder();
  }
}
