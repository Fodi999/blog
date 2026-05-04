/**
 * studio/core/types.ts
 *
 * Single source of truth for all domain types used across the Studio.
 * Import from here — never from scattered component files.
 */

// ── Primitives ──────────────────────────────────────────────────────────────

export type Vec3 = [number, number, number];
export type Euler = [number, number, number]; // XYZ radians

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

// ── Shapes ──────────────────────────────────────────────────────────────────

export type SpawnShape =
  | 'cube' | 'sphere' | 'cylinder' | 'cone' | 'torus'
  | 'square' | 'rectangle' | 'circle' | 'triangle' | 'line';

/** Discriminated union — each kind carries only its own parameters. */
export type ShapeParams =
  | { kind: 'cube';      subdivisions: number }
  | { kind: 'sphere' }
  | { kind: 'cylinder';  radius: number; height: number }
  | { kind: 'cone';      radius: number; radius_top: number; height: number }
  | { kind: 'torus';     major_radius: number; minor_radius: number }
  | { kind: 'square' }
  | { kind: 'rectangle' }
  | { kind: 'circle' }
  | { kind: 'triangle' }
  | { kind: 'line' };

// ── Materials ────────────────────────────────────────────────────────────────

export type MaterialPreset = 'metallic' | 'ceramic' | 'glass' | 'plastic' | 'wood' | 'custom';

export type Material = {
  color_hex: string;
  preset?: MaterialPreset;
  metalness?: number;   // 0..1
  roughness?: number;   // 0..1
};

// ── Scene object ─────────────────────────────────────────────────────────────

export type SceneObject = {
  id: string;
  kind: SpawnShape;
  label: string;
  transform: Transform;
  shape: ShapeParams;
  material: Material;
  /** Optional: locked objects can't be selected or moved */
  locked?: boolean;
  /** Optional: hidden objects are invisible and unselectable */
  visible?: boolean;
  /**
   * Pre-resolved GLB URL returned by the Rust backend.
   * Set by geometry-client BEFORE the object enters the store.
   * If absent, GlbObject builds the URL via buildShapeUrl().
   */
  glbUrl?: string;
};

// ── Selection ────────────────────────────────────────────────────────────────

/** Plasticity-style sub-element picking mode */
export type SelectionMode = 'object' | 'face' | 'edge' | 'vertex';

export type FaceSelection = {
  objectId: string;
  normalKey: string;            // e.g. "1,0,0"
  centerLocal: Vec3;
};

export type EdgeSelection = {
  objectId: string;
  a: Vec3;
  b: Vec3;
};

export type VertexSelection = {
  objectId: string;
  position: Vec3;
};

export type SubSelection =
  | { mode: 'face';   data: FaceSelection }
  | { mode: 'edge';   data: EdgeSelection }
  | { mode: 'vertex'; data: VertexSelection };

// ── Transform tools ──────────────────────────────────────────────────────────

export type TransformMode = 'select' | 'translate' | 'rotate' | 'scale';

// ── Viewport ─────────────────────────────────────────────────────────────────

export type ViewMode = 'solid' | 'wire' | 'solid-wire';
export type RenderQuality = 'low' | 'sd' | 'hd' | 'ultra';
export type LightingPreset = 'softFood' | 'cleanProduct' | 'studio' | 'outdoor';

// ── Scene document (persistable) ─────────────────────────────────────────────

export const SCENE_STORAGE_KEY = 'chef-lab-scene-v1';

export type SceneDocument = {
  version: 1;
  unit: 'm' | 'cm' | 'mm';
  objects: SceneObject[];
  selectedId?: string | null;
  view?: {
    mode: ViewMode;
    gridSize: number;
  };
  updatedAt: string; // ISO-8601
};

export function isSceneDocument(value: unknown): value is SceneDocument {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (v.version !== 1) return false;
  if (!Array.isArray(v.objects)) return false;
  for (const obj of v.objects as unknown[]) {
    if (!obj || typeof obj !== 'object') return false;
    const o = obj as Record<string, unknown>;
    if (typeof o.id !== 'string' || typeof o.kind !== 'string') return false;
    if (!o.transform || !o.shape || !o.material) return false;
  }
  return true;
}

// ── Geometry operations (CSG via backend) ────────────────────────────────────

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
