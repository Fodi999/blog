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
import { useStudioStore } from '../engine/StudioProvider';

export interface GlbObjectProps {
  obj: SceneObject;
  /** Legacy — ignored, store-driven state takes priority. */
  selected?: boolean;
  /** Legacy — ignored, store-driven state takes priority. */
  hovered?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

export function GlbObject({
  obj,
  onClick,
  onPointerOver,
  onPointerOut,
}: GlbObjectProps) {
  // ── Store-driven highlight state ──
  const selectedId        = useStudioStore((s) => s.selection.objectId);
  const hoveredId         = useStudioStore((s) => s.hoveredId);
  const selectObject      = useStudioStore((s) => s.selectObject);
  const setHoveredId      = useStudioStore((s) => s.setHoveredId);
  const registerObjectRef = useStudioStore((s) => s.registerObjectRef);

  const isSelected = selectedId === obj.id;
  const isHovered  = hoveredId  === obj.id;
  // ── URL resolution: prefer pre-set glbUrl, fallback to parametric builder ──
  // glbUrl is set by geometry-client.createBackendStudioObject() before the
  // object ever reaches the store. buildShapeUrl is the fallback for objects
  // added synchronously (e.g. via undo/redo replay).
  const url = useMemo(
    () => obj.glbUrl ?? buildShapeUrl(obj),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [obj.glbUrl, obj.kind, obj.shape],
  );

  const gltf = useLoader(GLTFLoader, url);
  const groupRef = useRef<THREE.Group>(null);

  // ── Register / unregister in store so GizmoLayer can attach ──
  useEffect(() => {
    if (groupRef.current) registerObjectRef(obj.id, groupRef.current);
    return () => registerObjectRef(obj.id, null);
  }, [obj.id, registerObjectRef]);

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
      onClick={(e) => {
        e.stopPropagation();
        selectObject(obj.id);
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredId(obj.id);
        onPointerOver?.();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHoveredId(null);
        onPointerOut?.();
      }}
      visible={obj.visible}
    >
      {/* Centering pivot */}
      <group scale={scale} position={[-offset.x, -offset.y, -offset.z]}>
        <primitive object={gltf.scene.clone(true)} />
      </group>

      {/* Plasticity-style highlight shell — yellow=selected, lime=hovered */}
      {(isSelected || isHovered) && (
        <mesh scale={[1.04, 1.04, 1.04]}>
          <sphereGeometry args={[0.82, 16, 16]} />
          <meshBasicMaterial
            color={isSelected ? '#facc15' : '#d9f99d'}
            wireframe
            transparent
            opacity={isSelected ? 0.22 : 0.14}
          />
        </mesh>
      )}
    </group>
  );
}
