import { getEnv } from '@/lib/cf';
import type { Locale } from '@/lib/i18n';
import seedJson from '@/data/library.json';

export type Category = 'stainless' | 'precision' | 'fasteners';
export const categories: Category[] = ['stainless', 'precision', 'fasteners'];

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
  files: LibraryFile[];
  updated: string;
};

/* Built-in catalogue (data/library.json). It is also the seed of the D1 table
   (npm run db:seed) and the fallback while the database is empty or unreachable. */
export const seedItems = seedJson as unknown as LibraryItem[];

type Row = { data: string };

/** Published items: from D1 when the database has rows, otherwise the built-in catalogue. */
export async function getItems(): Promise<LibraryItem[]> {
  const { DB } = await getEnv();
  if (DB) {
    try {
      const { results } = await DB.prepare('SELECT data FROM items WHERE published = 1 ORDER BY sort, slug').all<Row>();
      const items = results.map((r) => JSON.parse(r.data) as LibraryItem).filter((i) => i && i.slug);
      if (items.length > 0) return items;
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
