'use client';
/**
 * studio/objects/PrimitiveObject.tsx
 *
 * Renders a SceneObject using pure Three.js geometry (no backend call).
 * Used as instant placeholder while the GLB is loading, or for shapes
 * that don't have a Rust generator yet.
 *
 * Shape map:
 *   cube       → BoxGeometry
 *   sphere     → SphereGeometry
 *   cylinder   → CylinderGeometry
 *   cone       → ConeGeometry
 *   torus      → TorusGeometry
 *   square     → PlaneGeometry (1×1)
 *   rectangle  → PlaneGeometry (2×1)
 *   circle     → CircleGeometry
 *   triangle   → custom BufferGeometry
 *   line       → LineSegments
 */

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { SceneObject } from '../core/types';

export interface PrimitiveObjectProps {
  obj: SceneObject;
  selected?: boolean;
  hovered?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

function buildGeometry(obj: SceneObject): THREE.BufferGeometry {
  const s = obj.shape;
  switch (s.kind) {
    case 'cube':
      return new THREE.BoxGeometry(1, 1, 1, s.subdivisions, s.subdivisions, s.subdivisions);
    case 'sphere':
      return new THREE.SphereGeometry(0.5, 32, 24);
    case 'cylinder':
      return new THREE.CylinderGeometry(s.radius, s.radius, s.height, 32);
    case 'cone':
      return new THREE.ConeGeometry(s.radius, s.height, 32);
    case 'torus':
      return new THREE.TorusGeometry(s.major_radius, s.minor_radius, 16, 64);
    case 'square':
      return new THREE.PlaneGeometry(1, 1);
    case 'rectangle':
      return new THREE.PlaneGeometry(2, 1);
    case 'circle':
      return new THREE.CircleGeometry(0.5, 48);
    case 'triangle': {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([
        0, 0.6, 0,  -0.5, -0.4, 0,  0.5, -0.4, 0,
      ], 3));
      geo.setIndex([0, 1, 2]);
      geo.computeVertexNormals();
      return geo;
    }
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

export function PrimitiveObject({
  obj,
  selected = false,
  hovered = false,
  onClick,
  onPointerOver,
  onPointerOut,
}: PrimitiveObjectProps) {
  const geo = useMemo(() => buildGeometry(obj), [obj.shape]);

  const mat = useMemo(() => {
    if (obj.shape.kind === 'line') return null;
    return new THREE.MeshStandardMaterial({
      color: obj.material.color_hex,
      metalness: 0.45,
      roughness: 0.38,
    });
  }, [obj.material.color_hex]);

  const { position, rotation, scale } = obj.transform;

  if (obj.shape.kind === 'line') {
    return (
      <lineSegments
        position={position}
        rotation={rotation}
        scale={scale}
        visible={obj.visible}
      >
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-0.5, 0, 0, 0.5, 0, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={obj.material.color_hex} />
      </lineSegments>
    );
  }

  return (
    <mesh
      geometry={geo}
      material={mat ?? undefined}
      position={position}
      rotation={rotation}
      scale={scale}
      visible={obj.visible}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={(e) => { e.stopPropagation(); onPointerOver?.(); }}
      onPointerOut={(e) => { e.stopPropagation(); onPointerOut?.(); }}
    >
      {(selected || hovered) && (
        <meshBasicMaterial
          attach="material"
          color={selected ? '#38BDF8' : '#f97316'}
          wireframe
          transparent
          opacity={0.25}
        />
      )}
    </mesh>
  );
}
