/**
 * studio/handles/handle-math.ts
 *
 * Pure geometry helpers for tool handles.
 * No React, no Three.js side-effects — only computations.
 */

import * as THREE from 'three';
import type { Vec3 } from '../core/types';

// ── Circle ring (handle outline) ─────────────────────────────────────────────

/**
 * Build a flat circle BufferGeometry (line loop) of `radius` in the XZ plane.
 * Used for the Fillet and Radius handle rings.
 */
export function makeCircleLineGeo(radius: number, segments = 64): THREE.BufferGeometry {
  const points: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geo;
}

/**
 * Build a dashed arc for the chamfer / fillet preview arc.
 * `startAngle` and `endAngle` in radians, in the XZ plane.
 */
export function makeArcLineGeo(
  radius: number,
  startAngle: number,
  endAngle: number,
  segments = 32,
): THREE.BufferGeometry {
  const points: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = startAngle + (i / segments) * (endAngle - startAngle);
    points.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geo;
}

// ── Arrow shaft ───────────────────────────────────────────────────────────────

/**
 * Simple Y-axis arrow: shaft (line) + cone tip.
 * Used by ExtrudeHandle to show push/pull direction.
 */
export function makeArrowPoints(length: number): Float32Array {
  return new Float32Array([0, 0, 0, 0, length, 0]);
}

// ── Drag delta → value ────────────────────────────────────────────────────────

/**
 * Map a pointer drag delta (screen pixels) to a world-space delta.
 * Sensitivity: 1 pixel = `scale` metres by default.
 */
export function dragDeltaToValue(
  pixelDelta: number,
  currentValue: number,
  minValue: number,
  maxValue: number,
  sensitivity = 0.005,
): number {
  return Math.max(minValue, Math.min(maxValue, currentValue + pixelDelta * sensitivity));
}

// ── World position helpers ────────────────────────────────────────────────────

/** Convert Vec3 tuple to THREE.Vector3 */
export function v3(v: Vec3): THREE.Vector3 {
  return new THREE.Vector3(v[0], v[1], v[2]);
}

/** Midpoint of an edge in world-space (used to position the fillet handle). */
export function edgeMidpoint(a: Vec3, b: Vec3): THREE.Vector3 {
  return new THREE.Vector3(
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
    (a[2] + b[2]) / 2,
  );
}
