'use client';

/**
 * StorageRoom3D — floor + walls + zone label plaque.
 * Uses entity transform for placement, theme color for tint.
 */

import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';

import type { SceneEntity } from '../sceneTypes';
import { themeColor } from '../theme';

export function StorageRoom3D({ entity }: { entity: SceneEntity }) {
  const color = themeColor(entity.material.theme, entity.material.color);
  const title = entity.content?.title ?? '';
  const subtitle = entity.content?.subtitle ?? '';
  const itemCount = entity.content?.badges?.[0] ?? '';

  return (
    <group position={entity.transform.position} rotation={entity.transform.rotation}>
      {/* Dark base */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[5.8, 0.08, 3.6]} />
        <meshStandardMaterial color="#0c0c0d" roughness={0.85} />
      </mesh>

      {/* Coloured rim */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[5.9, 0.02, 3.7]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={entity.material.emissive}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Walls */}
      {[
        { p: [0, 0.18, -1.78], s: [5.8, 0.36, 0.06] },
        { p: [0, 0.18, 1.78], s: [5.8, 0.36, 0.06] },
        { p: [-2.88, 0.18, 0], s: [0.06, 0.36, 3.6] },
        { p: [2.88, 0.18, 0], s: [0.06, 0.36, 3.6] },
      ].map((w, i) => (
        <mesh key={i} position={w.p as [number, number, number]}>
          <boxGeometry args={w.s as [number, number, number]} />
          <meshStandardMaterial
            color="#0a0a0b"
            emissive={color}
            emissiveIntensity={entity.material.theme === 'risk' ? 0.18 : 0.06}
            roughness={0.7}
          />
        </mesh>
      ))}

      {/* Front-wall plaque */}
      <group position={[0, 0.22, 1.95]}>
        <RoundedBox args={[2.2, 0.62, 0.07]} radius={0.06} smoothness={2}>
          <meshStandardMaterial
            color="#111114"
            emissive={new THREE.Color(color)}
            emissiveIntensity={0.18}
            roughness={0.5}
          />
        </RoundedBox>

        <Text position={[-0.78, 0.1, 0.04]} fontSize={0.12} color="#ffffff" anchorX="left" anchorY="middle" letterSpacing={0.04}>
          {title}
        </Text>
        <Text position={[-0.78, -0.06, 0.04]} fontSize={0.08} color="#9ca3af" anchorX="left" anchorY="middle">
          {subtitle}
        </Text>
        <Text position={[0.82, 0.04, 0.04]} fontSize={0.22} color={color} anchorX="right" anchorY="middle">
          {itemCount}
        </Text>
        <Text position={[0.84, -0.14, 0.04]} fontSize={0.065} color="#6b7280" anchorX="right" anchorY="middle">
          items
        </Text>
      </group>
    </group>
  );
}
