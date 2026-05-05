/**
 * kitchen-tycoon/viewport/RoomPiece.tsx
 *
 * Renders one GLB cube from the Rust backend with a custom scale/color.
 * Falls back to boxGeometry while the GLB is in-flight.
 */
'use client';

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { BACKEND_BASE } from '../lab/geometry-client';

export interface RoomPieceProps {
  slug?: 'shape_cube' | 'shape_cylinder' | 'shape_sphere' | 'shape_cone' | 'shape_torus';
  scale?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  roughness?: number;
  metalness?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  transparent?: boolean;
  opacity?: number;
}

function roomUrl(slug: string): string {
  return `${BACKEND_BASE}/api/laboratory/debug-glb/${slug}`;
}

export function RoomPiece({
  slug = 'shape_cube',
  scale = [1, 1, 1],
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = '#ffffff',
  roughness = 0.85,
  metalness = 0.05,
  castShadow = false,
  receiveShadow = true,
  transparent = false,
  opacity = 1,
}: RoomPieceProps) {
  const { scene } = useGLTF(roomUrl(slug));

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness,
        metalness,
        transparent,
        opacity,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color, roughness, metalness, transparent, opacity],
  );

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
        mesh.material = mat;
      }
    });
    return clone;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, mat]);

  return (
    <primitive object={cloned} position={position} scale={scale} rotation={rotation} />
  );
}

// Preload once — only in browser (SSR guard)
if (typeof window !== 'undefined') {
  useGLTF.preload(roomUrl('shape_cube'));
}
