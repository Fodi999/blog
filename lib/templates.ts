import type { SiteEnv } from '@/lib/cf';

/* Private parametric templates of the Monge app, kept in R2 under templates/<slug>/:
   template.rhai (the script), meta.json (title, parameters, file list) and production files.
   Only the Monge app with the token reaches them; /api/files never serves this prefix. */

export const SLUG = /^[a-z0-9][a-z0-9-]{1,63}$/;
export const FILE = /^[A-Za-z0-9_-][A-Za-z0-9._-]{0,99}$/;
export const PREFIX = 'templates/';

/** Constant-time check of "Authorization: Bearer <token>". */
export function authorized(request: Request, env: SiteEnv): boolean {
  const want = env.MONGE_API_TOKEN ?? '';
  const got = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (want.length < 16 || got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0;
}

export const denied = () => Response.json({ error: 'unauthorized' }, { status: 401 });
