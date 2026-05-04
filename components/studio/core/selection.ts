/**
 * studio/core/selection.ts
 *
 * Pure functions for selection state management.
 * No React, no Three.js — just data transformations.
 */

import type { SceneObject, SelectionMode, SubSelection, Vec3 } from './types';

// ── Selection state ───────────────────────────────────────────────────────────

export type SelectionState = {
  /** Selected object id in object mode */
  objectId: string | null;
  /** Sub-element selection for face/edge/vertex modes */
  sub: SubSelection | null;
  /** Current picking mode */
  mode: SelectionMode;
};

export const EMPTY_SELECTION: SelectionState = {
  objectId: null,
  sub: null,
  mode: 'object',
};

// ── Reducers ──────────────────────────────────────────────────────────────────

export function selectObject(state: SelectionState, id: string | null): SelectionState {
  return { ...state, objectId: id, sub: null };
}

export function setMode(state: SelectionState, mode: SelectionMode): SelectionState {
  // Switching back to object mode clears sub-selection.
  if (mode === 'object') return { ...state, mode, sub: null };
  return { ...state, mode };
}

export function selectFace(state: SelectionState, objectId: string, normalKey: string, centerLocal: Vec3): SelectionState {
  if (state.mode !== 'face') return state;
  const next: SubSelection = { mode: 'face', data: { objectId, normalKey, centerLocal } };
  // Toggle off if clicking the same face.
  if (state.sub?.mode === 'face' && state.sub.data.normalKey === normalKey) {
    return { ...state, sub: null };
  }
  return { ...state, objectId, sub: next };
}

export function selectEdge(state: SelectionState, objectId: string, a: Vec3, b: Vec3): SelectionState {
  if (state.mode !== 'edge') return state;
  const key = edgeKey(a, b);
  const prevKey = state.sub?.mode === 'edge'
    ? edgeKey(state.sub.data.a, state.sub.data.b)
    : null;
  if (prevKey === key) return { ...state, sub: null };
  return { ...state, objectId, sub: { mode: 'edge', data: { objectId, a, b } } };
}

export function selectVertex(state: SelectionState, objectId: string, position: Vec3): SelectionState {
  if (state.mode !== 'vertex') return state;
  const key = vertexKey(position);
  const prevKey = state.sub?.mode === 'vertex' ? vertexKey(state.sub.data.position) : null;
  if (prevKey === key) return { ...state, sub: null };
  return { ...state, objectId, sub: { mode: 'vertex', data: { objectId, position } } };
}

export function clearSelection(state: SelectionState): SelectionState {
  return { ...state, objectId: null, sub: null };
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function edgeKey(a: Vec3, b: Vec3): string {
  const ka = a.map((v) => v.toFixed(5)).join(',');
  const kb = b.map((v) => v.toFixed(5)).join(',');
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
}

function vertexKey(v: Vec3): string {
  return v.map((x) => x.toFixed(5)).join(',');
}

/** Returns true if the given object is "active" in the current selection. */
export function isObjectActive(state: SelectionState, id: string): boolean {
  return state.objectId === id;
}

/** Returns true if an object is hovered and can receive transform handles. */
export function canTransform(state: SelectionState, id: string): boolean {
  return state.objectId === id && state.mode === 'object';
}
