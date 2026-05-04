'use client';

/**
 * CardDockPrefab — adapter between SceneEntity and GlbPrefab for card docks.
 *
 * Why a dedicated adapter and not just GlbPrefab directly:
 *   - CardDock will get its own interaction state:
 *       hover glow, slot-inserted animation, accent color override,
 *       card-ejection trigger, connection pin highlight
 *   - These are dock-specific, not generic GLB concerns
 *
 * For now: loads GLB via GlbPrefab, adds selection ring.
 * Future slots: hover state, inserted card reference, accent override.
 */

import { Suspense } from 'react';
import * as THREE from 'three';

import type { PrefabProps } from './registry';
import { GlbPrefab } from './GlbPrefab';
import { themeColor } from '../theme';

export function CardDockPrefab({ entity, selected, onSelect }: PrefabProps) {
  const glbUrl = entity.content?.glbUrl;

  // No GLB available — render nothing (dock must have a GLB, it's not an R3F shape)
  if (!glbUrl) return null;

  const [px, py, pz] = entity.transform.position;
  const [rx, ry, rz] = entity.transform.rotation;
  const [sx, sy, sz] = entity.transform.scale;
  const accentColor   = themeColor(entity.material.theme, entity.material.color);

  return (
    <Suspense fallback={null}>
      <group
        position={[px, py, pz]}
        rotation={[rx, ry, rz]}
        onClick={(e) => { e.stopPropagation(); onSelect(entity.id); }}
      >
        <GlbPrefab url={glbUrl} scale={[sx, sy, sz]} />

        {/* Selection ring — emissive accent under the dock */}
        {selected && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <ringGeometry args={[0.22, 0.30, 40]} />
            <meshBasicMaterial
              color={accentColor}
              transparent
              opacity={0.75}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* TODO: slot-inserted card animation */}
        {/* TODO: hover accent glow overlay */}
        {/* TODO: emissive strip intensity from entity.material.emissive */}
      </group>
    </Suspense>
  );
}
