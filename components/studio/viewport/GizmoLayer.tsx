'use client';
/**
 * studio/viewport/GizmoLayer.tsx
 *
 * TransformControls gizmo — placed in world space above the selected object.
 * Disables OrbitControls while the user drags.
 */

import React from 'react';
import { TransformControls, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { TransformMode, Transform } from '../core/types';

export interface GizmoLayerProps {
  /** The group that the gizmo controls */
  target: THREE.Group | null;
  mode: TransformMode;
  /** Called on drag-end with the new transform */
  onCommit: (t: Transform) => void;
  controlsRef?: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
}

export function GizmoLayer({ target, mode, onCommit, controlsRef }: GizmoLayerProps) {
  if (!target || mode === 'select') return null;

  return (
    <TransformControls
      object={target}
      mode={mode as 'translate' | 'rotate' | 'scale'}
      size={0.85}
      onMouseDown={() => {
        if (controlsRef?.current) {
          (controlsRef.current as { enabled: boolean }).enabled = false;
        }
      }}
      onMouseUp={() => {
        if (controlsRef?.current) {
          (controlsRef.current as { enabled: boolean }).enabled = true;
        }
        onCommit({
          position: [target.position.x, target.position.y, target.position.z],
          rotation: [target.rotation.x, target.rotation.y, target.rotation.z],
          scale:    [target.scale.x,    target.scale.y,    target.scale.z],
        });
      }}
    />
  );
}
