import { isLocale, type Locale } from '@/lib/i18n';

/* Monge Catalog API v1 — read-only, JSON, open to every origin. */
export const API_VERSION = '1.0';

export const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
};

export function json(body: unknown, status = 200, cache = 'public, max-age=300, s-maxage=3600') {
  return Response.json(body, { status, headers: { ...CORS, 'cache-control': cache, 'x-monge-api': API_VERSION } });
}

export function problem(status: number, error: string, message: string, extra: Record<string, unknown> = {}) {
  return json({ error, message, ...extra }, status, 'no-store');
}

export const options = () => new Response(null, { status: 204, headers: CORS });

export function localeOf(v: string | null): Locale {
  return v && isLocale(v) ? v : 'en';
}
