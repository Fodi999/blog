import { allEntries, entryOf, modelId, record, type Entry } from '@/lib/catalog';
import { CATALOG } from '@/lib/catalog-version';
import type { DlPage } from '@/lib/downloads';
import type { Locale } from '@/lib/i18n';
import { VIEWER_HTML, VIEWER_SHA } from '@/lib/mcp-viewer-html.generated';
import { SITE_URL } from '@/lib/seo';

/* MONGE MODEL VIEWER — the interactive 3D view of a library model inside an MCP host (MCP Apps, SEP-1865).

   render_model_viewer resolves model ids to their records; the host renders the result with the UI resource
   ui://monge/model-viewer.html (Three.js, built from mcp-app/ by scripts/build-mcp-viewer.mjs). The view loads the
   model's own GLB and the size's WebP straight from dima-fomin.pl (CSP connect/resource domain; the files answer with
   Access-Control-Allow-Origin: *). Nothing is drawn that is not in the files. A host without MCP Apps gets the same
   data as text: the characteristics, the WebP, the files and the model page with its 3D view on the site. */

/** Versioned: a new URI whenever the page changes, so no host shows a cached older page. */
export const VIEWER_URI = 'ui://monge/model-viewer-v4.html';
/** Earlier URIs of the view — still answered (with the current page), for hosts that cached them. */
export const VIEWER_URIS_OLD = ['ui://monge/model-viewer.html', 'ui://monge/model-viewer-v2.html', 'ui://monge/model-viewer-v3.html'];
export const VIEWER_MIME = 'text/html;profile=mcp-app';
const ORIGIN = new URL(SITE_URL).origin;
const FREE_FILES = `${SITE_URL}/api/files/downloads/`;

const CSP = { connectDomains: [ORIGIN], resourceDomains: [ORIGIN] };

/** The UI resource as resources/list gives it. */
export const VIEWER_RESOURCE = {
  uri: VIEWER_URI,
  name: 'monge_model_viewer',
  title: 'Monge 3D model viewer',
  description: 'Interactive 3D view of Monge library models (their own GLB files) with standard, size, thread and file links.',
  mimeType: VIEWER_MIME,
  _meta: { ui: { csp: CSP, prefersBorder: true } },
};

/** Claude's sandbox origin for a server's MCP Apps views: the first 32 hex of SHA-256 of the server URL + .claudemcpcontent.com
    (claude.com/docs/connectors/building/mcp-apps). */
export async function claudeUiDomain(serverUrl: string): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serverUrl)));
  return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32) + '.claudemcpcontent.com';
}

/** resources/read of the UI resource. The CSP is declared for MCP Apps hosts and, in its own keys, for ChatGPT. */
export function readViewer(uri: string = VIEWER_URI, domain?: string) {
  return {
    contents: [
      {
        uri,
        mimeType: VIEWER_MIME,
        text: VIEWER_HTML,
        _meta: {
          ui: { csp: CSP, prefersBorder: true, ...(domain ? { domain } : {}) },
          // redirect_domains: ChatGPT trusts openExternal / ui/open-link only to these (the file links, the model page)
          'openai/widgetCSP': { connect_domains: [ORIGIN], resource_domains: [ORIGIN], redirect_domains: [ORIGIN] },
          'openai/widgetPrefersBorder': true,
          'openai/widgetDescription': 'An interactive 3D view of the Monge model(s) just found, with their files.',
          'monge/viewerSha256': VIEWER_SHA,
        },
      },
    ],
  };
}

/** The option the size's WebP was rendered from (the site's renders: real thread, else the first non-print option). */
export function imageOption(page: DlPage): string {
  const ids = page.options.map((o) => o.id);
  return ids.includes('exact') ? 'exact' : (ids.find((x) => x !== 'print') ?? ids[0]);
}

/** A model id, or a size id without its option (<part>--<size>): then the real-thread option where the size has one. */
export function resolveModel(id: string): { entry: Entry } | { error: string; options?: string[] } {
  const exact = entryOf(id);
  if (exact) return { entry: exact };
  const m = /^([a-z0-9-]+?)--([a-z0-9_-]+)$/.exec(id);
  if (m && !id.includes('---')) {
    const same = allEntries().filter((e) => e.item.slug === m[1] && e.page.id === m[2]);
    if (same.length) return { entry: same.find((e) => e.opt.id === 'exact') ?? same.find((e) => e.opt.id === imageOption(e.page)) ?? same[0] };
  }
  const p = /^([a-z0-9-]+?)--([a-z0-9_-]+?)--[a-z0-9-]+$/.exec(id);
  const options = p ? allEntries().filter((e) => e.item.slug === p[1] && e.page.id === p[2]).map((e) => modelId(e.item.slug, e.page.id, e.opt.id)) : [];
  return { error: `No model «${id}».`, ...(options.length ? { options } : {}) };
}

const THREAD_LABEL: Record<string, Record<Locale, string>> = {
  exact: { en: 'real helical thread', ru: 'настоящая винтовая резьба', pl: 'gwint rzeczywisty (śrubowy)' },
  cosmetic: { en: 'cosmetic thread (plain cylinder)', ru: 'косметическая резьба (гладкий цилиндр)', pl: 'gwint kosmetyczny (gładki walec)' },
  print: { en: 'real thread with an FDM print allowance', ru: 'настоящая резьба с зазором для FDM-печати', pl: 'gwint rzeczywisty z luzem do druku FDM' },
};

const IMG_NOTE: Record<Locale, (def: string, this_: string) => string> = {
  en: (d, t) => `The picture shows this size's default option (${d}), not the ${t} option; the 3D view shows this option's own GLB.`,
  ru: (d, t) => `Картинка показывает исполнение этого размера по умолчанию (${d}), а не «${t}»; 3D-просмотр показывает GLB именно этого исполнения.`,
  pl: (d, t) => `Obraz pokazuje domyślną opcję tego rozmiaru (${d}), nie „${t}”; podgląd 3D pokazuje GLB tej właśnie opcji.`,
};
const FAMILY_NOTE: Record<Locale, string> = {
  en: 'The picture shows a representative size of the family, not this size.',
  ru: 'Картинка показывает типовой размер семейства, а не этот размер.',
  pl: 'Obraz pokazuje typowy rozmiar rodziny, nie ten rozmiar.',
};

/** Everything the view shows of one model — taken from its catalogue record, nothing added. */
export function viewerModel(e: Entry, locale: Locale) {
  const r = record(e, locale, true);
  const files = r.files.filter((f) => f.url.startsWith(FREE_FILES));
  const glb = files.find((f) => f.format === 'glb') ?? null;
  const imgOpt = imageOption(e.page);
  const sizeImage = r.image.url.startsWith(FREE_FILES);
  const shows = sizeImage && imgOpt === e.opt.id;
  const optLabel = (id: string) => e.page.options.find((o) => o.id === id)?.label[locale] || id;
  const fam = (r.family as { name: string }).name;
  // short labels for tabs and 3D labels: the family's short name and the size — or, when a size's label is a long
  // description (the example shafts), its diameter and length from the overall size
  const short = e.item.short?.[locale] ?? fam;
  const ov = (r.dimensions as { overall_mm?: number[] }).overall_mm;
  const tag = r.size.label.length <= 18 || !ov ? r.size.label : `Ø${Math.max(ov[1], ov[2])} × ${ov[0]}`;
  return {
    id: r.id,
    name: r.name,
    family: fam,
    short,
    tag,
    label: `${short} ${tag}`,
    url: r.url,
    viewer_url: r.page_url,
    standard: r.standard ? { id: r.standard.id, title: r.standard.title } : null,
    size: r.size.label,
    option: { id: e.opt.id, label: r.option.label },
    thread: r.thread
      ? {
          type: r.thread.type,
          label: THREAD_LABEL[r.thread.type]?.[locale] ?? r.thread.type,
          pitch_mm: (r.dimensions as { thread_pitch_mm?: number }).thread_pitch_mm ?? null,
          ...('print_allowance_mm_per_side' in r.thread ? { print_allowance_mm_per_side: r.thread.print_allowance_mm_per_side } : {}),
        }
      : null,
    dimensions: r.dimensions,
    mass_kg: r.mass.kg,
    bodies: r.bodies,
    checks: { kernel: r.verification.geometry.kernel_body_report, step_read_back: r.verification.geometry.step_read_back },
    glb: glb ? { url: glb.url, bytes: glb.bytes, sha256: glb.sha256 ?? null, option: e.opt.id } : null,
    image: {
      url: r.image.url,
      option: sizeImage ? imgOpt : null,
      shows_this_option: shows,
      note: shows ? null : sizeImage ? IMG_NOTE[locale](optLabel(imgOpt), r.option.label ?? e.opt.id) : FAMILY_NOTE[locale],
    },
    options: e.page.options.map((o) => {
      const oe = allEntries().find((x) => x.item.slug === e.item.slug && x.page.id === e.page.id && x.opt.id === o.id);
      const og = oe ? record(oe, locale).files.find((f) => f.format === 'glb' && f.url.startsWith(FREE_FILES)) : undefined;
      return { id: modelId(e.item.slug, e.page.id, o.id), option: o.id, label: o.label[locale] || o.id, glb: og ? og.url : null };
    }),
    files: files.map((f) => ({ format: f.format, url: f.url, download_url: f.download_url, bytes: f.bytes, sha256: f.sha256 ?? null })),
    license: r.license,
  };
}

export type ViewerModel = ReturnType<typeof viewerModel>;

/** The text a host without MCP Apps shows (and the model reads): characteristics, picture, files, the site's 3D view. */
export function viewerText(models: ViewerModel[], locale: Locale): string {
  const L = {
    en: { std: 'Standard', size: 'Size', pitch: 'Thread pitch', thread: 'Thread', view: '3D view on the Monge site', pic: 'Picture (WebP)', files: 'Files', ui: 'Interactive 3D viewer attached (MCP Apps). Without it, open the 3D view on the Monge site.' },
    ru: { std: 'Стандарт', size: 'Размер', pitch: 'Шаг резьбы', thread: 'Резьба', view: '3D-просмотр на сайте Monge', pic: 'Изображение (WebP)', files: 'Файлы', ui: 'Приложен интерактивный 3D-просмотр (MCP Apps). Если его нет — откройте 3D-просмотр на сайте Monge.' },
    pl: { std: 'Norma', size: 'Rozmiar', pitch: 'Skok gwintu', thread: 'Gwint', view: 'Podgląd 3D na stronie Monge', pic: 'Obraz (WebP)', files: 'Pliki', ui: 'Dołączono interaktywny podgląd 3D (MCP Apps). Bez niego otwórz podgląd 3D na stronie Monge.' },
  }[locale];
  const blocks = models.map((m) => {
    const lines = [`${m.name} (${m.id})`];
    const facts = [m.standard ? `${L.std}: ${m.standard.id}` : null, `${L.size}: ${m.size}`, m.thread?.pitch_mm != null ? `${L.pitch}: ${m.thread.pitch_mm} mm` : null, m.thread ? `${L.thread}: ${m.thread.type} — ${m.thread.label}` : null].filter(Boolean);
    lines.push(facts.join(' · '));
    lines.push(`${L.view}: ${m.viewer_url}?option=${m.option.id}`);
    lines.push(`${L.pic}: ${m.image.url}${m.image.note ? ` — ${m.image.note}` : ''}`);
    lines.push(`${L.files}: ${m.files.map((f) => `${f.format.toUpperCase()} ${f.url} (${f.bytes} B${f.sha256 ? `, SHA-256 ${f.sha256}` : ''})`).join('; ')}`);
    return lines.join('\n');
  });
  return `${L.ui}\n\n${blocks.join('\n\n')}`;
}

export const viewerCatalog = () => CATALOG.version;
