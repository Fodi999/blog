'use client';

/**
 * GlbPrefab — generic GLB loader / renderer.
 *
 * Takes a URL, loads it with `useGLTF`, clones the scene and places it.
 * No domain knowledge. No entity logic. No fallback.
 *
 * Who calls this:
 *   ProductVisual3D  — decides GLB vs fallback ProductCard3D
 *   CardDockPrefab   — wraps with dock-specific hover/glow state
 *   Any future prefab that receives a GLB url from the backend
 *
 * What this does NOT know about:
 *   inventory items, themes, selections, SceneEntity shape, emissive states
 */

import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

export interface GlbPrefabProps {
  url: string;
  scale?: number | [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export function GlbPrefab({
  url,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: GlbPrefabProps) {
  const { scene } = useGLTF(url);

  const instance = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of mats) {
            mat.needsUpdate = true;
          }
        }
      }
    });
    return clone;
  }, [scene]);

  return (
    <primitive
      object={instance}
      scale={scale}
      position={position}
      rotation={rotation}
    />
  );
}

/** Preload a GLB before it's needed (call in parent component). */
export function preloadGlb(url: string) {
  useGLTF.preload(url);
}

