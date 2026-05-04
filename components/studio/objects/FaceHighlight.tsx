'use client';
/**
 * studio/objects/FaceHighlight.tsx
 *
 * Renders a flat highlight quad on the selected face of a cube primitive.
 *
 * Strategy:
 *   - Parent mesh is a unit BoxGeometry (1×1×1).
 *   - FaceId maps to a rotation + offset.
 *   - PlaneGeometry 0.99×0.99 placed just outside the face (±0.501) so it
 *     renders on top without z-fighting.
 */

import * as THREE from 'three';
import type { FaceId } from '../core/types';

/** Map FaceId → Euler rotation (degrees) + position offset. */
const FACE_CONFIG: Record<FaceId, {
  rotation: [number, number, number];
  offset: [number, number, number];
}> = {
  top:    { rotation: [-90,   0,   0], offset: [ 0,     0.501,  0    ] },
  bottom: { rotation: [ 90,   0,   0], offset: [ 0,    -0.501,  0    ] },
  front:  { rotation: [  0,   0,   0], offset: [ 0,     0,      0.501] },
  back:   { rotation: [  0, 180,   0], offset: [ 0,     0,     -0.501] },
  right:  { rotation: [  0,  90,   0], offset: [ 0.501, 0,      0    ] },
  left:   { rotation: [  0, -90,   0], offset: [-0.501, 0,      0    ] },
};

/** Classify a face normal (local space) to the closest FaceId. */
export function getFaceIdFromNormal(normal: THREE.Vector3): FaceId {
  const ax = Math.abs(normal.x);
  const ay = Math.abs(normal.y);
  const az = Math.abs(normal.z);

  if (ay >= ax && ay >= az) return normal.y > 0 ? 'top' : 'bottom';
  if (ax >= ay && ax >= az) return normal.x > 0 ? 'right' : 'left';
  return normal.z > 0 ? 'front' : 'back';
}

export interface FaceHighlightProps {
  faceId: FaceId;
  /** selected = yellow, hovered = lime */
  variant?: 'selected' | 'hovered';
}

const QUAD = new THREE.PlaneGeometry(0.99, 0.99);

export function FaceHighlight({ faceId, variant = 'selected' }: FaceHighlightProps) {
  const cfg = FACE_CONFIG[faceId];

  const [rx, ry, rz] = cfg.rotation;
  const color   = variant === 'selected' ? '#facc15' : '#d9f99d';
  const opacity = variant === 'selected' ? 0.55 : 0.35;

  return (
    <mesh
      geometry={QUAD}
      rotation={[
        THREE.MathUtils.degToRad(rx),
        THREE.MathUtils.degToRad(ry),
        THREE.MathUtils.degToRad(rz),
      ]}
      position={cfg.offset}
    >
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
