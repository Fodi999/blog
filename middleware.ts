import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Locale-aware middleware with smart redirect strategy:
 *
 * 1. Root `/` and locale-less paths → 307 (temporary)
 *    Because the target depends on the user's Accept-Language header.
 *    `/` → `/en/` for English users, `/pl/` for Polish, etc.
 *    Google crawls without Accept-Language → gets defaultLocale (pl).
 *
 * 2. This enables localeDetection: true in routing.ts,
 *    improving CTR and engagement for international users.
 */
export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
