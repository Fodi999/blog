'use client';

/**
 * Workspace command bus — small typed event channel that lets the
 * Copilot (or any other surface) drive the active visual scene.
 *
 * Example:
 *   const { dispatch } = useWorkspaceCommands();
 *   dispatch({ type: 'highlight_risks' });
 *
 * Inside a scene:
 *   useWorkspaceCommand((cmd) => {
 *     if (cmd.type === 'focus_item') zoomTo(cmd.itemId);
 *   });
 *
 * This is intentionally tiny — no global store, just a ref-counted
 * subscriber list scoped to the AppShell.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

export type SpawnShape =
  | 'square'
  | 'circle'
  | 'triangle'
  | 'cube'
  | 'sphere'
  | 'rectangle'
  | 'line'
  | 'cylinder'
  | 'cone'
  | 'torus';

// ── Parametric scene graph ──────────────────────────────────────────────────
//
// A `SceneObject` is the canonical, *persistable* representation of one item in
// the workspace. The viewport renders it; the inspector edits it; the Copilot
// emits patches over it; future save/load + undo/redo serialize it.
//
// Anything not stored here cannot be reproduced — so all parameters live on the
// object, not on the React component that happens to display it right now.

export type Vec3 = [number, number, number];

export type Transform = {
  position: Vec3;
  rotation: Vec3; // Euler XYZ in radians
  scale: Vec3;
};

export type Material = {
  color_hex: string;
};

/** Discriminated union of per-kind shape parameters. */
export type ShapeParams =
  | { kind: 'cube'; subdivisions: number }
  | { kind: 'sphere' }
  | { kind: 'cylinder'; radius: number; height: number }
  | { kind: 'cone'; radius: number; radius_top: number; height: number }
  | { kind: 'torus'; major_radius: number; minor_radius: number }
  | { kind: 'square' }
  | { kind: 'rectangle' }
  | { kind: 'circle' }
  | { kind: 'triangle' }
  | { kind: 'line' };

export type SceneObject = {
  id: string;
  kind: SpawnShape;
  label: string;
  transform: Transform;
  shape: ShapeParams;
  material: Material;
};

export const IDENTITY_TRANSFORM: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

export function defaultShapeParams(kind: SpawnShape): ShapeParams {
  switch (kind) {
    case 'cube':     return { kind: 'cube', subdivisions: 2 };
    case 'cylinder': return { kind: 'cylinder', radius: 0.5, height: 1.0 };
    case 'cone':     return { kind: 'cone', radius: 0.5, radius_top: 0.0, height: 1.0 };
    case 'torus':    return { kind: 'torus', major_radius: 0.5, minor_radius: 0.15 };
    case 'sphere':   return { kind: 'sphere' };
    case 'square':   return { kind: 'square' };
    case 'rectangle':return { kind: 'rectangle' };
    case 'circle':   return { kind: 'circle' };
    case 'triangle': return { kind: 'triangle' };
    case 'line':     return { kind: 'line' };
  }
}

/** Map frontend kind → backend dispatcher slug. Single source of truth. */
const SHAPE_SLUG: Record<SpawnShape, string> = {
  cube: 'shape_cube',
  sphere: 'shape_sphere',
  cylinder: 'shape_cylinder',
  cone: 'shape_cone',
  torus: 'shape_torus',
  square: 'shape_square',
  rectangle: 'shape_rectangle',
  circle: 'shape_circle',
  triangle: 'shape_triangle',
  line: 'shape_line',
};

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';

/**
 * Pure URL builder: SceneObject → debug-glb endpoint with shape-specific query
 * params. Used by the viewport and (later) by the AI command pipeline.
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

/** Factory: build a fresh SceneObject with default transform/params. */
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
    material: { color_hex: opts.color ?? '#38bdf8' },
  };
}

/** Shallow merge utility for partial updates from inspector / AI commands. */
export function patchSceneObject(obj: SceneObject, patch: Partial<SceneObject>): SceneObject {
  return {
    ...obj,
    ...patch,
    transform: patch.transform ? { ...obj.transform, ...patch.transform } : obj.transform,
    shape:     patch.shape     ? ({ ...obj.shape, ...patch.shape } as ShapeParams) : obj.shape,
    material:  patch.material  ? { ...obj.material, ...patch.material } : obj.material,
  };
}

export type GeometryOpCommand = {
  operation: 'subtract' | 'union';
  target: {
    type: string;
    color?: string;
    /** Grid subdivisions per face axis (1..5). Higher = smoother bevel. */
    subdivisions?: number;
    /** Corner bevel 0.0 (sharp) … 1.0 (sphere). */
    bevel?: number;
  };
  cutter: {
    type: 'cylinder' | 'box' | 'sphere' | string;
    radius?: number;
    height?: number;
    half_extents?: [number, number, number];
    center?: [number, number, number];
    cap_color?: string;
  };
  quality?: 'draft' | 'standard' | 'high' | 'ultra';
  label?: string;
};

export type WorkspaceCommand =
  | { type: 'highlight_risks' }
  | { type: 'focus_item'; itemId: string }
  | { type: 'clear_focus' }
  | { type: 'set_view'; view: 'data' | 'visual' | 'simulation' }
  /** Spawn a geometric shape in the Lab canvas.
   *  `mode` controls whether the new shape REPLACES the current one (default,
   *  single-object Lab) or APPENDS alongside existing shapes (multi-object scene). */
  | { type: 'spawn_shape'; shape: SpawnShape; label: string; color?: string; mode?: 'replace' | 'append' }
  /** Spawn a CSG geometry operation result (Gemini-controlled).
   *  `mode` works the same as for `spawn_shape`. */
  | { type: 'geometry_op'; op: GeometryOpCommand; mode?: 'replace' | 'append' }
  /** Clear all spawned shapes from the Lab canvas. */
  | { type: 'clear_shapes' }
  /** Switch the active scene to SIM → Lab tab. */
  | { type: 'switch_lab' };

type Listener = (cmd: WorkspaceCommand) => void;

type Ctx = {
  dispatch: (cmd: WorkspaceCommand) => void;
  subscribe: (l: Listener) => () => void;
};

const WorkspaceCmdCtx = createContext<Ctx | null>(null);

export function WorkspaceCommandsProvider({ children }: { children: React.ReactNode }) {
  const listeners = useRef<Set<Listener>>(new Set());

  const dispatch = useCallback((cmd: WorkspaceCommand) => {
    listeners.current.forEach((l) => {
      try {
        l(cmd);
      } catch (e) {
        console.error('[workspace] listener threw', e);
      }
    });
  }, []);

  const subscribe = useCallback((l: Listener) => {
    listeners.current.add(l);
    return () => {
      listeners.current.delete(l);
    };
  }, []);

  const value = useMemo<Ctx>(() => ({ dispatch, subscribe }), [dispatch, subscribe]);
  return <WorkspaceCmdCtx.Provider value={value}>{children}</WorkspaceCmdCtx.Provider>;
}

export function useWorkspaceCommands(): Ctx {
  const ctx = useContext(WorkspaceCmdCtx);
  if (!ctx) {
    // Graceful no-op when used outside a provider — keeps scenes
    // standalone-renderable in storybook / tests.
    return {
      dispatch: () => {},
      subscribe: () => () => {},
    };
  }
  return ctx;
}

/** Subscribe to commands inside a scene. */
export function useWorkspaceCommand(handler: (cmd: WorkspaceCommand) => void) {
  const { subscribe } = useWorkspaceCommands();
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  }, [handler]);
  useEffect(() => subscribe((c) => ref.current(c)), [subscribe]);
}
