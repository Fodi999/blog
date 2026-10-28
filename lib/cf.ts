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
export interface R2ObjectBody {
  body: ReadableStream;
  size: number;
  httpEtag: string;
  httpMetadata?: { contentType?: string };
  writeHttpMetadata(headers: Headers): void;
}
export interface R2ObjectInfo {
  key: string;
  size: number;
  uploaded: Date;
}
export interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
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
