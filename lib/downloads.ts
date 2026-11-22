import type { Locale } from '@/lib/i18n';
import data from '@/data/downloads.json';

/* The library as downloadable files (R2, under downloads/). One PAGE per size — its own address
   /library/<slug>/<page> — and on it the OPTIONS that change the geometry (thread cosmetic / real, a bearing's
   seals and balls), each with STEP, STL, 3MF and GLB. Written by scripts/downloads-json.py from the export of the
   Monge test window (scripts/monge): every geometry placed by the program, its body checked by the kernel, its STEP
   read back and compared, its STL checked closed; only what passed is here. */

export type DlFormat = 'step' | 'stl' | '3mf' | 'glb';
export const FORMATS: DlFormat[] = ['step', 'stl', '3mf', 'glb'];

type Text = string | Record<Locale, string>;

export type DlOption = {
  id: string;
  label: Record<Locale, string>;
  /** File sizes in FORMATS order; null — no such file (the print option has no STEP). */
  bytes: (number | null)[];
  /** Overall size as printed (Z up), mm, largest first. */
  sizeMm: number[];
  /** Steel 7850 kg/m³ × the mesh volume. */
  massKg: number;
  bodies: number;
  /** The kernel's report of every body; STEP read back and the same; the STL closed (one body). */
  checks: [boolean, boolean, boolean];
  /** The 3D-printing option: Monge's print check for FDM (nozzle 0.4, layer 0.2, overhangs to 45° / 3 mm) in the way
      it lies on the bed (up "-y" — head down, "y" — as it stands); the least wall, the longest overhang, PLA grams. */
  print?: { ok: boolean; up: string; wall: number; reach: number; overMm2: number; pla: number };
};

export type DlPage = {
  id: string;
  group: Text;
  label: Text;
  /** The standard whose row this size is, and the row's key (size, name or diameter). */
  std?: string | null;
  row?: string | null;
  /** Size in bytes of the render of this size's own geometry (downloads/<slug>/<page>/<slug>-<page>.webp); none — only the family's image. */
  image?: number;
  options: DlOption[];
};

const all = data as unknown as Record<string, { checked: string; version: string; pages: DlPage[] }>;

export function downloadsOf(slug: string) {
  return all[slug];
}

export function pageOf(slug: string, id: string): DlPage | undefined {
  return all[slug]?.pages.find((p) => p.id === id);
}

export function allPages(): { slug: string; page: DlPage }[] {
  return Object.entries(all).flatMap(([slug, v]) => v.pages.map((page) => ({ slug, page })));
}

/** The pages as the browser's configurator needs them: no parameters, facts or checksums (those are for the API). */
export function clientPages(pages: DlPage[]): DlPage[] {
  return pages.map((p) => ({
    id: p.id,
    group: p.group,
    label: p.label,
    ...(p.image ? { image: p.image } : {}),
    options: p.options.map((o) => ({ id: o.id, label: o.label, bytes: o.bytes, sizeMm: o.sizeMm, massKg: o.massKg, bodies: o.bodies, checks: o.checks, ...(o.print ? { print: o.print } : {}) })),
  }));
}

export function text(v: Text, locale: Locale): string {
  return typeof v === 'string' ? v : v[locale];
}

export function fileKey(slug: string, page: string, option: string, f: DlFormat): string {
  return `downloads/${slug}/${page}/${option}/${slug}-${page}-${option}.${f}`;
}

export const totals = {
  pages: Object.values(all).reduce((n, x) => n + x.pages.length, 0),
  geometries: Object.values(all).reduce((n, x) => n + x.pages.reduce((m, p) => m + p.options.length, 0), 0),
};
