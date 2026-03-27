import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Wrap the default next-intl middleware to upgrade locale redirects
 * from 307 (temporary) → 308 (permanent).
 *
 * Safe because localeDetection is false — the redirect target is always
 * deterministic (→ /pl/...) and will never change per-user.
 * 308 tells Google to consolidate link equity on the locale URL.
 */
export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  // Upgrade temporary locale redirects to permanent
  if (response.status === 307 && response.headers.has('location')) {
    return new Response(null, {
      status: 308,
      headers: { location: response.headers.get('location')! },
    });
  }

  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
