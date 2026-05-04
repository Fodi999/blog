'use client';
/**
 * studio/viewport/CameraRig.tsx
 *
 * OrbitControls wrapper with standard Studio defaults.
 * Exposes a ref so the gizmo layer can disable orbit during drag.
 *
 * Listens for `studio:set-camera-view` custom events dispatched by
 * CameraViewWidget (DOM overlay) and smoothly animates camera position.
 */

import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export type CameraViewName = 'top' | 'front' | 'right' | 'perspective';

const CAMERA_PRESETS: Record<CameraViewName, [number, number, number]> = {
  top:         [0, 10, 0.001],   // slight Z offset so OrbitControls doesn't gimbal-lock
  front:       [0, 2, 10],
  right:       [10, 2, 0],
  perspective: [5, 5, 5],
};

export interface CameraRigProps {
  /** Disable orbit (used when gizmo is active) */
  disabled?: boolean;
  controlsRef?: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
}

export function CameraRig({ disabled = false, controlsRef }: CameraRigProps) {
  const { camera } = useThree();
  const targetPos = useRef<THREE.Vector3 | null>(null);
  const lerpSpeed = 0.1; // per-frame lerp factor (feels ~200ms)

  // Listen for camera view events from the DOM overlay
  useEffect(() => {
    const handler = (e: Event) => {
      const view = (e as CustomEvent<CameraViewName>).detail;
      const preset = CAMERA_PRESETS[view];
      if (preset) {
        targetPos.current = new THREE.Vector3(...preset);
        // Reset orbit target to origin
        if (controlsRef?.current) {
          (controlsRef.current as unknown as { target: THREE.Vector3 }).target.set(0, 0, 0);
        }
      }
    };
    window.addEventListener('studio:set-camera-view', handler);
    return () => window.removeEventListener('studio:set-camera-view', handler);
  }, [controlsRef]);

  // Smooth lerp toward target
  useFrame(() => {
    if (!targetPos.current) return;
    camera.position.lerp(targetPos.current, lerpSpeed);
    if (camera.position.distanceTo(targetPos.current) < 0.01) {
      camera.position.copy(targetPos.current);
      targetPos.current = null;
    }
    if (controlsRef?.current) {
      (controlsRef.current as unknown as { update: () => void }).update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={!disabled}
      minDistance={0.5}
      maxDistance={30}
      maxPolarAngle={Math.PI * 0.9}
      dampingFactor={0.07}
      enableDamping
      rotateSpeed={0.65}
      zoomSpeed={1.1}
      panSpeed={0.8}
    />
  );
}
