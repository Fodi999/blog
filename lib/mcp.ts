import { CATALOG } from '@/lib/catalog-version';
import { catalogModel, catalogSearch, FORMATS, THREADS } from '@/lib/catalog-search';
import { getEnv } from '@/lib/cf';
import { CatalogUnavailable, ensureDownloads } from '@/lib/downloads';
import { seedItems } from '@/lib/library';
import { SITE_URL } from '@/lib/seo';

/* MONGE MCP — the Monge library catalogue as a public, read-only MCP server (Streamable HTTP, POST /mcp).

   No registration, no state: every request stands alone. It speaks both eras of MCP on one endpoint:
   - legacy (2024-11-05 … 2025-11-25): initialize → tools/list → tools/call; no session is minted;
   - modern (2026-07-28): per-request `_meta` with the protocol version, server/discover, the mirrored headers
     MCP-Protocol-Version / Mcp-Method / Mcp-Name checked against the body, resultType on every result.
   Answers are single JSON objects (never an SSE stream: nothing here streams); GET and DELETE are 405.

   Three tools over the same functions as /api/v1 — one search, one set of records, no second database:
   search_models, get_model, get_download_links. Nothing is ever substituted: a search that finds no geometry with
   everything asked says not_found and lists the nearest apart, each with what differs. Only the free library files
   (/api/files/downloads/) are ever linked — never Pro files. */

export const MCP_SERVER = {
  name: 'monge-mcp',
  title: 'Monge MCP',
  version: '1.0.0',
  websiteUrl: `${SITE_URL}/en/mcp`,
} as const;

const MODERN = ['2026-07-28'];
const LEGACY = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const MAX_BODY = 64 * 1024;
const RATE = { limit: 60, periodS: 60 };

const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;
const RATE_LIMITED = -32000; // implementation-defined range
const HEADER_MISMATCH = -32020;
const UNSUPPORTED_PROTOCOL_VERSION = -32022;

const INSTRUCTIONS = [
  'Monge MCP is the catalogue of the Monge CAD library: standard parts built from the tables of their standards and checked by the Monge kernel, with STEP, STL, 3MF and GLB files — ISO 4017 hex bolts (M1.6–M64) and ISO 4762 socket head cap screws (M1.6–M36) in the lengths of their tables, ISO 4032 nuts and ISO 7089 washers (M1.6–M64), ISO 15 deep groove ball bearings of the 60, 62 and 63 series (6000–6020, 6200–6220, 6300–6320), DIN 981 lock nuts (KM0–KM20), EN 10080 rebar, bolted joints and example shafts. Not every size of every standard is here: the search says what exists.',
  'Use search_models with what the person asked (standard, size, length, thread); match "exact" means every result has all of it. match "not_found" means no geometry has everything asked: `results` is then empty and `nearest` lists other geometries with what `differs` — never present one of them as the part asked for; tell the person what differs and let them choose.',
  'Thread types: "exact" is a real helical thread, "cosmetic" a plain cylinder at the nominal diameter (lighter files), "print" a real thread with an allowance for FDM printing.',
  'get_model gives everything known of one model; get_download_links its files with size and SHA-256. Give people the model page (url) and the direct file links. Files are free to use, including commercially; they may not be resold or redistributed as files.',
].join('\n');

// ── tools ────────────────────────────────────────────────────────────────────────────────────────────────────────

const FAMILY_IDS = seedItems.map((i) => i.slug);
const LOCALE_ENUM = ['en', 'pl', 'ru'];
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const ID_RE = /^[a-z0-9_-]{3,160}$/;

const fileSchema = {
  type: 'object',
  properties: {
    format: { type: 'string', enum: [...FORMATS] },
    media_type: { type: 'string' },
    url: { type: 'string', description: 'Direct link (does not count as a download)' },
    download_url: { type: 'string', description: 'Saves the file and counts one download on the site' },
    bytes: { type: 'integer' },
    sha256: { type: 'string', description: 'SHA-256 of the file bytes, hex' },
  },
  required: ['format', 'url', 'bytes'],
};

const modelSummarySchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    url: { type: 'string' },
    standard: { type: ['string', 'null'] },
    size: { type: 'string' },
    option: { type: ['string', 'null'] },
    thread: { type: ['string', 'null'] },
    dimensions: { type: 'object' },
    image: { type: 'string' },
    glb: { type: ['string', 'null'] },
    formats: { type: 'array', items: { type: 'string' } },
    file: fileSchema,
    differs: { type: 'array', items: { type: 'string' } },
  },
  required: ['id', 'name', 'url'],
};

export const TOOLS = [
  {
    name: 'search_models',
    title: 'Search Monge models',
    description:
      'Find CAD models of standard parts in the Monge library by standard, size, length, thread type, file format or words in English, Polish or Russian (e.g. «ISO 4017 M12x60 real thread STEP», «śruba M10x40», «болт М12х60», «6204-2RS», «rebar Ø16»). Filters override what the query says. Returns match "exact" (every result has everything asked), "not_found" (nothing has it — `results` is empty and `nearest` lists other models with what differs; none of them is the one asked for) or "browse" (the query names no part or size). Nothing is substituted.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', maxLength: 200, description: 'What was asked, in words: part, standard, size, length, thread, format' },
        standard: { type: 'string', maxLength: 40, description: 'A part\'s main standard, e.g. "ISO 4017", "ISO 4762", "ISO 4032", "ISO 7089", "ISO 15", "DIN 981", "EN 10080"' },
        size: { type: 'string', maxLength: 20, description: 'Thread size "M12", a diameter "12", a bearing "6204" or a lock nut "KM4"' },
        length: { type: 'number', exclusiveMinimum: 0, maximum: 100000, description: 'Length in millimetres (a bolt\'s or screw\'s nominal length)' },
        thread: { type: 'string', enum: [...THREADS], description: '"exact" — a real helical thread; "cosmetic" — a plain cylinder; "print" — a real thread with an FDM allowance' },
        format: { type: 'string', enum: [...FORMATS], description: 'Only models that have this file; each result then carries it as `file`' },
        category: { type: 'string', enum: FAMILY_IDS, description: 'One part family' },
        locale: { type: 'string', enum: LOCALE_ENUM, default: 'en', description: 'Language of names and page links' },
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
        cursor: { type: 'string', maxLength: 10, description: 'next_cursor of the previous page' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        match: { type: 'string', enum: ['exact', 'not_found', 'browse'] },
        total: { type: 'integer' },
        results: { type: 'array', items: modelSummarySchema },
        nearest: { type: 'array', items: modelSummarySchema },
        nearest_total: { type: 'integer' },
        interpreted: { type: 'object' },
        next_cursor: { type: ['string', 'null'] },
        notes: { type: 'array', items: { type: 'string' } },
        catalog: { type: 'string' },
      },
      required: ['match', 'total', 'results', 'catalog'],
    },
    annotations: { title: 'Search Monge models', ...READ_ONLY },
  },
  {
    name: 'get_model',
    title: 'Get a Monge model',
    description:
      'Everything the Monge catalogue knows of one model by its id (from search_models, e.g. "bolt-iso-4017--m12-x-60--exact"): name, standard, dimensions, thread, mass, the kernel\'s checks of the geometry (and, for the print option, the print check), the image, the GLB for a 3D view, the files and the other options of the same size.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', maxLength: 160, description: 'Model id: <part>--<size>--<option>' },
        locale: { type: 'string', enum: LOCALE_ENUM, default: 'en' },
      },
      required: ['id'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        url: { type: 'string' },
        family: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, category: { type: 'string' } } },
        size: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' } } },
        option: { type: 'object', properties: { id: { type: 'string' }, label: { type: ['string', 'null'] } } },
        standard: { type: ['object', 'null'], properties: { id: { type: 'string' }, title: { type: 'string' }, checked: { type: 'string' }, table_url: { type: 'string' } } },
        dimensions: { type: 'object', description: 'Millimetres: nominal_diameter_mm, thread_pitch_mm, length_mm, grip_mm (joints), outside_diameter_mm, width_mm (bearings), overall_mm [x, y, z]' },
        thread: { type: ['object', 'null'], properties: { type: { type: 'string', enum: [...THREADS] }, print_allowance_mm_per_side: { type: 'number' } } },
        mass: { type: 'object', properties: { kg: { type: 'number' }, estimated: { type: 'boolean' } } },
        bodies: { type: 'integer', description: 'Solid bodies in the model: 1 for a part, more for an assembly' },
        verification: { type: 'object', properties: { geometry: { type: 'object' }, standard_table: { type: 'object' }, physical_tests: { type: 'object' }, print: { type: 'object' } } },
        image: { type: 'object', properties: { url: { type: 'string' }, of: { type: 'string' } } },
        glb: { type: ['string', 'null'] },
        files: { type: 'array', items: fileSchema },
        other_options: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' } } } },
        license: { type: 'object' },
        catalog: { type: 'string' },
      },
      required: ['id', 'name', 'url', 'files'],
    },
    annotations: { title: 'Get a Monge model', ...READ_ONLY },
  },
  {
    name: 'get_download_links',
    title: 'Get download links',
    description:
      'Direct links to a model\'s STEP, STL, 3MF and GLB files with each file\'s size in bytes and SHA-256 checksum, and the licence. `url` reads the file; `download_url` saves it and counts a download on the site. Only the free library files are linked.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', maxLength: 160, description: 'Model id from search_models' },
        formats: { type: 'array', items: { type: 'string', enum: [...FORMATS] }, maxItems: 4, uniqueItems: true, description: 'Only these formats (all by default)' },
        locale: { type: 'string', enum: LOCALE_ENUM, default: 'en' },
      },
      required: ['id'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        url: { type: 'string' },
        files: { type: 'array', items: fileSchema },
        missing_formats: { type: 'array', items: { type: 'string' } },
        license: { type: 'object' },
        verify: { type: 'string' },
      },
      required: ['id', 'files', 'license'],
    },
    annotations: { title: 'Get download links', ...READ_ONLY },
  },
];

type Args = Record<string, unknown>;
type ToolResult = { content: { type: 'text'; text: string }[]; structuredContent?: Record<string, unknown>; isError?: boolean };

const FREE_FILES = `${SITE_URL}/api/files/downloads/`;
type Rec = { id: string; name: string; url: string; standard: { id: string } | null; size: { label: string }; option: { label: string | null }; thread: { type: string } | null; dimensions: Record<string, unknown>; image: { url: string }; glb: string | null; files: { format: string; url: string; download_url: string; bytes: number; sha256?: string; media_type: string }[]; license: unknown; file?: unknown; differs?: string[] };

/** Only the free library's files ever leave the server. */
const freeOnly = <T extends { url: string }>(files: T[]) => files.filter((f) => f.url.startsWith(FREE_FILES));

function summary(r: Rec) {
  return {
    id: r.id,
    name: r.name,
    url: r.url,
    standard: r.standard?.id ?? null,
    size: r.size.label,
    option: r.option.label,
    thread: r.thread?.type ?? null,
    dimensions: r.dimensions,
    image: r.image.url,
    glb: r.glb && r.glb.startsWith(FREE_FILES) ? r.glb : null,
    formats: freeOnly(r.files).map((f) => f.format),
    ...(r.file && (r.file as { url: string }).url.startsWith(FREE_FILES) ? { file: r.file } : {}),
    ...(r.differs ? { differs: r.differs } : {}),
  };
}

function ok(structured: Record<string, unknown>, lead: string): ToolResult {
  return { content: [{ type: 'text', text: `${lead}\n\n${JSON.stringify(structured)}` }], structuredContent: structured };
}
function toolError(message: string, extra: Record<string, unknown> = {}): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify({ error: message, ...extra }) }], isError: true };
}

const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
const localeArg = (a: Args) => (LOCALE_ENUM.includes(String(a.locale)) ? (a.locale as 'en' | 'pl' | 'ru') : 'en');

/** Arguments against the tool's input schema: names, types, enums, bounds. A message, or null when they are fine. */
function checkArgs(tool: (typeof TOOLS)[number], a: Args): string | null {
  const props = tool.inputSchema.properties as unknown as Record<string, { type: string; enum?: string[]; maxLength?: number; minimum?: number; maximum?: number; maxItems?: number; items?: { enum?: string[] } }>;
  for (const k of Object.keys(a)) if (!props[k]) return `unknown argument «${k}»; allowed: ${Object.keys(props).join(', ')}`;
  for (const k of (tool.inputSchema as { required?: string[] }).required ?? []) if (a[k] === undefined || a[k] === null || a[k] === '') return `«${k}» is required`;
  for (const [k, v] of Object.entries(a)) {
    if (v === undefined || v === null) continue;
    const s = props[k];
    if (s.type === 'string') {
      if (typeof v !== 'string') return `«${k}» must be a string`;
      if (s.maxLength && v.length > s.maxLength) return `«${k}»: at most ${s.maxLength} characters`;
      if (s.enum && !s.enum.includes(v)) return `«${k}»: one of ${s.enum.join(', ')}`;
    } else if (s.type === 'number' || s.type === 'integer') {
      if (typeof v !== 'number' || !Number.isFinite(v) || (s.type === 'integer' && !Number.isInteger(v))) return `«${k}» must be a${s.type === 'integer' ? 'n integer' : ' number'}`;
      if (s.minimum != null && v < s.minimum) return `«${k}»: at least ${s.minimum}`;
      if (s.maximum != null && v > s.maximum) return `«${k}»: at most ${s.maximum}`;
      if (k === 'length' && v <= 0) return '«length» must be above 0';
    } else if (s.type === 'array') {
      if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) return `«${k}» must be a list of strings`;
      if (s.maxItems && v.length > s.maxItems) return `«${k}»: at most ${s.maxItems} items`;
      const bad = v.find((x) => s.items?.enum && !s.items.enum.includes(x as string));
      if (bad) return `«${k}»: «${bad}» is not one of ${s.items!.enum!.join(', ')}`;
    }
  }
  return null;
}

function searchModels(a: Args): ToolResult {
  const p = new URLSearchParams();
  const put = (k: string, v: unknown) => v != null && v !== '' && p.set(k, String(v));
  put('q', str(a.query)?.trim());
  put('standard', a.standard);
  put('size', a.size);
  put('length', a.length);
  put('thread', a.thread);
  put('format', a.format);
  put('category', a.category);
  put('locale', localeArg(a));
  put('limit', a.limit ?? 5);
  put('cursor', a.cursor);
  const r = catalogSearch(p, 20);
  if (!r.ok) return toolError(r.message, { code: r.error });
  const b = r.body;
  const items = (b.results as Rec[]).map(summary);
  const notFound = b.match === 'not_found';
  const out = {
    match: b.match,
    total: notFound ? 0 : b.total,
    results: notFound ? [] : items,
    ...(notFound ? { nearest: items, nearest_total: b.total } : {}),
    interpreted: b.interpreted,
    next_cursor: b.next_cursor,
    notes: notFound
      ? [...b.notes, 'Nothing was substituted. Do not offer a nearest model as the one asked for: say what differs and let the person choose.']
      : b.notes,
    catalog: CATALOG.version,
  };
  const lead =
    b.match === 'exact'
      ? `Found ${b.total} model(s) with everything asked${b.total > items.length ? ` (showing ${items.length}; next_cursor for more)` : ''}.`
      : notFound
        ? `No model has everything asked. ${items.length} nearest listed apart with what differs — none of them is the one asked for.`
        : 'The query names no part or size.';
  return ok(out, lead);
}

function getModel(a: Args): ToolResult {
  const id = String(a.id).trim();
  if (!ID_RE.test(id)) return toolError('id: <part>--<size>--<option>, e.g. bolt-iso-4017--m12-x-60--exact', { code: 'bad_id' });
  const r = catalogModel(id, localeArg(a));
  if (!r.ok) return toolError(r.message, { code: r.error, ...r.extra });
  const rec = r.body as unknown as Rec & Record<string, unknown>;
  const body = { ...rec, files: freeOnly(rec.files), glb: rec.glb && rec.glb.startsWith(FREE_FILES) ? rec.glb : null, catalog: CATALOG.version };
  return ok(body, `${rec.name} — ${rec.url}`);
}

function getDownloadLinks(a: Args): ToolResult {
  const id = String(a.id).trim();
  if (!ID_RE.test(id)) return toolError('id: <part>--<size>--<option>, e.g. bolt-iso-4017--m12-x-60--exact', { code: 'bad_id' });
  const r = catalogModel(id, localeArg(a));
  if (!r.ok) return toolError(r.message, { code: r.error, ...r.extra });
  const rec = r.body as unknown as Rec;
  const want = Array.isArray(a.formats) && a.formats.length ? (a.formats as string[]) : [...FORMATS];
  const files = freeOnly(rec.files)
    .filter((f) => want.includes(f.format))
    .map((f) => ({ format: f.format, media_type: f.media_type, url: f.url, download_url: f.download_url, bytes: f.bytes, ...(f.sha256 ? { sha256: f.sha256 } : {}) }));
  const missing = want.filter((w) => !files.some((f) => f.format === w));
  const out = {
    id: rec.id,
    name: rec.name,
    url: rec.url,
    files,
    ...(missing.length ? { missing_formats: missing } : {}),
    license: rec.license,
    verify: 'sha256 is the SHA-256 of the file bytes (hex). Check it after download (shasum -a 256 <file>); the file response also carries it as Repr-Digest: sha-256=:<base64>:.',
    catalog: CATALOG.version,
  };
  const lead = `${rec.name}: ${files.map((f) => `${f.format.toUpperCase()} ${f.bytes} B`).join(', ')}${missing.length ? `; no ${missing.join(', ').toUpperCase()} for this model` : ''}.`;
  return ok(out, lead);
}

const RUN: Record<string, (a: Args) => ToolResult> = { search_models: searchModels, get_model: getModel, get_download_links: getDownloadLinks };

async function callTool(params: Args): Promise<ToolResult | { rpcError: { code: number; message: string } }> {
  const name = str(params.name);
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { rpcError: { code: INVALID_PARAMS, message: `Unknown tool «${name ?? ''}». Tools: ${TOOLS.map((t) => t.name).join(', ')}` } };
  const args = (params.arguments ?? {}) as Args;
  if (typeof args !== 'object' || Array.isArray(args)) return toolError('arguments must be an object');
  const bad = checkArgs(tool, args);
  if (bad) return toolError(bad, { code: 'bad_arguments' });
  try {
    await ensureDownloads();
  } catch (e) {
    if (e instanceof CatalogUnavailable) return toolError('The catalogue is not reachable right now; try again in a minute.', { code: 'catalog_unavailable', catalog: CATALOG.version });
    throw e;
  }
  return RUN[tool.name](args);
}

// ── HTTP ─────────────────────────────────────────────────────────────────────────────────────────────────────────

const OWN_ORIGINS = [SITE_URL, SITE_URL.replace('://', '://www.')];
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/;

/** Origin check (DNS rebinding): no Origin — a server or a desktop client — is fine; a browser page may call only from
    this site, the local machine (MCP Inspector) or an origin named in MCP_ALLOWED_ORIGINS. */
function originAllowed(origin: string | null, extra: string | undefined): boolean {
  if (origin == null) return true;
  if (OWN_ORIGINS.includes(origin) || LOCAL_ORIGIN.test(origin)) return true;
  return (extra ?? '').split(',').map((s) => s.trim()).filter(Boolean).includes(origin);
}

function cors(origin: string | null): Record<string, string> {
  if (!origin) return {};
  return {
    'access-control-allow-origin': origin,
    vary: 'Origin',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, accept, mcp-protocol-version, mcp-method, mcp-name, mcp-session-id, last-event-id',
    'access-control-max-age': '86400',
  };
}

/* Two limits, both must allow: the Workers rate-limit binding (shared by the instances of a Cloudflare location) and a
   count in this instance's memory (always there, also in next dev). `how` says what decided — for the logs. */
const windowHits = new Map<string, { start: number; n: number }>();
async function allowed(key: string, binding: { limit(o: { key: string }): Promise<{ success: boolean }> } | undefined): Promise<{ ok: boolean; how: string }> {
  const now = Date.now();
  let w = windowHits.get(key);
  if (!w || now - w.start > RATE.periodS * 1000) {
    if (windowHits.size > 5000) windowHits.clear();
    w = { start: now, n: 0 };
    windowHits.set(key, w);
  }
  const local = ++w.n <= RATE.limit;
  if (!local) return { ok: false, how: 'instance' };
  if (!binding) return { ok: true, how: 'instance-only' };
  try {
    const r = await binding.limit({ key });
    return { ok: r.success, how: r.success ? 'binding-ok' : 'binding' };
  } catch (e) {
    console.warn('[mcp] rate limiter failed', e);
    return { ok: true, how: 'binding-error' };
  }
}

type Id = string | number | null;
function decodeHeader(v: string): string | null {
  const m = /^=\?base64\?([A-Za-z0-9+/=]*)\?=$/.exec(v);
  if (!m) return v;
  try {
    return new TextDecoder().decode(Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

export async function handleMcp(request: Request): Promise<Response> {
  const origin = request.headers.get('origin');
  const env = await getEnv();
  const base: Record<string, string> = { 'cache-control': 'no-store', 'x-monge-catalog': CATALOG.version };
  const send = (status: number, body: unknown, extra: Record<string, string> = {}) =>
    new Response(body === null ? null : JSON.stringify(body), {
      status,
      headers: { ...base, ...(body === null ? {} : { 'content-type': 'application/json' }), ...cors(originAllowed(origin, env.MCP_ALLOWED_ORIGINS) ? origin : null), ...extra },
    });
  const rpcError = (status: number, id: Id, code: number, message: string, data?: unknown, extra: Record<string, string> = {}) =>
    send(status, { jsonrpc: '2.0', id, error: { code, message, ...(data !== undefined ? { data } : {}) } }, extra);

  if (!originAllowed(origin, env.MCP_ALLOWED_ORIGINS)) return rpcError(403, null, INVALID_REQUEST, `Origin ${origin} is not allowed`);
  if (request.method === 'OPTIONS') return send(204, null);
  if (request.method !== 'POST')
    return send(405, { error: 'method_not_allowed', message: 'This is an MCP endpoint (Streamable HTTP): send JSON-RPC with POST. No SSE stream is offered.', docs: MCP_SERVER.websiteUrl }, { allow: 'POST, OPTIONS' });

  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local';
  const gate = await allowed(`mcp:${ip}`, env.MCP_LIMIT);
  base['x-mcp-limit'] = gate.how;
  if (!gate.ok) return rpcError(429, null, RATE_LIMITED, `Too many requests: at most ${RATE.limit} a minute per address`, undefined, { 'retry-after': String(RATE.periodS) });

  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') return rpcError(415, null, INVALID_REQUEST, 'Content-Type must be application/json');
  const accept = request.headers.get('accept');
  if (accept && !/application\/json|text\/event-stream|\*\/\*|application\/\*/i.test(accept)) return rpcError(406, null, INVALID_REQUEST, 'Accept must allow application/json');
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) return rpcError(413, null, INVALID_REQUEST, `Body over ${MAX_BODY} bytes`);
  const raw = await request.text();
  if (raw.length > MAX_BODY) return rpcError(413, null, INVALID_REQUEST, `Body over ${MAX_BODY} bytes`);

  let msg: unknown;
  try {
    msg = JSON.parse(raw);
  } catch {
    return rpcError(400, null, PARSE_ERROR, 'Parse error: the body is not JSON');
  }
  if (Array.isArray(msg)) return rpcError(400, null, INVALID_REQUEST, 'Batches are not supported: send one JSON-RPC message per request');
  if (!msg || typeof msg !== 'object') return rpcError(400, null, INVALID_REQUEST, 'Invalid request');
  const m = msg as { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown; result?: unknown; error?: unknown };
  const idOk = typeof m.id === 'string' || (typeof m.id === 'number' && Number.isFinite(m.id));
  const id: Id = idOk ? (m.id as string | number) : null;
  if (m.jsonrpc !== '2.0') return rpcError(400, id, INVALID_REQUEST, 'jsonrpc must be "2.0"');
  // a response or a notification from the client: nothing to answer
  if (m.method === undefined && (m.result !== undefined || m.error !== undefined)) return send(202, null);
  if (typeof m.method !== 'string') return rpcError(400, id, INVALID_REQUEST, 'method must be a string');
  if (m.id === undefined) return send(202, null);
  if (!idOk) return rpcError(400, null, INVALID_REQUEST, 'id must be a string or a number');
  const method = m.method;
  const params = (m.params && typeof m.params === 'object' && !Array.isArray(m.params) ? m.params : {}) as Args;

  // ── which era ──
  const meta = (params._meta && typeof params._meta === 'object' ? params._meta : {}) as Args;
  const metaVersion = meta['io.modelcontextprotocol/protocolVersion'];
  const headerVersion = request.headers.get('mcp-protocol-version');
  const modern = method !== 'initialize' && metaVersion !== undefined;

  if (modern) {
    if (typeof metaVersion !== 'string') return rpcError(400, id, HEADER_MISMATCH, 'Header mismatch: _meta protocolVersion must be a string');
    if (headerVersion !== metaVersion) return rpcError(400, id, HEADER_MISMATCH, `Header mismatch: MCP-Protocol-Version header ${headerVersion ?? '(missing)'} does not match body value ${metaVersion}`);
    if (!MODERN.includes(metaVersion)) return rpcError(400, id, UNSUPPORTED_PROTOCOL_VERSION, `Unsupported protocol version ${metaVersion}`, { supported: MODERN, requested: metaVersion });
    const hMethod = request.headers.get('mcp-method');
    if (hMethod !== method) return rpcError(400, id, HEADER_MISMATCH, `Header mismatch: Mcp-Method header ${hMethod ?? '(missing)'} does not match body value ${method}`);
    if (method === 'tools/call' || method === 'resources/read' || method === 'prompts/get') {
      const bodyName = str(params.name) ?? str(params.uri);
      const h = request.headers.get('mcp-name');
      const hName = h == null ? null : decodeHeader(h);
      if (hName !== bodyName) return rpcError(400, id, HEADER_MISMATCH, `Header mismatch: Mcp-Name header ${h ?? '(missing)'} does not match body value ${bodyName ?? '(none)'}`);
    }
  } else if (method !== 'initialize' && headerVersion != null) {
    if (MODERN.includes(headerVersion)) return rpcError(400, id, HEADER_MISMATCH, `Header mismatch: MCP-Protocol-Version ${headerVersion} needs _meta["io.modelcontextprotocol/protocolVersion"] in the body`);
    if (!LEGACY.includes(headerVersion)) return rpcError(400, id, INVALID_REQUEST, `Unsupported MCP-Protocol-Version ${headerVersion}; supported: ${[...MODERN, ...LEGACY].join(', ')}`);
  }

  const reply = (result: Record<string, unknown>) =>
    send(200, { jsonrpc: '2.0', id, result: modern ? { ...result, resultType: 'complete', _meta: { ...((result._meta as object) ?? {}), 'io.modelcontextprotocol/serverInfo': MCP_SERVER } } : result });
  const notFound = () => rpcError(modern ? 404 : 200, id, METHOD_NOT_FOUND, `Method not found: ${method}`);
  const capabilities = { tools: { listChanged: false } };
  const listCache = modern ? { ttlMs: 3_600_000, cacheScope: 'public' } : {};

  try {
    switch (method) {
      case 'initialize': {
        const asked = str(params.protocolVersion);
        // the version asked when we speak it, else our latest legacy one (the client then decides)
        const version = asked && LEGACY.includes(asked) ? asked : LEGACY[0];
        return reply({ protocolVersion: version, capabilities, serverInfo: MCP_SERVER, instructions: INSTRUCTIONS });
      }
      case 'server/discover':
        return reply({ supportedVersions: MODERN, capabilities, instructions: INSTRUCTIONS, ttlMs: 3_600_000, cacheScope: 'public' });
      case 'ping':
        return reply({});
      case 'tools/list':
        return reply({ tools: TOOLS, ...listCache });
      case 'tools/call': {
        const r = await callTool(params);
        if ('rpcError' in r) return rpcError(modern ? 400 : 200, id, r.rpcError.code, r.rpcError.message);
        return reply(r as unknown as Record<string, unknown>);
      }
      default:
        return notFound();
    }
  } catch (e) {
    console.error('[mcp]', method, e);
    return rpcError(500, id, INTERNAL_ERROR, 'Internal error');
  }
}
