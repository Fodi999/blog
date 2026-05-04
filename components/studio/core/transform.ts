/**
 * studio/core/transform.ts
 *
 * Pure math helpers for 3D transforms.
 * No Three.js dependency — usable in tests and server contexts.
 */

import type { Transform, Vec3, Euler } from './types';

export const IDENTITY: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

// ── Vec3 ops ──────────────────────────────────────────────────────────────────

export function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scale(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s];
}

export function length(v: Vec3): number {
  return Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
}

export function normalize(v: Vec3): Vec3 {
  const len = length(v);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

export function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

export function midpoint(a: Vec3, b: Vec3): Vec3 {
  return lerp(a, b, 0.5);
}

export function distanceSq(a: Vec3, b: Vec3): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

export function distance(a: Vec3, b: Vec3): number {
  return Math.sqrt(distanceSq(a, b));
}

// ── Transform ops ─────────────────────────────────────────────────────────────

export function applyPosition(t: Transform, delta: Vec3): Transform {
  return { ...t, position: add(t.position, delta) };
}

export function setPosition(t: Transform, pos: Vec3): Transform {
  return { ...t, position: pos };
}

export function setRotation(t: Transform, rot: Euler): Transform {
  return { ...t, rotation: rot };
}

export function setScale(t: Transform, s: Vec3): Transform {
  return { ...t, scale: s };
}

export function uniformScale(t: Transform, factor: number): Transform {
  return { ...t, scale: scale(t.scale, factor) };
}

export function mergeTransform(base: Transform, patch: Partial<Transform>): Transform {
  return {
    position: patch.position ?? base.position,
    rotation: patch.rotation ?? base.rotation,
    scale:    patch.scale    ?? base.scale,
  };
}

// ── Snapshots ─────────────────────────────────────────────────────────────────

export function cloneTransform(t: Transform): Transform {
  return {
    position: [...t.position] as Vec3,
    rotation: [...t.rotation] as Euler,
    scale:    [...t.scale]    as Vec3,
  };
}

export function transformsEqual(a: Transform, b: Transform): boolean {
  return (
    a.position[0] === b.position[0] &&
    a.position[1] === b.position[1] &&
    a.position[2] === b.position[2] &&
    a.rotation[0] === b.rotation[0] &&
    a.rotation[1] === b.rotation[1] &&
    a.rotation[2] === b.rotation[2] &&
    a.scale[0]    === b.scale[0]    &&
    a.scale[1]    === b.scale[1]    &&
    a.scale[2]    === b.scale[2]
  );
}

// ── Euler helpers ─────────────────────────────────────────────────────────────

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export function degToRad(deg: number): number { return deg * DEG2RAD; }
export function radToDeg(rad: number): number { return rad * RAD2DEG; }

export function eulerToDeg(e: Euler): [number, number, number] {
  return [radToDeg(e[0]), radToDeg(e[1]), radToDeg(e[2])];
}

export function eulerFromDeg(d: [number, number, number]): Euler {
  return [degToRad(d[0]), degToRad(d[1]), degToRad(d[2])];
}
