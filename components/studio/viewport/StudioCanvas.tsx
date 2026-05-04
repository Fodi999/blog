'use client';
/**
 * studio/viewport/StudioCanvas.tsx
 *
 * R3F Canvas with standard Studio settings.
 * All scenes in the Studio share this Canvas config.
 */

import React from 'react';
import { Canvas } from '@react-three/fiber';
import type { RenderQuality } from '../core/types';

const DPR: Record<RenderQuality, [number, number]> = {
  low:   [0.5, 0.75],
  sd:    [0.75, 1],
  hd:    [1, 1.5],
  ultra: [1.5, 2],
};

export interface StudioCanvasProps {
  children: React.ReactNode;
  quality?: RenderQuality;
  className?: string;
  /** Called with the WebGLRenderer once created */
  onCreated?: (gl: { gl: import('three').WebGLRenderer }) => void;
}

export function StudioCanvas({
  children,
  quality = 'hd',
  className = '',
  onCreated,
}: StudioCanvasProps) {
  return (
    <Canvas
      className={className}
      dpr={DPR[quality]}
      camera={{ position: [0, 1.4, 3.5], fov: 42, near: 0.05, far: 200 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      shadows="soft"
      onCreated={onCreated}
    >
      {children}
    </Canvas>
  );
}
