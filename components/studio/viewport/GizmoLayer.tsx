'use client';
/**
 * studio/viewport/GizmoLayer.tsx
 *
 * Plasticity-style gizmo layer inside the R3F Canvas.
 *
 * Flow:
 *   user selects object → store.selection.objectId is set
 *   user activates move/rotate/scale → store.tool.transformMode changes
 *   GizmoLayer reads both, finds the Object3D via RefRegistry,
 *   attaches TransformControls, commits transform via CommandRunner on release.
 *
 * Rules:
 *   - Only renders when transformMode ∈ { move, rotate, scale }
 *   - Disables OrbitControls during drag to avoid camera fighting
 *   - Commits via runner.run(makeMoveCommand()) — fully undo/redoable
 *   - Never calls fetch / geometry-client
 */

import { useRef } from 'react';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStudioStore, useRunner } from '../engine/StudioProvider';
import { makeMoveCommand } from '../core/commands';
import type { Transform } from '../core/types';

// TransformMode values that activate the gizmo
const GIZMO_MODES = new Set(['move', 'rotate', 'scale']);

// Map our TransformMode → drei TransformControls mode string
function toGizmoMode(mode: string): 'translate' | 'rotate' | 'scale' {
  if (mode === 'move')   return 'translate';
  if (mode === 'rotate') return 'rotate';
  return 'scale';
}

function readTransform(obj: THREE.Object3D): Transform {
  return {
    position: [obj.position.x, obj.position.y, obj.position.z],
    rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
    scale:    [obj.scale.x,    obj.scale.y,    obj.scale.z],
  };
}

interface GizmoLayerProps {
  /** Pass the OrbitControls ref so we can disable it during drag. */
  orbitRef?: React.RefObject<{ enabled: boolean } | null>;
}

export function GizmoLayer({ orbitRef }: GizmoLayerProps) {
  const selectedId    = useStudioStore((s) => s.selection.objectId);
  const transformMode = useStudioStore((s) => s.tool.transformMode);
  const target        = useStudioStore((s) => selectedId ? s.objectRefs[selectedId] : undefined);
  const runner        = useRunner();

  // Snapshot of transform at drag-start — needed for undo
  const fromTransform = useRef<Transform | null>(null);

  // Early out — no selection or tool doesn't use gizmo
  if (!selectedId || !GIZMO_MODES.has(transformMode)) return null;
  if (!target) return null;

  return (
    <TransformControls
      object={target}
      mode={toGizmoMode(transformMode)}
      size={0.9}
      onMouseDown={() => {
        // Snapshot the pre-drag transform
        fromTransform.current = readTransform(target);
        // Disable orbit so the camera doesn't fight the gizmo
        if (orbitRef?.current) orbitRef.current.enabled = false;
      }}
      onMouseUp={() => {
        // Re-enable orbit
        if (orbitRef?.current) orbitRef.current.enabled = true;

        const from = fromTransform.current;
        if (!from) return;
        const to = readTransform(target);

        // Only commit if something actually changed
        const moved =
          from.position.some((v, i) => Math.abs(v - to.position[i]) > 1e-6) ||
          from.rotation.some((v, i) => Math.abs(v - to.rotation[i]) > 1e-6) ||
          from.scale.some((v, i)    => Math.abs(v - to.scale[i])    > 1e-6);

        if (moved) {
          runner.run(makeMoveCommand(selectedId, from, to));
        }

        fromTransform.current = null;
      }}
    />
  );
}
