import { json, localeOf, options, problem, withCatalog } from '@/lib/api';
import { parseQuery, record, search, type Query } from '@/lib/catalog';
import type { DlFormat } from '@/lib/downloads';

const MAX_LIMIT = 50;
const THREADS = ['cosmetic', 'exact', 'print'];
const FORMATS = ['step', 'stl', '3mf', 'glb'];

/** GET /api/v1/models?q=&standard=&category=&size=&length=&thread=&format=&locale=&limit=&cursor=
    The geometries that have everything asked (match: "exact"), or — none — match: "not_found" and the nearest, each
    with what differs. Filters override what q says. */
export function GET(request: Request) {
  return withCatalog(() => search_(request));
}

function search_(request: Request) {
  const u = new URL(request.url);
  const p = (k: string) => u.searchParams.get(k)?.trim() || null;
  const q = p('q') ?? '';
  if (q.length > 200) return problem(400, 'bad_query', 'q: at most 200 characters');
  const locale = localeOf(p('locale'));
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(p('limit') ?? 10) || 10));
  const cursor = Math.max(0, Number(p('cursor') ?? 0) || 0);
  const filters: Partial<Query> = {};
  const size = p('size');
  if (size) {
    if (/^km\s*\d+$/i.test(size)) filters.km = size.toUpperCase().replace(/\s+/g, '');
    else if (/^\d{4,5}$/.test(size)) filters.bearing = size;
    else {
      const m = /^(?:m|ø|d)?\s*\(?(\d+(?:[.,]\d+)?)\)?$/i.exec(size);
      if (!m) return problem(400, 'bad_size', 'size: M12, 12, 6204 or KM4');
      filters.d = Number(m[1].replace(',', '.'));
    }
  }
  const length = p('length');
  if (length) {
    const n = Number(length.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return problem(400, 'bad_length', 'length: a number of millimetres');
    filters.l = n;
  }
  const thread = p('thread');
  if (thread) {
    if (!THREADS.includes(thread)) return problem(400, 'bad_thread', `thread: ${THREADS.join(', ')}`);
    filters.thread = thread as Query['thread'];
  }
  const format = p('format');
  if (format) {
    if (!FORMATS.includes(format.toLowerCase())) return problem(400, 'bad_format', `format: ${FORMATS.join(', ')}`);
    filters.format = format.toLowerCase() as DlFormat;
  }
  const standard = p('standard');
  if (standard) filters.standard = standard.toUpperCase().replace(/^(ISO|DIN|EN)\s*/, '$1 ');
  const category = p('category');
  if (category) filters.families = category.split(',').map((x) => x.trim()).filter(Boolean);
  if (!q && !Object.keys(filters).length) return problem(400, 'empty_query', 'Give q (e.g. «ISO 4017 M12x60 real thread STEP») or filters.');
  const query = parseQuery(q, filters);
  const r = search(query);
  const page = r.results.slice(cursor, cursor + limit);
  const interpreted = Object.fromEntries(Object.entries(r.query).filter(([k]) => k !== 'q'));
  return json({
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
  });
}
export const OPTIONS = options;
