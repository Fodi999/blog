/**
 * studio/engine/geometry-client.ts
 *
 * Single gateway to the Rust backend for all 3D geometry operations.
 * No other file may call fetch() for geometry — route everything here.
 *
 * Exports:
 *   buildShapeUrl(obj)                    — URL for debug-glb (parametric)
 *   buildSlugUrl(slug)                    — URL for debug-glb by slug
 *   buildProductGlbUrl(productId)         — URL for v2 product GLB
 *   createBackendStudioObject(kind, opts) — async: fetch GLB → create SceneObject
 *   submitGeometryOp(op)                  — POST geometry-op → GLB URL
 */

import type { SceneObject, SpawnShape, GeometryOpCommand } from '../core/types';
import { createSceneObject } from './object-factory';

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

/**
 * Build the parametric debug-glb URL for a SceneObject.
 * Called by GlbObject when glbUrl is not pre-set on the object.
 */
export function buildShapeUrl(obj: SceneObject): string {
  const base = `${BACKEND_BASE}/api/laboratory/debug-glb/${SHAPE_SLUG[obj.kind]}`;
  const s = obj.shape;
  switch (s.kind) {
    case 'cube':
      return `${base}?subdivisions=${s.subdivisions}`;
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

/** Build a debug-glb URL directly from slug (asset panel previews). */
export function buildSlugUrl(slug: string): string {
  return `${BACKEND_BASE}/api/laboratory/debug-glb/${slug}`;
}

/** Build the v2 product GLB endpoint URL. */
export function buildProductGlbUrl(productId: string): string {
  return `${BACKEND_BASE}/api/laboratory/v2/products/${productId}/glb`;
}

// ── Async: create a SceneObject backed by a Rust-generated GLB ────────────────

export interface BackendObjectOpts {
  label?: string;
  color?: string;
  /** Pass a custom slug if different from the default SpawnShape slug. */
  slug?: string;
}

/**
 * Full flow:
 *   1. Build the GLB URL for this shape kind (or custom slug)
 *   2. Optionally verify it is reachable (HEAD request; skipped in SSR)
 *   3. Return a SceneObject with glbUrl pre-set
 *
 * The returned object is ready to pass to:
 *   commandRunner.run(makeAddCommand(obj))
 *
 * The store NEVER calls this. It stays pure.
 */
export async function createBackendStudioObject(
  kind: SpawnShape,
  opts: BackendObjectOpts = {},
): Promise<SceneObject> {
  const slug = opts.slug ?? SHAPE_SLUG[kind];
  const glbUrl = `${BACKEND_BASE}/api/laboratory/debug-glb/${slug}`;

  // Probe reachability on the client only (non-fatal)
  if (typeof window !== 'undefined') {
    const probe = await fetch(glbUrl, { method: 'HEAD' }).catch(() => null);
    if (probe && !probe.ok) {
      console.warn(`[geometry-client] GLB not found for slug "${slug}" (${probe.status})`);
    }
  }

  return createSceneObject(kind, { label: opts.label, color: opts.color, glbUrl });
}

// ── Geometry operations (CSG) ─────────────────────────────────────────────────

/**
 * POST /api/laboratory/geometry-op
 *
 * Submits a CSG operation (subtract / union) to the Rust backend
 * and returns the resulting GLB URL.
 *
 * Caller flow:
 *   const glbUrl = await submitGeometryOp(op);
 *   const obj = createSceneObject(kind, { glbUrl });
 *   commandRunner.run(makeAddCommand(obj));
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
  const json = await res.json() as { glb_url?: string; url?: string };
  const url = json.glb_url ?? json.url;
  if (!url) throw new Error('geometry-op: no glb_url in response');
  return url;
}
