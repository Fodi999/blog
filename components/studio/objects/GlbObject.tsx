'use client';
/**
 * studio/objects/GlbObject.tsx
 *
 * Renders a single SceneObject that lives on the Rust backend as a GLB.
 * URL is built exclusively via geometry-client.buildShapeUrl() —
 * never hardcoded here.
 *
 * Uses R3F useLoader + GLTFLoader. Applies:
 *   - fitToView centering/scaling
 *   - upgradeMaterials (glass / metal / liquid PBR)
 *   - applyShapeColor (metallic hex override)
 *   - outline highlight when selected
 */

import { useRef, useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import type { SceneObject } from '../core/types';
import { buildShapeUrl } from '../engine/geometry-client';
import { fitToView, upgradeMaterials, applyShapeColor } from '../engine/mesh-builder';

export interface GlbObjectProps {
  obj: SceneObject;
  selected?: boolean;
  hovered?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

export function GlbObject({
  obj,
  selected = false,
  hovered = false,
  onClick,
  onPointerOver,
  onPointerOut,
}: GlbObjectProps) {
  // ── URL from geometry-client (single source of truth) ──
  const url = useMemo(() => buildShapeUrl(obj), [obj.kind, obj.shape]);

  const gltf = useLoader(GLTFLoader, url);
  const groupRef = useRef<THREE.Group>(null);

  // ── Upgrade materials once on load ──
  useEffect(() => {
    if (!gltf.scene) return;
    upgradeMaterials(gltf.scene);
    applyShapeColor(gltf.scene, obj.material.color_hex);
  }, [gltf.scene, obj.material.color_hex]);

  // ── Update color when it changes without reload ──
  useEffect(() => {
    if (!gltf.scene) return;
    applyShapeColor(gltf.scene, obj.material.color_hex);
  }, [obj.material.color_hex]);

  // ── Fit to view ──
  const { scale, offset } = useMemo(() => {
    if (!gltf.scene) return { scale: 1, offset: new THREE.Vector3() };
    return fitToView(gltf.scene);
  }, [gltf.scene]);

  const { position, rotation } = obj.transform;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={obj.transform.scale}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={(e) => { e.stopPropagation(); onPointerOver?.(); }}
      onPointerOut={(e) => { e.stopPropagation(); onPointerOut?.(); }}
      visible={obj.visible}
    >
      {/* Centering pivot */}
      <group scale={scale} position={[-offset.x, -offset.y, -offset.z]}>
        <primitive object={gltf.scene.clone(true)} />
      </group>

      {/* Selection outline — cheap emissive shell */}
      {(selected || hovered) && (
        <mesh scale={[1.04, 1.04, 1.04]}>
          <sphereGeometry args={[0.82, 16, 16]} />
          <meshBasicMaterial
            color={selected ? '#38BDF8' : '#f97316'}
            wireframe
            transparent
            opacity={0.18}
          />
        </mesh>
      )}
    </group>
  );
}
