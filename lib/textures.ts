import data from '@/data/textures.json';

/* The Monge texture library: surfaces made by Monge's own procedural generator (cad_materials::procedural in the Monge
   repo), packed by scripts/textures/package.py. Files live in R2 under textures/<slug>/<version>/ and are served by
   /api/files like the library's models. Only own textures are listed: no photo, scan or downloaded set. */

export type TextureFile = {
  res: '1k' | '2k' | '4k';
  px: number;
  key: string;
  bytes: number;
  sha256: string;
  octaves: number;
  generate_ms: number;
  write_ms: number;
  rough_avg: number;
  relief_um: number;
};

export type Texture = {
  slug: string;
  version: string;
  name: string;
  category: string;
  tile_mm: number;
  base: [number, number, number];
  metal: number;
  rough_avg: number;
  normal_rms: number;
  files: TextureFile[];
  assets: { normal_gl: string; roughness: string; render_monge: string; render_three: string; tile: string };
};

export const textures = data as Texture[];

export const textureOf = (slug: string): Texture | undefined => textures.find((t) => t.slug === slug);

/** The URL a key is served at (same origin, R2 through /api/files). */
export const fileUrl = (key: string, download = false) => `/api/files/${key}${download ? '?download=1' : ''}`;

/** SHA-256 (hex) of a texture archive by its R2 key, for Repr-Digest. */
export function textureSha(key: string): string | undefined {
  return textures.flatMap((t) => t.files).find((f) => f.key === key)?.sha256;
}

export const fmtBytes = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.round(n / 1e3)} KB`);
