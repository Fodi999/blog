'use client';
/**
 * studio/viewport/StudioViewport.tsx
 *
 * Full viewport shell: Canvas + Camera + Grid + Lights.
 * Compose specific scene objects as children.
 *
 * Usage:
 *   <StudioViewport>
 *     <KitchenObject obj={obj} />
 *   </StudioViewport>
 */

import React from 'react';
import { Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';
import { StudioCanvas } from './StudioCanvas';
import { CameraRig } from './CameraRig';
import { GridFloor } from './GridFloor';
import { Lights } from './Lights';
import type { LightingPreset, RenderQuality, ViewMode } from '../core/types';

export interface StudioViewportProps {
  children?: React.ReactNode;
  className?: string;
  quality?: RenderQuality;
  lighting?: LightingPreset;
  showGrid?: boolean;
  controlsRef?: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
}

export function StudioViewport({
  children,
  className = '',
  quality = 'hd',
  lighting = 'cleanProduct',
  showGrid = true,
  controlsRef,
}: StudioViewportProps) {
  return (
    <StudioCanvas quality={quality} className={`h-full w-full ${className}`}>
      <Suspense fallback={null}>
        <CameraRig controlsRef={controlsRef} />
        <Lights preset={lighting} />
        {showGrid && <GridFloor />}
        {children}
      </Suspense>
    </StudioCanvas>
  );
}
