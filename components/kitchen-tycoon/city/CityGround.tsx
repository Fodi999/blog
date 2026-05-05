/**
 * city/CityGround.tsx
 * Base ground plane + grid for the city map.
 */
'use client';

import * as THREE from 'three';
import { useMemo } from 'react';

interface Props {
  showGrid?: boolean;
  size?: number;
  color?: string;
}

export function CityGround({ showGrid = true, size = 60, color = '#5a6048' }: Props) {
  const gridMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: '#1e2a1e',
    transparent: true,
    opacity: 0.5,
  }), []);

  return (
    <group>
      {/* Base ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>

      {/* Outer border rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <ringGeometry args={[size / 2 - 0.1, size / 2, 4, 1]} />
        <meshBasicMaterial color="#1a2a1a" side={THREE.DoubleSide} />
      </mesh>

      {/* Grid helper */}
      {showGrid && (
        <gridHelper
          args={[size, size, '#142014', '#0f1a0f']}
          position={[0, 0.001, 0]}
        />
      )}
    </group>
  );
}
