import { getCloudflareContext } from '@opennextjs/cloudflare';

/* Minimal shapes of the Cloudflare bindings this site uses (D1 + R2), so the
   project does not depend on generated worker types. Run `npm run cf-typegen`
   for the full definitions if needed. */
export interface D1Result<T> {
  results: T[];
  success: boolean;
}
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result<unknown>>;
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
export interface R2Object {
  key: string;
  size: number;
  httpEtag: string;
  httpMetadata?: { contentType?: string };
  /** present on a ranged get: what part of the object the body is */
  range?: { offset?: number; length?: number; suffix?: number };
  writeHttpMetadata(headers: Headers): void;
}
export interface R2ObjectBody extends R2Object {
  body: ReadableStream;
}
export type R2Range = { offset?: number; length?: number; suffix?: number };
export interface R2ObjectInfo {
  key: string;
  size: number;
  uploaded: Date;
}
export interface R2Bucket {
  get(key: string, options?: { range?: R2Range }): Promise<R2ObjectBody | null>;
  head(key: string): Promise<R2Object | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: { httpMetadata?: { contentType?: string } }): Promise<R2ObjectInfo | null>;
  list(options?: { prefix?: string; delimiter?: string; cursor?: string; limit?: number }): Promise<{
    objects: R2ObjectInfo[];
    delimitedPrefixes: string[];
    truncated: boolean;
    cursor?: string;
  }>;
}

export type SiteEnv = {
  /** D1 database with the library and the leads (wrangler binding "DB"). */
  DB?: D1Database;
  /** R2 bucket with model files, renders and releases (wrangler binding "FILES"). */
  FILES?: R2Bucket;
  /** Resend API key (secret: `npx wrangler secret put RESEND_API_KEY`). */
  RESEND_API_KEY?: string;
  /** Where lead notifications go (wrangler var). */
  LEAD_EMAIL_TO?: string;
  /** Sender; defaults to Resend's test address until the domain is verified. */
  LEAD_EMAIL_FROM?: string;
  /** Token of the Monge app for the private template API (secret MONGE_API_TOKEN). */
  MONGE_API_TOKEN?: string;
  /** Workers rate limiter of the MCP server (wrangler `ratelimits` binding "MCP_LIMIT"): requests per client address. */
  MCP_LIMIT?: { limit(o: { key: string }): Promise<{ success: boolean }> };
  /** Extra browser origins allowed to call /mcp, comma-separated (wrangler var); no Origin header is always allowed. */
  MCP_ALLOWED_ORIGINS?: string;
};

/** The worker bindings, or {} when running outside Cloudflare (next build, plain next dev). */
export async function getEnv(): Promise<SiteEnv> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env as unknown as SiteEnv;
  } catch {
    return {};
  }
}
