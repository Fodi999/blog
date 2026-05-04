/**
 * studio/engine/scene-store.ts
 *
 * Central Zustand store for the Studio scene.
 * One store instance per Studio mount — no global singleton.
 * Create via `createSceneStore()` and inject via React context.
 */

import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import * as THREE from 'three';
import type {
  SceneObject,
  SelectionMode,
  TransformMode,
  ViewMode,
  Transform,
  SpawnShape,
  ShapeParams,
  Material,
  StudioToolState,
  StudioTool,
  StudioDraft,
  FilletDraft,
  ExtrudeDraft,
  MeasureDraft,
  Vec3,
  FaceId,
} from '../core/types';
import {
  EMPTY_SELECTION,
  type SelectionState,
  selectFace as selFace,
  selectEdge as selEdge,
  selectVertex as selVertex,
} from '../core/selection';
import { DEFAULT_SNAP, type SnapSettings } from '../core/snapping';
import { cloneTransform } from '../core/transform';
import { DEFAULT_TOOL_STATE } from '../core/types';
import { createSceneObject, patchSceneObject } from './object-factory';

// ── State shape ───────────────────────────────────────────────────────────────

export type SceneState = {
  objects: SceneObject[];
  selection: SelectionState;
  /**
   * `transformMode` kept at top level for backward-compat with GizmoLayer /
   * StudioToolbar that read it directly. Always mirrors `tool.transformMode`.
   */
  transformMode: TransformMode;
  viewMode: ViewMode;
  snap: SnapSettings;
  unit: 'm' | 'cm' | 'mm';
  /**
   * Complete tool configuration.
   * This is the canonical source of truth for tool state.
   *
   * tool.selectionMode — what you select (object / face / edge / vertex)
   * tool.transformMode — what you do with it (select / move / rotate / scale / extrude / …)
   * tool.snapEnabled   — grid snap on/off
   * tool.gridSize      — snap grid size in metres
   * tool.activeView    — camera view (perspective / top / front / right / left)
   */
  tool: StudioToolState;
  /**
   * Runtime-only Object3D refs — NOT persisted, NOT tracked by Immer.
   * Populated via registerObjectRef() from GlbObject / PrimitiveObject.
   * Read by GizmoLayer to attach TransformControls.
   */
  objectRefs: Record<string, THREE.Object3D>;
  /** ID of the currently hovered object — drives outline highlight. null = none. */
  hoveredId: string | null;
  /**
   * Active tool — what the user is currently doing.
   * Separate from `tool.transformMode` because it includes modelling tools.
   */
  activeTool: StudioTool;
  /**
   * Live draft for the active tool (fillet radius, extrude distance, …).
   * null when no tool is in progress.
   */
  draft: StudioDraft;
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
  /** Face sub-selection — faceId is one of top/bottom/front/back/left/right. */
  selectSubFace: (objectId: string, faceId: FaceId) => void;
  /** Edge sub-selection — a + b are local-space endpoints. */
  selectSubEdge: (objectId: string, a: Vec3, b: Vec3) => void;
  /** Vertex sub-selection — local-space position. */
  selectSubVertex: (objectId: string, position: Vec3) => void;
  /** Clear sub-selection only (keep object selected). */
  clearSubSelection: () => void;

  // Tools
  setTransformMode: (mode: TransformMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setSnapEnabled: (enabled: boolean) => void;
  setActiveView: (view: StudioToolState['activeView']) => void;
  patchToolState: (patch: Partial<StudioToolState>) => void;

  // Snap
  setSnapSettings: (patch: Partial<SnapSettings>) => void;

  // Runtime refs (Object3D — bypasses Immer, never persisted)
  registerObjectRef: (id: string, ref: THREE.Object3D | null) => void;

  // Hover
  setHoveredId: (id: string | null) => void;

  // Active tool + draft
  setActiveTool: (tool: StudioTool) => void;
  startFilletDraft: (input: FilletDraft) => void;
  startExtrudeDraft: (input: ExtrudeDraft) => void;
  startMeasureDraft: (input: MeasureDraft) => void;
  updateDraftRadius: (radius: number) => void;
  updateDraftDistance: (distance: number) => void;
  cancelDraft: () => void;
  commitDraft: () => void;

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
      transformMode: 'select' as TransformMode,
      viewMode: 'solid' as ViewMode,
      snap: DEFAULT_SNAP,
      unit: 'm' as const,
      tool: DEFAULT_TOOL_STATE,
      objectRefs: {} as Record<string, THREE.Object3D>,
      hoveredId: null as string | null,
      activeTool: 'pointer' as StudioTool,
      draft: null as StudioDraft,
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
          s.tool.selectionMode = mode;
          if (mode === 'object') s.selection.sub = null;
        });
      },

      // Sub-selection — use pure reducers from selection.ts, then write back.
      // Plain-object `set` avoids Immer proxying Vec3 tuples.
      selectSubFace(objectId, faceId) {
        const next = selFace(get().selection, objectId, faceId);
        set((s) => { s.selection = next; });
      },

      selectSubEdge(objectId, a, b) {
        const next = selEdge(get().selection, objectId, a, b);
        set((s) => { s.selection = next; });
      },

      selectSubVertex(objectId, position) {
        const next = selVertex(get().selection, objectId, position);
        set((s) => { s.selection = next; });
      },

      clearSubSelection() {
        set((s) => { s.selection.sub = null; });
      },

      // ── Tool actions ──
      setTransformMode(mode) {
        set((s) => {
          s.transformMode = mode;
          s.tool.transformMode = mode;
        });
      },

      setViewMode(mode) {
        set((s) => { s.viewMode = mode; });
      },

      setSnapEnabled(enabled) {
        set((s) => { s.tool.snapEnabled = enabled; });
      },

      setActiveView(view) {
        set((s) => { s.tool.activeView = view; });
      },

      patchToolState(patch) {
        set((s) => { s.tool = { ...s.tool, ...patch }; });
      },

      // ── Snap ──
      setSnapSettings(patch) {
        set((s) => { s.snap = { ...s.snap, ...patch }; });
      },

      // ── Runtime Object3D refs ──
      // Plain-object `set` bypasses Immer so THREE.Object3D is never proxied/frozen.
      registerObjectRef(id, ref) {
        const prev = get().objectRefs;
        if (ref) {
          set({ objectRefs: { ...prev, [id]: ref } });
        } else {
          const { [id]: _removed, ...rest } = prev;
          set({ objectRefs: rest });
        }
      },

      // ── Hover ──
      setHoveredId(id) {
        set({ hoveredId: id });
      },

      // ── Active tool + draft ──
      setActiveTool(tool) {
        set((s) => { s.activeTool = tool; s.draft = null; });
      },

      startFilletDraft(input) {
        set((s) => { s.draft = input; s.activeTool = 'fillet'; });
      },

      startExtrudeDraft(input) {
        set((s) => { s.draft = input; s.activeTool = 'extrude'; });
      },

      startMeasureDraft(input) {
        set((s) => { s.draft = input; s.activeTool = 'measure'; });
      },

      updateDraftRadius(radius) {
        const d = get().draft;
        if (d?.kind === 'fillet') set({ draft: { ...d, radius } });
      },

      updateDraftDistance(distance) {
        const d = get().draft;
        if (d?.kind === 'extrude') set({ draft: { ...d, distance } });
      },

      cancelDraft() {
        set({ draft: null });
      },

      commitDraft() {
        // Consumers (FilletHandle, ExtrudeHandle) read draft from store,
        // build a command and dispatch it, then call cancelDraft().
        // The store itself just clears draft here as a safety net.
        set({ draft: null });
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
