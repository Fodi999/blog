/**
 * kitchen-tycoon/lab/types.ts
 *
 * Minimal type set used by the backend geometry gateway.
 * Lifted from the legacy studio/core/types.ts — only what
 * geometry-client.ts and object-factory.ts actually need.
 */

export type Vec3 = [number, number, number];
export type Euler = [number, number, number];

export type Transform = {
  position: Vec3;
  rotation: Euler;
  scale: Vec3;
};

export const IDENTITY_TRANSFORM: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

export type SpawnShape =
  | 'cube' | 'sphere' | 'cylinder' | 'cone' | 'torus'
  | 'square' | 'rectangle' | 'circle' | 'triangle' | 'line';

export type ShapeParams =
  | { kind: 'cube'; subdivisions: number; dimensions?: { w: number; h: number; d: number }; bevelRadius?: number }
  | { kind: 'sphere' }
  | { kind: 'cylinder';  radius: number; height: number }
  | { kind: 'cone';      radius: number; radius_top: number; height: number }
  | { kind: 'torus';     major_radius: number; minor_radius: number }
  | { kind: 'square' }
  | { kind: 'rectangle' }
  | { kind: 'circle' }
  | { kind: 'triangle' }
  | { kind: 'line' };

export type Material = {
  color_hex: string;
  metalness?: number;
  roughness?: number;
};

export type SceneObject = {
  id: string;
  kind: SpawnShape;
  label: string;
  transform: Transform;
  shape: ShapeParams;
  material: Material;
  glbUrl?: string;
};

/** CSG operation submitted to /api/laboratory/geometry-op. */
export type GeometryOpCommand = {
  operation: 'subtract' | 'union';
  target: {
    type: string;
    color?: string;
    subdivisions?: number;
    bevel?: number;
  };
  cutter: {
    type: 'cylinder' | 'box' | 'sphere' | string;
    radius?: number;
    height?: number;
    half_extents?: Vec3;
    center?: Vec3;
    cap_color?: string;
  };
  quality?: 'draft' | 'standard' | 'high' | 'ultra';
  label?: string;
};

export function defaultShapeParams(kind: SpawnShape): ShapeParams {
  switch (kind) {
    case 'cube':      return { kind: 'cube', subdivisions: 2 };
    case 'cylinder':  return { kind: 'cylinder', radius: 0.5, height: 1.0 };
    case 'cone':      return { kind: 'cone', radius: 0.5, radius_top: 0.0, height: 1.0 };
    case 'torus':     return { kind: 'torus', major_radius: 0.5, minor_radius: 0.15 };
    case 'sphere':    return { kind: 'sphere' };
    case 'square':    return { kind: 'square' };
    case 'rectangle': return { kind: 'rectangle' };
    case 'circle':    return { kind: 'circle' };
    case 'triangle':  return { kind: 'triangle' };
    case 'line':      return { kind: 'line' };
  }
}

export function generateId(prefix = 'obj'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export interface CreateObjectOpts {
  id?: string;
  label?: string;
  color?: string;
  glbUrl?: string;
}

/** Pure factory — no fetch, no side-effects. */
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
    glbUrl: opts.glbUrl,
  };
}
