/**
 * studio/core/snapping.ts
 *
 * Grid snap, surface snap, and floor snap utilities.
 */

import type { Vec3 } from './types';

export type SnapSettings = {
  /** Snap to grid when translating */
  gridEnabled: boolean;
  /** Grid cell size in meters */
  gridSize: number;
  /** Snap rotation to this many degrees (0 = free) */
  rotateStep: number;
  /** Snap scale to this increment (0 = free) */
  scaleStep: number;
  /** Floor Y level — objects snap their bottom to this */
  floorY: number;
  /** Whether to snap to floor on spawn */
  snapToFloor: boolean;
};

export const DEFAULT_SNAP: SnapSettings = {
  gridEnabled: false,
  gridSize: 0.25,
  rotateStep: 15,
  scaleStep: 0.1,
  floorY: -0.78,
  snapToFloor: true,
};

// ── Grid snap ─────────────────────────────────────────────────────────────────

export function snapToGrid(v: Vec3, gridSize: number): Vec3 {
  const s = gridSize;
  return [
    Math.round(v[0] / s) * s,
    Math.round(v[1] / s) * s,
    Math.round(v[2] / s) * s,
  ];
}

export function snapXZ(v: Vec3, gridSize: number): Vec3 {
  const s = gridSize;
  return [
    Math.round(v[0] / s) * s,
    v[1],
    Math.round(v[2] / s) * s,
  ];
}

// ── Floor snap ────────────────────────────────────────────────────────────────

/**
 * Offset a position so the object's bottom face sits at floorY.
 * `halfHeight` = half of the object's world-space bounding-box height.
 */
export function snapToFloor(pos: Vec3, halfHeight: number, floorY: number): Vec3 {
  return [pos[0], floorY + halfHeight, pos[2]];
}

// ── Rotation snap ─────────────────────────────────────────────────────────────

export function snapAngle(rad: number, stepDeg: number): number {
  if (stepDeg === 0) return rad;
  const step = (stepDeg * Math.PI) / 180;
  return Math.round(rad / step) * step;
}

// ── Scale snap ────────────────────────────────────────────────────────────────

export function snapScaleValue(v: number, step: number): number {
  if (step === 0) return v;
  return Math.max(0.01, Math.round(v / step) * step);
}

// ── Apply snap settings to a full position ────────────────────────────────────

export function applySnapSettings(pos: Vec3, settings: SnapSettings): Vec3 {
  if (!settings.gridEnabled) return pos;
  return snapXZ(pos, settings.gridSize);
}
