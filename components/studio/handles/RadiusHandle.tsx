'use client';
/**
 * studio/handles/RadiusHandle.tsx
 *
 * Generic radius visualiser — a thin ring + label.
 * Reusable for both fillet and chamfer preview when radius is known
 * but full FilletHandle is not needed (e.g. read-only preview).
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { makeCircleLineGeo } from './handle-math';

interface RadiusHandleProps {
  /** World-space center */
  center: [number, number, number];
  radius: number;
  color?: string;
}

export function RadiusHandle({ center, radius, color = '#facc15' }: RadiusHandleProps) {
  const geo = useMemo(() => makeCircleLineGeo(radius), [radius]);
  return (
    <group position={center}>
      <lineLoop geometry={geo}>
        <lineBasicMaterial color={color} transparent opacity={0.7} depthTest={false} />
      </lineLoop>
    </group>
  );
}
