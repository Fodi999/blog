'use client';
/**
 * studio/viewport/Lights.tsx
 *
 * Studio lighting presets — wrap in R3F Canvas.
 */

import { Environment } from '@react-three/drei';
import type { LightingPreset } from '../core/types';

const PRESET_ENV: Record<LightingPreset, string> = {
  softFood:     'apartment',
  cleanProduct: 'city',
  studio:       'studio',
  outdoor:      'park',
};

export interface LightsProps {
  preset?: LightingPreset;
  /** 0..2, default 1 */
  exposure?: number;
}

export function Lights({ preset = 'cleanProduct', exposure = 1 }: LightsProps) {
  return (
    <>
      {/* Key */}
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      {/* Fill */}
      <directionalLight position={[-4, 4, -3]} intensity={0.4} />
      {/* Rim */}
      <directionalLight position={[0, -2, -5]} intensity={0.2} />
      {/* Ambient */}
      <ambientLight intensity={0.35} />
      {/* HDRI */}
      <Environment
        preset={PRESET_ENV[preset] as Parameters<typeof Environment>[0]['preset']}
        environmentIntensity={exposure}
      />
    </>
  );
}
