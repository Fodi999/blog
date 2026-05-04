/**
 * studio/engine/object-factory.ts
 *
 * Pure (no fetch, no side-effects) factory for SceneObject values.
 * Used by scene-store and command-runner — they must never import
 * from geometry-client directly.
 */

import type { SceneObject, SpawnShape, ShapeParams } from '../core/types';
import { defaultShapeParams } from './mesh-builder';
import { IDENTITY_TRANSFORM } from '../core/types';

// ── ID generator ──────────────────────────────────────────────────────────────

export function generateId(prefix = 'obj'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Scene object factory ──────────────────────────────────────────────────────

export interface CreateObjectOpts {
  id?: string;
  label?: string;
  color?: string;
  /** Pre-resolved GLB URL from the backend (set by geometry-client). */
  glbUrl?: string;
}

/**
 * Create a SceneObject value in-memory.
 * No backend calls — pure data construction.
 */
export function createSceneObject(
  kind: SpawnShape,
  opts: CreateObjectOpts = {},
): SceneObject {
  return {
    id: opts.id ?? generateId(kind),
    kind,
    label: opts.label ?? kind,
    transform: { ...IDENTITY_TRANSFORM },
    shape: defaultShapeParams(kind),
    material: { color_hex: opts.color ?? '#b0b8c8' },
    visible: true,
    locked: false,
    glbUrl: opts.glbUrl,
  };
}

// ── Patch helper ──────────────────────────────────────────────────────────────

/**
 * Return a new SceneObject with shallow-merged patch.
 * Nested transform / shape / material are also shallow-merged.
 * Pure — no mutations.
 */
export function patchSceneObject(
  obj: SceneObject,
  patch: Partial<SceneObject>,
): SceneObject {
  return {
    ...obj,
    ...patch,
    transform: patch.transform ? { ...obj.transform, ...patch.transform } : obj.transform,
    shape: patch.shape ? ({ ...obj.shape, ...patch.shape } as ShapeParams) : obj.shape,
    material: patch.material ? { ...obj.material, ...patch.material } : obj.material,
  };
}
