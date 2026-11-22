import { localeOf } from '@/lib/api';
import { allEntries, entryOf, modelId, parseId, parseQuery, record, search, type Query } from '@/lib/catalog';
import type { DlFormat } from '@/lib/downloads';

/* The search and the record lookup of the Monge Catalog API, as functions: /api/v1/models and /api/v1/models/{id}
   answer with them, and so does the MCP server (/mcp) — one search, one set of records. Call ensureDownloads first. */

export const MAX_LIMIT = 50;
export const THREADS = ['cosmetic', 'exact', 'print'] as const;
export const FORMATS = ['step', 'stl', '3mf', 'glb'] as const;

export type Refusal = { ok: false; status: number; error: string; message: string; extra?: Record<string, unknown> };
export type SearchBody = {
  query: string;
  interpreted: Record<string, unknown>;
  match: 'exact' | 'not_found' | 'browse';
  total: number;
  results: (ReturnType<typeof record> & { file?: ReturnType<typeof record>['files'][number]; differs?: string[] })[];
  next_cursor: string | null;
  notes: string[];
};

/** The query of /api/v1/models: q=&standard=&category=&size=&length=&thread=&format=&locale=&limit=&cursor=
    Filters override what q says. */
export function catalogSearch(params: URLSearchParams, maxLimit = MAX_LIMIT): { ok: true; body: SearchBody } | Refusal {
  const p = (k: string) => params.get(k)?.trim() || null;
  const no = (error: string, message: string): Refusal => ({ ok: false, status: 400, error, message });
  const q = p('q') ?? '';
  if (q.length > 200) return no('bad_query', 'q: at most 200 characters');
  const locale = localeOf(p('locale'));
  const limit = Math.min(maxLimit, Math.max(1, Number(p('limit') ?? 10) || 10));
  const cursor = Math.max(0, Number(p('cursor') ?? 0) || 0);
  const filters: Partial<Query> = {};
  const size = p('size');
  if (size) {
    if (/^km\s*\d+$/i.test(size)) filters.km = size.toUpperCase().replace(/\s+/g, '');
    else if (/^\d{4,5}$/.test(size)) filters.bearing = size;
    else {
      const m = /^(?:m|ø|d)?\s*\(?(\d+(?:[.,]\d+)?)\)?$/i.exec(size);
      if (!m) return no('bad_size', 'size: M12, 12, 6204 or KM4');
      filters.d = Number(m[1].replace(',', '.'));
    }
  }
  const length = p('length');
  if (length) {
    const n = Number(length.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return no('bad_length', 'length: a number of millimetres');
    filters.l = n;
  }
  const thread = p('thread');
  if (thread) {
    if (!(THREADS as readonly string[]).includes(thread)) return no('bad_thread', `thread: ${THREADS.join(', ')}`);
    filters.thread = thread as Query['thread'];
  }
  const format = p('format');
  if (format) {
    if (!(FORMATS as readonly string[]).includes(format.toLowerCase())) return no('bad_format', `format: ${FORMATS.join(', ')}`);
    filters.format = format.toLowerCase() as DlFormat;
  }
  const standard = p('standard');
  if (standard) filters.standard = standard.toUpperCase().replace(/^(ISO|DIN|EN)\s*/, '$1 ');
  const category = p('category');
  if (category) filters.families = category.split(',').map((x) => x.trim()).filter(Boolean);
  // a standard names a part the same way in a filter as in words: ISO 4017 → the bolt (the bolted joint, an assembly
  // also built by ISO 4017, is asked for by name or category); a standard that names no part (ISO 261) keeps them all
  else if (standard) {
    const named = parseQuery(standard).families;
    if (named.length) filters.families = named;
  }
  if (!q && !Object.keys(filters).length) return no('empty_query', 'Give q (e.g. «ISO 4017 M12x60 real thread STEP») or filters.');
  const query = parseQuery(q, filters);
  const r = search(query);
  const page = r.results.slice(cursor, cursor + limit);
  const interpreted = Object.fromEntries(Object.entries(r.query).filter(([k]) => k !== 'q'));
  return {
    ok: true,
    body: {
      query: q,
      interpreted,
      match: r.match,
      total: r.total,
      // with format asked, `file` is that format's file of the result (all formats stay in `files`)
      results: page.map((x) => {
        const rec = record(x.entry, locale);
        const file = query.format ? rec.files.find((f) => f.format === query.format) : undefined;
        return { ...rec, ...(file ? { file } : {}), ...(x.diff.length ? { differs: x.diff } : {}) };
      }),
      next_cursor: cursor + limit < r.total ? String(cursor + limit) : null,
      notes: r.notes,
    },
  };
}

/** One geometry by id (<part>--<size>--<option>): its full record and the other options of its size. */
export function catalogModel(id: string, locale: ReturnType<typeof localeOf>) {
  const e = entryOf(id);
  if (!e) {
    const p = parseId(id);
    const same = p ? allEntries().filter((x) => x.item.slug === p.slug && x.page.id === p.page) : [];
    return {
      ok: false as const,
      status: 404,
      error: 'not_found',
      message: `No model «${id}».`,
      extra: same.length ? { options_of_this_size: same.map((x) => modelId(x.item.slug, x.page.id, x.opt.id)) } : {},
    };
  }
  return {
    ok: true as const,
    body: {
      ...record(e, locale, true),
      other_options: e.page.options.filter((o) => o.id !== e.opt.id).map((o) => ({ id: modelId(e.item.slug, e.page.id, o.id), label: o.label[locale] })),
    },
  };
}
