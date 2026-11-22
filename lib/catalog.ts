import { downloadsOf, fileKey, FORMATS, generation, text, type DlFormat, type DlOption, type DlPage } from '@/lib/downloads';
import type { Locale } from '@/lib/i18n';
import { seedItems, type LibraryItem } from '@/lib/library';
import { SITE_URL } from '@/lib/seo';
import { standardById, standardTitle } from '@/lib/standards';

/* MONGE CATALOG — the library as machine-readable records, one per geometry: the part's ready size (a page of the
   site) in one option (thread cosmetic / real / for printing, a bearing's seals …). Built from the catalogue
   (data/library.json), the checked files (data/downloads.json) and the standards' tables — no data of its own.
   Everything a record says comes from those; what they do not have is left out, never guessed. */

const LOCALES: Locale[] = ['en', 'pl', 'ru'];
const MEDIA: Record<DlFormat, string> = { step: 'model/step', stl: 'model/stl', '3mf': 'model/3mf', glb: 'model/gltf-binary' };

/** A model's id: <part>--<size>--<option> (the parts' and sizes' ids never hold a double hyphen). */
export function modelId(slug: string, page: string, option: string): string {
  return `${slug}--${page}--${option}`;
}

export function parseId(id: string): { slug: string; page: string; option: string } | null {
  const m = /^([a-z0-9-]+?)--([a-z0-9_-]+?)--([a-z0-9-]+)$/.exec(id);
  return m ? { slug: m[1], page: m[2], option: m[3] } : null;
}

type Facts = { d?: number; pitch?: number; l?: number; grip?: number; D?: number; B?: number; thread?: string; allowance?: number; seals?: string; balls?: boolean; shape?: string; ribs?: string; thread_size?: string; a?: number; b?: number; c?: number };

export type Entry = { item: LibraryItem; page: DlPage; opt: DlOption & { facts?: Facts; sha?: (string | null)[]; params?: Record<string, unknown> } };

let entries: Entry[] | null = null;
let builtFor = -1;

/** Every geometry of the library (built once per load of the data; call ensureDownloads first). */
export function allEntries(): Entry[] {
  if (entries && builtFor === generation) return entries;
  builtFor = generation;
  entries = [];
  for (const item of seedItems) {
    const dl = downloadsOf(item.slug);
    if (!dl) continue;
    for (const page of dl.pages) for (const opt of page.options) entries.push({ item, page, opt });
  }
  return entries;
}

export function entryOf(id: string): Entry | undefined {
  const p = parseId(id);
  if (!p) return undefined;
  return allEntries().find((e) => e.item.slug === p.slug && e.page.id === p.page && e.opt.id === p.option);
}

const fileUrl = (k: string) => `${SITE_URL}/api/files/${k}`;

/** The record of one geometry as the API gives it. `full` — with every file's checksum and the parameters. */
export function record(e: Entry, locale: Locale, full = false) {
  const { item, page, opt } = e;
  const slug = item.slug;
  const dl = downloadsOf(slug)!;
  const id = modelId(slug, page.id, opt.id);
  const label = (l: Locale) => text(page.label, l);
  const name = Object.fromEntries(
    LOCALES.map((l) => [l, `${item.short?.[l] ?? item.title[l]} ${label(l)}${page.options.length > 1 ? ` — ${opt.label[l]}` : ''}`]),
  ) as Record<Locale, string>;
  const f = opt.facts ?? {};
  const files = FORMATS.flatMap((fmt, i) => {
    const bytes = opt.bytes[i];
    if (bytes == null) return [];
    const k = fileKey(slug, page.id, opt.id, fmt);
    return [{ format: fmt, media_type: MEDIA[fmt], url: fileUrl(k), download_url: `${fileUrl(k)}?download=1`, bytes, ...(opt.sha?.[i] ? { sha256: opt.sha[i] } : {}) }];
  });
  const glb = files.find((x) => x.format === 'glb');
  const std = page.std ? standardById(page.std) : undefined;
  const pageUrl = (l: Locale) => `${SITE_URL}/${l}/library/${slug}/${page.id}`;
  return {
    id,
    name: name[locale],
    names: name,
    url: `${pageUrl(locale)}?option=${opt.id}`,
    page_url: pageUrl(locale),
    urls: Object.fromEntries(LOCALES.map((l) => [l, pageUrl(l)])),
    family: { id: slug, name: item.title[locale], url: `${SITE_URL}/${locale}/library/${slug}`, category: item.category },
    size: { id: page.id, label: label(locale), group: text(page.group, locale) },
    option: { id: opt.id, label: opt.label[locale] || null },
    standard: std
      ? { id: std.id, title: standardTitle(std, locale), edition: std.edition, checked: std.checked, table_url: `${SITE_URL}/${locale}/library/standards/${std.slug}` }
      : null,
    standards: (item.standards ?? []).map((sid) => standardById(sid)).filter((s) => s !== undefined).map((s) => ({ id: s.id, table_url: `${SITE_URL}/${locale}/library/standards/${s.slug}` })),
    dimensions: {
      ...(f.d != null ? { nominal_diameter_mm: f.d } : {}),
      ...(f.pitch != null ? { thread_pitch_mm: f.pitch } : {}),
      ...(f.thread_size ? { thread_size: f.thread_size } : {}),
      ...(f.l != null ? { length_mm: f.l } : {}),
      ...(f.grip != null ? { grip_mm: f.grip } : {}),
      ...(f.D != null ? { outside_diameter_mm: f.D } : {}),
      ...(f.B != null ? { width_mm: f.B } : {}),
      ...(f.a != null ? { a_mm: f.a } : {}),
      ...(f.b != null ? { b_mm: f.b } : {}),
      ...(f.c != null ? { c_mm: f.c } : {}),
      overall_mm: opt.sizeMm,
    },
    thread: f.thread ? { type: f.thread, ...(f.allowance != null ? { print_allowance_mm_per_side: f.allowance } : {}) } : null,
    ...(f.seals ? { bearing: { seals: f.seals, balls_modelled: !!f.balls } } : {}),
    ...(f.shape ? { rebar: { shape: f.shape, ribs: f.ribs ?? 'plain' } } : {}),
    material: item.material[locale],
    mass: { kg: opt.massKg, estimated: true, basis: 'mesh volume × 7850 kg/m³ (steel)' },
    bodies: opt.bodies,
    verification: {
      geometry: {
        kernel_body_report: opt.checks[0],
        step_read_back: opt.bytes[0] == null ? null : opt.checks[1],
        stl_closed: opt.bodies > 1 ? null : opt.checks[2],
        method:
          "Monge kernel's validity report of every B-Rep body; the STEP written and read back by Monge with the same faces, edges, vertices and volume; the STL checked for open and doubled edges.",
        monge_version: dl.version,
        checked: dl.checked,
      },
      standard_table: {
        standards: item.standards ?? [],
        method: "The dimensions come from Monge's tables of the standards, each checked against two published sources; the edition is pinned. Reference data — not a certificate of conformity.",
      },
      physical_tests: { done: false, note: 'No physical part was made or tested.' },
      ...(opt.print
        ? {
            print: {
              method: "Monge's layer-by-layer print check for FDM: 0.4 mm nozzle (walls ≥ 0.8 mm), 0.2 mm layers, overhangs to 45° and reaching ≤ 3 mm without support.",
              lies: opt.print.up === '-y' ? 'head down' : 'as it stands',
              no_support_needed: opt.print.ok,
              thinnest_wall_mm: opt.print.wall,
              longest_overhang_mm: opt.print.reach,
              pla_g: opt.print.pla,
            },
          }
        : {}),
    },
    image: page.image
      ? { url: fileUrl(`downloads/${slug}/${page.id}/${slug}-${page.id}.webp`), of: 'this size (its default option), rendered from its geometry by Monge', width: 1200, height: 900 }
      : { url: `${SITE_URL}${item.image}`, of: 'the part family (a representative size)', width: 1200, height: 900 },
    glb: glb ? glb.url : null,
    viewer_url: pageUrl(locale),
    files,
    license: { url: `${SITE_URL}/${locale}/license`, summary: 'Free, commercial use included; the files themselves may not be resold or redistributed.' },
    ...(full ? { parameters: opt.params ?? null } : {}),
  };
}

// ── search ───────────────────────────────────────────────────────────────────────────────────────────────────────

/** The words that name a part, in three languages and the trade's usage → the parts they can mean. */
const FAMILY_RAW: [string, string[]][] = [
  [String.raw`\b(?:iso\s*4017|din\s*933|hex(?:agon)?[\s-]*(?:head)?[\s-]*(?:bolt|screw)|bolts?|болт\p{L}*|sruba\s+sze\p{L}*|śruba\s+sze\p{L}*|łbem\s+sześ\p{L}*|lbem\s+szes\p{L}*)\b`, ['bolt-iso-4017']],
  [String.raw`\b(?:iso\s*4762|din\s*912|socket[\s-]*head|cap[\s-]*screws?|allen|imbus\p{L}*|винт\p{L}*|łbem\s+walc\p{L}*|lbem\s+walc\p{L}*)\b`, ['screw-iso-4762']],
  [String.raw`\b(?:śrub\p{L}*|srub\p{L}*|screws?)\b`, ['bolt-iso-4017', 'screw-iso-4762']],
  [String.raw`\b(?:iso\s*4032|din\s*934|hex(?:agon)?\s*nuts?|nuts?|гайк\p{L}*|nakrętk\p{L}*|nakretk\p{L}*)\b`, ['nut-iso-4032', 'lock-nut-din-981']],
  [String.raw`\b(?:din\s*981|km\s*\d+|lock[\s-]*nuts?|шлицев\p{L}*|łożyskow\p{L}*\s+nakr\p{L}*|nakr\p{L}*\s+łożysk\p{L}*)\b`, ['lock-nut-din-981']],
  [String.raw`\b(?:iso\s*7089|din\s*125|washers?|шайб\p{L}*|podkładk\p{L}*|podkladk\p{L}*)\b`, ['washer-iso-7089']],
  [String.raw`\b(?:iso\s*15|bearings?|подшипник\p{L}*|łożysk\p{L}*|lozysk\p{L}*|60\d\d|62\d\d|63\d\d)\b`, ['bearing-iso-15']],
  [String.raw`\b(?:shafts?|axles?|вал\p{L}*|ос[ьи]|wał\p{L}*|wal\p{L}*|oś)\b`, ['shaft']],
  [String.raw`\b(?:en\s*10080|rebars?|reinforc\p{L}*|арматур\p{L}*|pręt\p{L}*|pret\p{L}*|zbroj\p{L}*|b500[abc]?)\b`, ['rebar-en-10080']],
  [String.raw`\b(?:bolted\s*joints?|joints?|соединени\p{L}*|połączeni\p{L}*|polaczeni\p{L}*)\b`, ['bolt-joint-iso-4017']],
];

const FAMILY_WORDS: [RegExp, string[]][] = FAMILY_RAW.map(([src, fams]) => [new RegExp(`(?<![\\p{L}\\p{N}])(?:${src.replace(/\\b/g, '')})(?![\\p{L}\\p{N}])`, 'iu'), fams]);

export type Query = {
  q: string;
  families: string[];
  d?: number;
  l?: number;
  bearing?: string;
  seals?: string;
  balls?: boolean;
  km?: string;
  thread?: 'cosmetic' | 'exact' | 'print';
  format?: DlFormat;
  standard?: string;
};

const num = (s: string) => Number(s.replace(',', '.'));

/** A free-text query read as an engineer means it: «ISO 4017 M12x60 real thread STEP», «подшипник 6204 2RS», «rebar Ø16». */
export function parseQuery(raw: string, filters: Partial<Query> = {}): Query {
  // one spelling: lower case, the × of «M12 × 60» and its look-alikes as x, a comma decimal as a point
  const s = raw
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[×хх*]/g, 'x')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/\s+/g, ' ')
    .trim();
  const q: Query = { q: raw, families: [] };
  for (const [re, fams] of FAMILY_WORDS) if (re.test(s)) for (const f of fams) if (!q.families.includes(f)) q.families.push(f);
  // bolt / screw words beat the plain «śruba»
  if (q.families.includes('screw-iso-4762') && /łbem\s+walc|lbem\s+walc|imbus|socket|cap[\s-]*screw|винт|4762|912/.test(s)) q.families = q.families.filter((f) => f !== 'bolt-iso-4017' || /4017|933|bolt|болт|sześ|szes/.test(s));
  if (q.families.includes('lock-nut-din-981') && /\bkm\s*\d|981|lock|шлицев|łożysk\w*\s+nakr/.test(s)) q.families = q.families.filter((f) => f !== 'nut-iso-4032' || /4032|934/.test(s));
  else q.families = q.families.filter((f) => f !== 'lock-nut-din-981' || /\bkm\s*\d|981|lock|шлицев/.test(s));
  // a four-digit number alone says «bearing» only when nothing else is named (the 6000 of «rebar 12 6000» is a length)
  const brgWord = /подшипник|łożysk|lozysk|bearing|iso\s*15\b/.test(s);
  if (q.families.includes('bearing-iso-15') && !brgWord && q.families.length > 1) q.families = q.families.filter((f) => f !== 'bearing-iso-15');
  const std = /\b(iso|din|en)\s*(\d{2,5}(?:-\d)?)\b/.exec(s);
  if (std) q.standard = `${std[1].toUpperCase()} ${std[2]}`;
  // M12x60, M12 x 60, M12-60, M12 60, M(14)x40
  // the length is a number of its own: «M24 3MF» has none (the 3 is the format's)
  const m = /(?<![\p{L}\p{N}])[mм]\s*\(?(\d+(?:\.\d+)?)\)?(?:\s*(?:x|-|\s)\s*(\d+(?:\.\d+)?)(?![\p{L}\p{N}.]))?/u.exec(s);
  if (m) {
    q.d = num(m[1]);
    if (m[2]) q.l = num(m[2]);
  }
  const km = /\bkm\s*(\d+)\b/.exec(s);
  if (km) q.km = `KM${km[1]}`;
  // a bearing's designation: any four or five digits once a bearing is meant — 6999 is asked, and is not there
  const brg = /(?<![\p{L}\p{N}.])(\d{4,5})(?![\p{N}])/u.exec(s);
  if (brg && q.families.includes('bearing-iso-15')) q.bearing = brg[1];
  if (/2\s*rs\b|\brs\b|уплотн|uszczel|sealed/.test(s)) q.seals = '2rs';
  else if (/2\s*z\b|\bzz\b|защитн|blaszk|shield/.test(s)) q.seals = '2z';
  else if (/\bopen\b|открыт|otwart/.test(s)) q.seals = 'open';
  if (/ball|шарик|kulk/.test(s)) q.balls = true;
  // rebar: Ø16, d16, fi16, «арматура 16»
  if (q.families.includes('rebar-en-10080')) {
    const r = /(?:ø|⌀|\bfi|\bd|\bdiam\w*|\bдиаметр\w*)\s*(\d+)/.exec(s) ?? /\b(\d{1,2})\b/.exec(s.replace(/\b(?:en\s*)?10080\b|b500\w?/g, ''));
    if (r) q.d = num(r[1]);
    const len = /\b(300|6000|12000)\b/.exec(s);
    if (len) q.l = num(len[1]);
  }
  if (/печат|druk|print|\b3d\b|fdm/.test(s)) q.thread = 'print';
  else if (/настоящ|реальн|rzeczywist|\breal\b|exact|model(?:l)?ed thread|helical/.test(s)) q.thread = 'exact';
  else if (/условн|umown|cosmetic|simplif|plain thread/.test(s)) q.thread = 'cosmetic';
  const fmt = /\b(step|stp|stl|3mf|glb|gltf)\b/.exec(s);
  if (fmt) q.format = (fmt[1] === 'stp' ? 'step' : fmt[1] === 'gltf' ? 'glb' : fmt[1]) as DlFormat;
  return { ...q, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')) } as Query;
}

const SIZE_FAMILIES = ['bolt-iso-4017', 'screw-iso-4762', 'nut-iso-4032', 'washer-iso-7089', 'bolt-joint-iso-4017'];

/** What a geometry has against what was asked: [matched, differences in words]. */
function compare(e: Entry, q: Query): { ok: boolean; diff: string[]; score: number } {
  const f = e.opt.facts ?? {};
  const diff: string[] = [];
  let score = 0;
  const slug = e.item.slug;
  if (q.families.length && !q.families.includes(slug)) return { ok: false, diff: ['other part'], score: -1e9 };
  if (q.standard && !(e.item.standards ?? []).some((s) => s.replace(/\s+/g, ' ').toUpperCase() === q.standard)) return { ok: false, diff: ['other standard'], score: -1e9 };
  if (q.d != null) {
    if (f.d === q.d) score += 10;
    else diff.push(f.d != null ? `diameter ${f.d} instead of ${q.d}` : 'no diameter');
  }
  if (q.l != null) {
    if (f.l === q.l || f.grip === q.l) score += 8;
    else diff.push(f.l != null ? `length ${f.l} instead of ${q.l}` : f.grip != null ? `grip ${f.grip} instead of ${q.l}` : 'no such length');
  }
  if (q.bearing) {
    if (e.page.row === q.bearing) score += 10;
    else diff.push(`bearing ${e.page.row} instead of ${q.bearing}`);
  }
  if (q.km) {
    if (e.page.row === q.km) score += 10;
    else diff.push(`${e.page.row} instead of ${q.km}`);
  }
  if (q.seals) {
    if (f.seals?.toLowerCase() === q.seals || (q.seals === 'open' && f.seals === 'open')) score += 4;
    else diff.push(`seals ${f.seals} instead of ${q.seals}`);
  }
  if (q.balls != null) {
    if (!!f.balls === q.balls) score += 2;
    else diff.push(q.balls ? 'without balls modelled' : 'with balls');
  }
  if (q.thread) {
    if (f.thread === q.thread) score += 6;
    else diff.push(f.thread ? `thread ${f.thread} instead of ${q.thread}` : 'no thread option');
  }
  if (q.format) {
    const i = FORMATS.indexOf(q.format);
    if (e.opt.bytes[i] != null) score += 2;
    else diff.push(`no ${q.format.toUpperCase()} in this option`);
  }
  // without a thread asked: the real thread first, then cosmetic, the print option last
  if (!q.thread) score += f.thread === 'exact' ? 0.3 : f.thread === 'cosmetic' ? 0.2 : f.thread === 'print' ? 0 : 0.25;
  if (!q.seals && f.seals) score += f.seals === '2Z' ? 0.2 : 0;
  // among the nearest: the closest size and length first (M12 × 61 → M12 × 60, M12 × 65; M13 × 60 → M12, M14)
  const far = (q.d != null && f.d != null ? Math.abs(f.d - q.d) / 10 : 0) + (q.l != null && (f.l ?? f.grip) != null ? Math.abs((f.l ?? f.grip)! - q.l) / 100 : 0);
  return { ok: diff.length === 0, diff, score: score - diff.length * 5 - far };
}

export type SearchResult = { match: 'exact' | 'not_found' | 'browse'; query: Query; total: number; results: { entry: Entry; diff: string[] }[]; notes: string[] };

/** Exact geometries first; with none — `not_found` and the nearest, each with what differs. */
export function search(q: Query): SearchResult {
  const notes: string[] = [];
  const asked = q.d != null || q.l != null || q.bearing || q.km || q.thread || q.seals || q.format || q.families.length || q.standard;
  if (!asked) return { match: 'browse', query: q, total: 0, results: [], notes: ['Nothing in the query names a part or a size: try «ISO 4017 M12x60», «6204-2RS», «rebar Ø16».'] };
  let pool = allEntries();
  if (!q.families.length && q.d != null && !q.bearing && !q.km) pool = pool.filter((e) => SIZE_FAMILIES.includes(e.item.slug));
  const scored = pool.map((e) => ({ entry: e, ...compare(e, q) })).filter((x) => x.score > -1e8);
  const exact = scored.filter((x) => x.ok).sort((a, b) => b.score - a.score);
  if (exact.length) return { match: 'exact', query: q, total: exact.length, results: exact.map((x) => ({ entry: x.entry, diff: [] })), notes };
  const near = scored.filter((x) => x.diff.length <= 2 && x.score > 0).sort((a, b) => b.score - a.score || a.diff.length - b.diff.length);
  notes.push('No geometry has everything asked. The nearest are listed with what differs — none of them is the one asked for.');
  return { match: 'not_found', query: q, total: near.length, results: near.map((x) => ({ entry: x.entry, diff: x.diff })), notes };
}
