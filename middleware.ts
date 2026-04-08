import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Query parameters that carry no unique content and only create
 * duplicate URLs in Google's index (canonical variants).
 * Middleware strips them with a 301 redirect so:
 *  1. Google re-crawls → gets 301 → indexes clean URL
 *  2. Old cached URLs in SERP drain away
 *  3. robots.txt "Disallow" prevents NEW crawling
 *
 * Keep meaningful params: region, q, goal, meal (they affect content).
 */
const JUNK_PARAMS = new Set([
  'from',        // navigation breadcrumb hint (analyzer/catalog/table)
  'ingredient',  // converter pre-fill (client-only, not SSR)
  'to',          // converter unit pair (client-only)
  'product',     // contact form pre-fill
  'type',        // contact form pre-fill
  'category',    // blog category filter (client-side)
]);

/** Month slugs that used to live at /fish-season/{month} (flat) */
const MONTH_SLUGS = new Set([
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
  '01','02','03','04','05','06','07','08','09','10','11','12',
  '1','2','3','4','5','6','7','8','9',
]);

export default function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // ── fish-season?region=XX → /fish-season/xx ────────────────────────
  if (url.pathname.match(/\/chef-tools\/fish-season\/?$/) && url.searchParams.has('region')) {
    const region = url.searchParams.get('region')!.toLowerCase();
    url.searchParams.delete('region');
    url.pathname = url.pathname.replace(/\/fish-season\/?$/, `/fish-season/${region}`);
    return NextResponse.redirect(url, 301);
  }

  // ── fish-season/{month} → /fish-season/pl/{month} (old flat → hierarchical) ──
  const fishMatch = url.pathname.match(/\/chef-tools\/fish-season\/([^/]+)\/?$/);
  if (fishMatch) {
    const segment = fishMatch[1].toLowerCase();
    if (MONTH_SLUGS.has(segment)) {
      url.pathname = url.pathname.replace(
        /\/fish-season\/([^/]+)\/?$/,
        `/fish-season/pl/${segment}`,
      );
      return NextResponse.redirect(url, 301);
    }
  }

  // Strip junk query params → 301 permanent redirect to clean URL
  if (url.searchParams.size > 0) {
    let stripped = false;
    for (const key of JUNK_PARAMS) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        stripped = true;
      }
    }
    if (stripped) {
      // If all params removed → clean pathname; otherwise keep remaining
      return NextResponse.redirect(url, 301);
    }
  }

  const response = intlMiddleware(request);
  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
