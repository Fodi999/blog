/**
 * city/TerrainMesh.tsx
 * Renders the backend-baked terrain mesh as a Three.js BufferGeometry.
 *
 * Receives `CityTerrain` from CityMap.terrain and uploads the flat float
 * buffers directly — no client-side geometry math.
 */
'use client';

import * as THREE from 'three';
import { useMemo } from 'react';
import type { CityTerrain } from '@/types/city-api';

interface Props {
  terrain: CityTerrain;
  /** Optional Y offset to bias the mesh up/down relative to y=0. */
  offsetY?: number;
}

export function TerrainMesh({ terrain, offsetY = 0 }: Props) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();

    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(new Float32Array(terrain.mesh.positions), 3),
    );

    if (terrain.mesh.normals?.length) {
      geo.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(new Float32Array(terrain.mesh.normals), 3),
      );
    }

    if (terrain.mesh.uvs?.length) {
      geo.setAttribute(
        'uv',
        new THREE.Float32BufferAttribute(new Float32Array(terrain.mesh.uvs), 2),
      );
    }

    geo.setIndex(terrain.mesh.indices);

    if (!terrain.mesh.normals?.length) {
      geo.computeVertexNormals();
    }
    geo.computeBoundingSphere();
    geo.computeBoundingBox();

    return geo;
  }, [terrain.mesh]);

  return (
    <mesh
      geometry={geometry}
      position={[0, offsetY, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        color={terrain.color}
        roughness={0.95}
        metalness={0.02}
      />
    </mesh>
  );
}
