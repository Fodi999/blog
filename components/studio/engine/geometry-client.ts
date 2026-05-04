/**
 * studio/engine/geometry-client.ts
 *
 * API calls to the Rust backend for GLB generation and CSG operations.
 * All URL building lives here — no hardcoded URLs in components.
 */

import type { SceneObject, SpawnShape, ShapeParams, GeometryOpCommand } from '../core/types';
import { defaultShapeParams } from './mesh-builder';

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
 * Build the GLB debug endpoint URL for a given SceneObject.
 * Parametric: cube subdivisions, cylinder radius/height, etc.
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

/** Build a debug-glb URL directly from slug (for previews, assets panel). */
export function buildSlugUrl(slug: string): string {
  return `${BACKEND_BASE}/api/laboratory/debug-glb/${slug}`;
}

// ── Scene object factory ──────────────────────────────────────────────────────

export function createSceneObject(
  kind: SpawnShape,
  opts: { label?: string; color?: string } = {},
): SceneObject {
  return {
    id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kind,
    label: opts.label ?? kind,
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    shape: defaultShapeParams(kind),
    material: { color_hex: opts.color ?? '#b0b8c8' },
    visible: true,
    locked: false,
  };
}

/** Shallow merge utility — handles nested transform/shape/material. */
export function patchSceneObject(obj: SceneObject, patch: Partial<SceneObject>): SceneObject {
  return {
    ...obj,
    ...patch,
    transform: patch.transform ? { ...obj.transform, ...patch.transform } : obj.transform,
    shape:     patch.shape     ? ({ ...obj.shape, ...patch.shape } as ShapeParams) : obj.shape,
    material:  patch.material  ? { ...obj.material, ...patch.material } : obj.material,
  };
}

// ── Geometry operations (CSG) ─────────────────────────────────────────────────

/** Submit a CSG operation to the backend and return the resulting GLB URL. */
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
