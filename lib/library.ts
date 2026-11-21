import { getEnv } from '@/lib/cf';
import type { Locale } from '@/lib/i18n';
import seedJson from '@/data/library.json';
import type { Dimension } from '@/components/ModelViewer';

export type Category = 'reinforcement' | 'fasteners' | 'bearings' | 'shafts';
export const categories: Category[] = ['reinforcement', 'fasteners', 'bearings', 'shafts'];

type L10n = Record<Locale, string>;

export type LibraryFile = {
  format: 'GLB' | 'STEP' | 'STL' | 'DXF' | 'PDF';
  /** Public URL (under /library or /api/files) for free files, an R2 key for Pro files. */
  href: string;
  access: 'free' | 'pro';
  sizeKb?: number;
};

export type LibraryItem = {
  slug: string;
  category: Category;
  title: L10n;
  summary: L10n;
  material: L10n;
  dimensions: string;
  massKg?: number;
  faces?: number;
  version: string;
  image: string;
  model?: string;
  /** Viewer surface: "steel" for stainless products, "satin" for cast/machined parts. */
  finish?: 'steel' | 'satin' | 'source';
  view?: [number, number];
  /** Model rotation in degrees (x, y, z) for the viewer. */
  rotate?: [number, number, number];
  /** Overall dimensions drawn by the viewer (model millimetres). */
  dims?: Dimension[];
  files: LibraryFile[];
  updated: string;
  /** A parametric generator of the Monge library: the standards tables it builds by (ids of lib/standards). */
  standards?: string[];
  /** Its parameters as the program offers them: name and the values or range. */
  params?: { name: L10n; values: string | L10n }[];
  /** Ready configurations in the program's catalogue. */
  configs?: number;
  /** Which configuration the 3D model and the render show. */
  shown?: L10n;
  /** The configuration the download panel opens on (an id of data/downloads.json). */
  defaultConfig?: string;
};

/* Built-in catalogue (data/library.json). It is also the seed of the D1 table
   (npm run db:seed) and the fallback while the database is empty or unreachable. */
export const seedItems = seedJson as unknown as LibraryItem[];

type Row = { slug: string; data: string; published: number };

/** Published items. The built-in catalogue (data/library.json) says WHICH items exist — only the parts of the Monge
    library; a D1 row may change an item's text or hide it (published = 0), but a row whose item left the catalogue
    is not shown. Without the database — the catalogue. */
export async function getItems(): Promise<LibraryItem[]> {
  const { DB } = await getEnv();
  if (DB) {
    try {
      const { results } = await DB.prepare('SELECT slug, data, published FROM items').all<Row>();
      const rows = new Map(results.map((r) => [r.slug, r]));
      const items: LibraryItem[] = [];
      for (const seed of seedItems) {
        const r = rows.get(seed.slug);
        if (!r) items.push(seed);
        else if (r.published === 1) items.push({ ...seed, ...(JSON.parse(r.data) as LibraryItem) });
      }
      return items;
    } catch (error) {
      console.warn('[library] D1 unavailable, using the built-in catalogue', error);
    }
  }
  return seedItems;
}

export async function getItem(slug: string): Promise<LibraryItem | undefined> {
  const items = await getItems();
  return items.find((i) => i.slug === slug);
}

export function formatsOf(item: LibraryItem): string[] {
  return Array.from(new Set(item.files.map((f) => f.format)));
}
