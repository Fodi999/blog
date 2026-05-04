'use client';
/**
 * studio/handles/MeasureHandle.tsx
 *
 * Two-point ruler shown when activeTool === 'measure'.
 *
 * First click sets `from`, second click sets `to`.
 * A dashed line + HTML distance label render between the two points.
 * ESC resets to null/null.
 */

import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStudioStore } from '../engine/StudioProvider';
import { v3 } from './handle-math';
import type { MeasureDraft } from '../core/types';
import { useEffect } from 'react';

const DOT_GEO = new THREE.SphereGeometry(0.03, 10, 7);

function DashedLine({ from, to }: { from: THREE.Vector3; to: THREE.Vector3 }) {
  const points = [from, to];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#38bdf8" depthTest={false} transparent opacity={0.85} />
    </lineSegments>
  );
}

interface MeasureHandleProps {
  draft: MeasureDraft;
}

export function MeasureHandle({ draft }: MeasureHandleProps) {
  const startMeasureDraft = useStudioStore((s) => s.startMeasureDraft);
  const cancelDraft       = useStudioStore((s) => s.cancelDraft);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDraft();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancelDraft]);

  const fromPt = draft.from ? v3(draft.from) : null;
  const toPt   = draft.to   ? v3(draft.to)   : null;

  const dist = fromPt && toPt ? fromPt.distanceTo(toPt) : null;
  const midPt = fromPt && toPt
    ? new THREE.Vector3().lerpVectors(fromPt, toPt, 0.5)
    : null;

  return (
    <group>
      {/* From point */}
      {fromPt && (
        <mesh geometry={DOT_GEO} position={fromPt}>
          <meshBasicMaterial color="#38bdf8" depthTest={false} />
        </mesh>
      )}

      {/* To point */}
      {toPt && (
        <mesh geometry={DOT_GEO} position={toPt}>
          <meshBasicMaterial color="#38bdf8" depthTest={false} />
        </mesh>
      )}

      {/* Dashed line between points */}
      {fromPt && toPt && <DashedLine from={fromPt} to={toPt} />}

      {/* Distance label */}
      {midPt && dist !== null && (
        <Html
          position={midPt}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
          distanceFactor={4}
        >
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            border: '1px solid #38bdf8',
            borderRadius: 4,
            padding: '2px 7px',
            color: '#38bdf8',
            fontSize: 11,
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
          }}>
            {dist.toFixed(3)} m
          </div>
        </Html>
      )}

      {/* Hint label when waiting for first click */}
      {!fromPt && (
        <Html
          position={[0, 0.5, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
          distanceFactor={6}
        >
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            color: '#94a3b8',
            fontSize: 10,
            fontFamily: 'monospace',
            padding: '2px 6px',
            borderRadius: 3,
          }}>
            Click to set start point
          </div>
        </Html>
      )}
    </group>
  );
}
