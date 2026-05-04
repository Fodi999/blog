/**
 * studio/core/extrude.ts
 *
 * Pure function: resize-by-face for box/cube primitives.
 *
 * "Extrude" here is MVP-level: no B-Rep topology, no new faces.
 * It adjusts transform.scale (which drives BoxGeometry size in PrimitiveObject)
 * and transform.position (so the opposite face stays fixed).
 *
 * Axis mapping (unit BoxGeometry 1×1×1, scale = actual size in metres):
 *   right  → +X  → scale[0] += distance, position[0] += distance/2
 *   left   → -X  → scale[0] += distance, position[0] -= distance/2
 *   top    → +Y  → scale[1] += distance, position[1] += distance/2
 *   bottom → -Y  → scale[1] += distance, position[1] -= distance/2
 *   front  → +Z  → scale[2] += distance, position[2] += distance/2
 *   back   → -Z  → scale[2] += distance, position[2] -= distance/2
 *
 * Negative distance = shrink (clamped: each axis minimum 0.01 m).
 */

import type { SceneObject, FaceId } from './types';

const MIN_SIZE = 0.01; // metres

export interface ExtrudeResult {
  scale: [number, number, number];
  position: [number, number, number];
}

export function extrudeBoxFace(
  obj: SceneObject,
  faceId: FaceId,
  distance: number,
): ExtrudeResult {
  const [sx, sy, sz] = obj.transform.scale;
  const [px, py, pz] = obj.transform.position;

  let nsx = sx, nsy = sy, nsz = sz;
  let npx = px, npy = py, npz = pz;

  switch (faceId) {
    case 'right':
      nsx = Math.max(MIN_SIZE, sx + distance);
      npx = px + (nsx - sx) / 2;
      break;
    case 'left':
      nsx = Math.max(MIN_SIZE, sx + distance);
      npx = px - (nsx - sx) / 2;
      break;
    case 'top':
      nsy = Math.max(MIN_SIZE, sy + distance);
      npy = py + (nsy - sy) / 2;
      break;
    case 'bottom':
      nsy = Math.max(MIN_SIZE, sy + distance);
      npy = py - (nsy - sy) / 2;
      break;
    case 'front':
      nsz = Math.max(MIN_SIZE, sz + distance);
      npz = pz + (nsz - sz) / 2;
      break;
    case 'back':
      nsz = Math.max(MIN_SIZE, sz + distance);
      npz = pz - (nsz - sz) / 2;
      break;
  }

  return {
    scale:    [nsx, nsy, nsz],
    position: [npx, npy, npz],
  };
}
