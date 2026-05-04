'use client';
/**
 * studio/handles/ExtrudeHandle.tsx
 *
 * Arrow manipulator shown when:
 *   activeTool === 'extrude' AND there is an active face sub-selection.
 *
 * Behaviour:
 *   - Renders a yellow arrow pointing along the face normal at the face center.
 *   - Drag arrow up/down → distance increases/decreases.
 *   - Shift key → snaps to 0.05 increments.
 *   - ESC → cancelDraft()
 *   - Enter → commitDraft()
 */

import { useRef, useCallback, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStudioStore } from '../engine/StudioProvider';
import { dragDeltaToValue, v3 } from './handle-math';
import type { ExtrudeDraft, FaceId } from '../core/types';

// Face normal directions in local space (unit cube)
const FACE_NORMALS: Record<FaceId, THREE.Vector3> = {
  top:    new THREE.Vector3(0,  1,  0),
  bottom: new THREE.Vector3(0, -1,  0),
  front:  new THREE.Vector3(0,  0,  1),
  back:   new THREE.Vector3(0,  0, -1),
  right:  new THREE.Vector3(1,  0,  0),
  left:   new THREE.Vector3(-1, 0,  0),
};

interface ExtrudeHandleProps {
  draft: ExtrudeDraft;
}

const SHAFT_GEO = new THREE.CylinderGeometry(0.012, 0.012, 1, 8);
const TIP_GEO   = new THREE.ConeGeometry(0.04, 0.12, 12);

export function ExtrudeHandle({ draft }: ExtrudeHandleProps) {
  const updateDraftDistance = useStudioStore((s) => s.updateDraftDistance);
  const cancelDraft         = useStudioStore((s) => s.cancelDraft);
  const commitDraft         = useStudioStore((s) => s.commitDraft);

  const { gl } = useThree();
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const distAtDragStart = useRef(draft.distance);

  const anchor = v3(draft.anchorWorld);
  const normal = FACE_NORMALS[draft.faceId];

  // Arrow orientation — quaternion from +Y to face normal
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    normal,
  );

  // Arrow tip offset along normal
  const tipOffset = normal.clone().multiplyScalar(0.5 + draft.distance);

  const handlePointerDown = useCallback((e: THREE.Event) => {
    const pe = e as unknown as PointerEvent;
    pe.stopPropagation?.();
    isDragging.current = true;
    dragStartY.current = pe.clientY;
    distAtDragStart.current = draft.distance;
    gl.domElement.setPointerCapture((e as unknown as PointerEvent).pointerId);
    document.body.style.cursor = 'ns-resize';
  }, [draft.distance, gl.domElement]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const delta = dragStartY.current - e.clientY;
      const snap = e.shiftKey ? 0.05 : 0;
      let newDist = dragDeltaToValue(delta, distAtDragStart.current, -0.5, 2.0, 0.005);
      if (snap > 0) newDist = Math.round(newDist / snap) * snap;
      updateDraftDistance(newDist);
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [updateDraftDistance]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDraft();
      if (e.key === 'Enter') commitDraft();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancelDraft, commitDraft]);

  return (
    <group position={anchor}>
      {/* Shaft */}
      <mesh
        geometry={SHAFT_GEO}
        quaternion={quat}
        position={normal.clone().multiplyScalar(0.5)}
        onPointerDown={handlePointerDown as never}
        onPointerOver={() => { document.body.style.cursor = 'ns-resize'; }}
        onPointerOut={() => { if (!isDragging.current) document.body.style.cursor = ''; }}
      >
        <meshBasicMaterial color="#facc15" depthTest={false} />
      </mesh>

      {/* Arrowhead cone */}
      <mesh
        geometry={TIP_GEO}
        quaternion={quat}
        position={tipOffset}
        onPointerDown={handlePointerDown as never}
      >
        <meshBasicMaterial color="#facc15" depthTest={false} />
      </mesh>

      {/* Distance label */}
      <Html
        position={tipOffset.clone().addScaledVector(normal, 0.12)}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
        distanceFactor={4}
      >
        <div style={{
          background: 'rgba(0,0,0,0.72)',
          border: '1px solid #facc15',
          borderRadius: 4,
          padding: '2px 6px',
          color: '#facc15',
          fontSize: 11,
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
        }}>
          {draft.distance >= 0 ? '+' : ''}{draft.distance.toFixed(3)} m
        </div>
      </Html>
    </group>
  );
}
