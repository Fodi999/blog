/**
 * studio/engine/scene-store.ts
 *
 * Central Zustand store for the Studio scene.
 * One store instance per Studio mount — no global singleton.
 * Create via `createSceneStore()` and inject via React context.
 */

import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  SceneObject,
  SelectionMode,
  TransformMode,
  ViewMode,
  Transform,
  SpawnShape,
  ShapeParams,
  Material,
} from '../core/types';
import { EMPTY_SELECTION, type SelectionState } from '../core/selection';
import { DEFAULT_SNAP, type SnapSettings } from '../core/snapping';
import { cloneTransform } from '../core/transform';
import { createSceneObject, patchSceneObject } from './geometry-client';

// ── State shape ───────────────────────────────────────────────────────────────

export type SceneState = {
  objects: SceneObject[];
  selection: SelectionState;
  transformMode: TransformMode;
  viewMode: ViewMode;
  snap: SnapSettings;
  unit: 'm' | 'cm' | 'mm';
};

export type SceneActions = {
  // Objects
  addObject: (kind: SpawnShape, opts?: { label?: string; color?: string }) => SceneObject;
  removeObject: (id: string) => void;
  patchObject: (id: string, patch: Partial<SceneObject>) => void;
  patchMaterial: (id: string, patch: Partial<Material>) => void;
  patchShape: (id: string, patch: Partial<ShapeParams>) => void;
  commitTransform: (id: string, transform: Transform) => void;
  setObjects: (objects: SceneObject[]) => void;

  // Selection
  selectObject: (id: string | null) => void;
  setSelectionMode: (mode: SelectionMode) => void;

  // Tools
  setTransformMode: (mode: TransformMode) => void;
  setViewMode: (mode: ViewMode) => void;

  // Snap
  setSnapSettings: (patch: Partial<SnapSettings>) => void;

  // Queries
  getObject: (id: string) => SceneObject | undefined;
  getSelected: () => SceneObject | undefined;
};

export type SceneStore = SceneState & SceneActions;

// ── Factory ───────────────────────────────────────────────────────────────────

export function createSceneStore(initial?: Partial<SceneState>) {
  return createStore<SceneStore>()(
    immer((set, get) => ({
      // ── Initial state ──
      objects: [],
      selection: EMPTY_SELECTION,
      transformMode: 'select',
      viewMode: 'solid',
      snap: DEFAULT_SNAP,
      unit: 'm',
      ...initial,

      // ── Object actions ──
      addObject(kind, opts) {
        const obj = createSceneObject(kind, opts);
        set((s) => { s.objects.push(obj); });
        return obj;
      },

      removeObject(id) {
        set((s) => {
          s.objects = s.objects.filter((o: SceneObject) => o.id !== id);
          if (s.selection.objectId === id) {
            s.selection.objectId = null;
            s.selection.sub = null;
          }
        });
      },

      patchObject(id, patch) {
        set((s) => {
          const idx = s.objects.findIndex((o: SceneObject) => o.id === id);
          if (idx === -1) return;
          s.objects[idx] = patchSceneObject(s.objects[idx], patch);
        });
      },

      patchMaterial(id, patch) {
        set((s) => {
          const obj = s.objects.find((o: SceneObject) => o.id === id);
          if (!obj) return;
          obj.material = { ...obj.material, ...patch };
        });
      },

      patchShape(id, patch) {
        set((s) => {
          const obj = s.objects.find((o: SceneObject) => o.id === id);
          if (!obj) return;
          obj.shape = { ...obj.shape, ...patch } as ShapeParams;
        });
      },

      commitTransform(id, transform) {
        set((s) => {
          const obj = s.objects.find((o: SceneObject) => o.id === id);
          if (!obj) return;
          obj.transform = cloneTransform(transform);
        });
      },

      setObjects(objects) {
        set((s) => { s.objects = objects; });
      },

      // ── Selection actions ──
      selectObject(id) {
        set((s) => {
          s.selection.objectId = id;
          s.selection.sub = null;
        });
      },

      setSelectionMode(mode) {
        set((s) => {
          s.selection.mode = mode;
          if (mode === 'object') s.selection.sub = null;
        });
      },

      // ── Tool actions ──
      setTransformMode(mode) {
        set((s) => { s.transformMode = mode; });
      },

      setViewMode(mode) {
        set((s) => { s.viewMode = mode; });
      },

      // ── Snap ──
      setSnapSettings(patch) {
        set((s) => { s.snap = { ...s.snap, ...patch }; });
      },

      // ── Queries ──
      getObject(id) {
        return get().objects.find((o) => o.id === id);
      },

      getSelected() {
        const { objectId } = get().selection;
        if (!objectId) return undefined;
        return get().objects.find((o) => o.id === objectId);
      },
    })),
  );
}

export type SceneStoreInstance = ReturnType<typeof createSceneStore>;
