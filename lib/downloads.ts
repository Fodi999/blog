import type { Locale } from '@/lib/i18n';
import data from '@/data/downloads.json';

/* The ready configurations of the library's generators as downloadable files (R2, under downloads/). Written by
   scripts/downloads-json.py from the export of the Monge test window: every configuration is placed by the
   program, its body checked by the kernel, its STEP read back and compared, its STL checked closed. */

export type DlFormat = 'step' | 'stl' | '3mf' | 'glb';

export type DlConfig = {
  id: string;
  name: Record<Locale, string>;
  /** Overall size of the file as printed (Z up), mm, largest first. */
  sizeMm: number[];
  /** Steel 7850 kg/m³ × the mesh volume. */
  massKg: number;
  bodies: number;
  files: Record<DlFormat, { key: string; bytes: number }>;
  checks: { kernel: boolean; step: boolean; stl: boolean };
};

const all = data as unknown as Record<string, { checked: string; version: string; configs: DlConfig[] }>;

export function downloadsOf(slug: string) {
  return all[slug];
}

export const totalConfigs = Object.values(all).reduce((n, x) => n + x.configs.length, 0);
