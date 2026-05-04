'use client';
/**
 * studio/viewport/CameraRig.tsx
 *
 * OrbitControls wrapper with standard Studio defaults.
 * Exposes a ref so the gizmo layer can disable orbit during drag.
 */

import React from 'react';
import { OrbitControls } from '@react-three/drei';

export interface CameraRigProps {
  /** Disable orbit (used when gizmo is active) */
  disabled?: boolean;
  controlsRef?: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
}

export function CameraRig({ disabled = false, controlsRef }: CameraRigProps) {
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
