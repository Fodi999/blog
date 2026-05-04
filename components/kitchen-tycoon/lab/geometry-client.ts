/**
 * kitchen-tycoon/lab/geometry-client.ts
 *
 * Single gateway to the Rust backend for all 3D geometry operations.
 * No other file may call fetch() for geometry — route everything here.
 *
 * Lifted (almost verbatim) from the legacy studio/engine/geometry-client.ts
 * and rebound to a self-contained type set under kitchen-tycoon/lab.
 *
 * Exports:
 *   BACKEND_BASE                          — production Rust API base URL
 *   buildShapeUrl(obj)                    — URL for debug-glb (parametric)
 *   buildSlugUrl(slug)                    — URL for debug-glb by slug
 *   buildProductGlbUrl(productId)         — URL for v2 product GLB
 *   createBackendObject(kind, opts)       — async: fetch GLB → SceneObject
 *   submitGeometryOp(op)                  — POST geometry-op → GLB URL
 */

import {
  createSceneObject,
  type SceneObject,
  type SpawnShape,
  type GeometryOpCommand,
} from './types';

// ── Backend base URL ──────────────────────────────────────────────────────────

export const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';

// ── Shape slug map ────────────────────────────────────────────────────────────

const SHAPE_SLUG: Record<SpawnShape, string> = {
  cube:      'shape_cube',
  sphere:    'shape_sphere',
  cylinder:  'shape_cylinder',
  cone:      'shape_cone',
  torus:     'shape_torus',
  square:    'shape_square',
  rectangle: 'shape_rectangle',
  circle:    'shape_circle',
  triangle:  'shape_triangle',
  line:      'shape_line',
};

// ── URL builders ──────────────────────────────────────────────────────────────

export function buildShapeUrl(obj: SceneObject): string {
  const base = `${BACKEND_BASE}/api/laboratory/debug-glb/${SHAPE_SLUG[obj.kind]}`;
  const s = obj.shape;
  switch (s.kind) {
    case 'cube': {
      const params = new URLSearchParams({ subdivisions: String(s.subdivisions) });
      if (s.bevelRadius && s.bevelRadius > 0) {
        params.set('bevel_radius', s.bevelRadius.toFixed(4));
      }
      return `${base}?${params.toString()}`;
    }
    case 'cylinder':
      return `${base}?radius=${s.radius.toFixed(3)}&height=${s.height.toFixed(3)}`;
    case 'cone':
      return `${base}?radius=${s.radius.toFixed(3)}&radius_top=${s.radius_top.toFixed(3)}&height=${s.height.toFixed(3)}`;
    case 'torus':
      return `${base}?major_radius=${s.major_radius.toFixed(3)}&minor_radius=${s.minor_radius.toFixed(3)}`;
    default:
      return base;
  }
}

/** Build a debug-glb URL directly from slug (asset previews / kitchen equipment). */
export function buildSlugUrl(slug: string): string {
  return `${BACKEND_BASE}/api/laboratory/debug-glb/${slug}`;
}

/** Build the v2 product GLB endpoint URL. */
export function buildProductGlbUrl(productId: string): string {
  return `${BACKEND_BASE}/api/laboratory/v2/products/${productId}/glb`;
}

// ── Async: fetch a backend-rendered SceneObject ───────────────────────────────

export interface BackendObjectOpts {
  label?: string;
  color?: string;
  /** Pass a custom slug if different from the default SpawnShape slug. */
  slug?: string;
}

/**
 * Full flow:
 *   1. Build the GLB URL for this shape kind (or custom slug)
 *   2. Probe reachability via HEAD (skipped during SSR; non-fatal)
 *   3. Return a SceneObject with glbUrl pre-set
 */
export async function createBackendObject(
  kind: SpawnShape,
  opts: BackendObjectOpts = {},
): Promise<SceneObject> {
  const slug = opts.slug ?? SHAPE_SLUG[kind];
  const glbUrl = `${BACKEND_BASE}/api/laboratory/debug-glb/${slug}`;

  if (typeof window !== 'undefined') {
    const probe = await fetch(glbUrl, { method: 'HEAD' }).catch(() => null);
    if (probe && !probe.ok) {
      console.warn(`[geometry-client] GLB not found for slug "${slug}" (${probe.status})`);
    }
  }

  return createSceneObject(kind, { label: opts.label, color: opts.color, glbUrl });
}

// ── Geometry operations (CSG via backend) ─────────────────────────────────────

/**
 * POST /api/laboratory/geometry-op
 * Submits a CSG op (subtract / union) to the Rust backend; returns the GLB URL.
 */
export async function submitGeometryOp(op: GeometryOpCommand): Promise<string> {
  const res = await fetch(`${BACKEND_BASE}/api/laboratory/geometry-op`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(op),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`geometry-op failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { glb_url?: string; url?: string };
  const url = json.glb_url ?? json.url;
  if (!url) throw new Error('geometry-op: no glb_url in response');
  return url;
}
