'use client';
/**
 * studio/handles/FilletHandle.tsx
 *
 * Yellow circle manipulator shown when:
 *   activeTool === 'fillet' AND there is an active edge/face/vertex sub-selection.
 *
 * Behaviour:
 *   - Renders a yellow ring in 3D space at the edge midpoint / face center.
 *   - Drag ring up/down → radius increases/decreases.
 *   - Shift key → snaps radius to 0.05 increments.
 *   - ESC → cancelDraft()
 *   - Enter / double-click → commitDraft()
 *   - A small text label shows current radius (rendered via HTML overlay via
 *     drei <Html> so it stays readable at any camera angle).
 */

import { useRef, useCallback, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStudioStore } from '../engine/StudioProvider';
import { makeCircleLineGeo, dragDeltaToValue, v3 } from './handle-math';
import type { FilletDraft } from '../core/types';

// Reuse geometry — rebuilt only when radius changes
const ringCache = new Map<number, THREE.BufferGeometry>();
function getRingGeo(radius: number): THREE.BufferGeometry {
  const key = Math.round(radius * 1000);
  if (!ringCache.has(key)) ringCache.set(key, makeCircleLineGeo(radius));
  return ringCache.get(key)!;
}

interface FilletHandleProps {
  draft: FilletDraft;
}

export function FilletHandle({ draft }: FilletHandleProps) {
  const updateDraftRadius = useStudioStore((s) => s.updateDraftRadius);
  const cancelDraft       = useStudioStore((s) => s.cancelDraft);
  const commitDraft       = useStudioStore((s) => s.commitDraft);

  const { gl } = useThree();
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const radiusAtDragStart = useRef(draft.radius);

  const anchor = v3(draft.anchorWorld);
  const ringGeo = getRingGeo(draft.radius);

  // ── Pointer events on the ring ─────────────────────────────────────────────
  const handlePointerDown = useCallback((e: THREE.Event) => {
    const pe = e as unknown as PointerEvent;
    pe.stopPropagation?.();
    isDragging.current = true;
    dragStartY.current = pe.clientY;
    radiusAtDragStart.current = draft.radius;
    gl.domElement.setPointerCapture((e as unknown as PointerEvent).pointerId);
    document.body.style.cursor = 'ns-resize';
  }, [draft.radius, gl.domElement]);

  // Global pointer move/up while dragging
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const delta = dragStartY.current - e.clientY; // up = positive
      const snap = e.shiftKey ? 0.05 : 0;
      let newRadius = dragDeltaToValue(delta, radiusAtDragStart.current, 0.01, 1.0, 0.004);
      if (snap > 0) newRadius = Math.round(newRadius / snap) * snap;
      updateDraftRadius(newRadius);
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
  }, [updateDraftRadius]);

  // ESC to cancel, Enter to commit
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
      {/* Yellow ring — main drag target */}
      <lineLoop geometry={ringGeo}
        onPointerDown={handlePointerDown as never}
        onPointerOver={() => { document.body.style.cursor = 'ns-resize'; }}
        onPointerOut={() => { if (!isDragging.current) document.body.style.cursor = ''; }}
      >
        <lineBasicMaterial color="#facc15" linewidth={2} depthTest={false} />
      </lineLoop>

      {/* Inner fill circle — semi-transparent yellow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[draft.radius * 0.96, 64]} />
        <meshBasicMaterial
          color="#facc15"
          transparent
          opacity={0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Radius tick line — from center to ring edge */}
      <line>
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, draft.radius, 0, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#facc15" transparent opacity={0.6} depthTest={false} />
      </line>

      {/* HTML label */}
      <Html
        position={[draft.radius + 0.06, 0.04, 0]}
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
          R {draft.radius.toFixed(3)} m
        </div>
      </Html>
    </group>
  );
}
