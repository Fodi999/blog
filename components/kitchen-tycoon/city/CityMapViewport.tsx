/**
 * city/CityMapViewport.tsx
 * R3F Canvas for the city RTS view.
 *
 * Data flow:
 *   useCityMap() → fetch GET /api/city/map → CityMap JSON
 *   CityRenderer receives CityMap and renders it (footprints, polylines, polygons)
 *   Falls back to static procedural layers when loading or unauthenticated.
 */
'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

// Suppress deprecated THREE.Clock warning (R3F internal, non-actionable)
if (typeof window !== 'undefined') {
  const origWarn = console.warn.bind(console);
  (console as any).warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return;
    origWarn(...args);
  };
}
import { CityCamera } from './CityCamera';
import { CitySkyBackdrop } from './CitySkyBackdrop';
import { CityRenderer } from './CityRenderer';
import { TerrainMesh } from './TerrainMesh';
import { useCityMap } from '@/hooks/useCityMap';
import type { CityCameraDirection } from '../engine/game-store';
import type { DistrictId } from '../world/city-map';

interface Props {
  cameraDirection: CityCameraDirection;
  zoom: number;
  showGrid: boolean;
  showOverlay: boolean;
  selectedDistrictId: DistrictId | null;
  playerLevel: number;
  onSelectDistrict: (id: DistrictId) => void;
}

export function CityMapViewport({
  cameraDirection,
  zoom,
  showGrid,
  showOverlay,
  selectedDistrictId,
  playerLevel,
  onSelectDistrict,
}: Props) {
  const { map } = useCityMap();

  // Backend ships real metres. Wrap the city in a scaled group so the camera
  // sees a manageable extent (default 0.05 → 1 km city ≈ 50 world units).
  const renderScale = map?.units?.renderScaleHint ?? 0.05;

  // Fog distances ship in real metres — scale to post-scale world units.
  const fogColor = map?.ground.fogColor ?? '#7ab0e8';
  const fogNear  = (map?.ground.fogNear ?? 400)  * renderScale;
  const fogFar   = (map?.ground.fogFar  ?? 1500) * renderScale;

  // Auto-offset terrain so its peaks sit just below y=0 (where districts/roads live).
  const terrainOffsetY = map?.terrain
    ? -(map.terrain.maxHeight) - 0.2
    : -1.6;

  return (
    <Canvas
      camera={{ position: [60, 55, 60], fov: 55, near: 0.5, far: 600 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMapping: 4 /* ACESFilmic */, toneMappingExposure: 0.9 }}
      shadows="basic"
      style={{ background: 'transparent' }}
      onCreated={({ scene, gl }) => {
        scene.background = null;
        gl.shadowMap.type = THREE.PCFShadowMap;
        gl.setClearAlpha(0);
      }}
    >
      {/* Declarative fog reacts to map data without remounting the Canvas. */}
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

      <Suspense fallback={null}>
        {/* ── Lighting ─────────────────────────────────────────────────── */}
        {/* Ambient: soft fill, no colour cast */}
        <ambientLight intensity={0.55} color="#d8e8f0" />
        {/* Main sun — warm, from upper-right */}
        <directionalLight
          position={[60, 90, 40]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.5}
          shadow-camera-far={300}
          shadow-camera-left={-120}
          shadow-camera-right={120}
          shadow-camera-top={120}
          shadow-camera-bottom={-120}
          color="#fff4d6"
        />
        {/* Sky fill — cool blue from opposite side */}
        <directionalLight position={[-25, 20, -25]} intensity={0.4} color="#a8c8ff" />
        {/* Back rim — very subtle */}
        <directionalLight position={[0, 15, 40]} intensity={0.25} color="#e8f0ff" />
        {/* Hemisphere: sky blue top, warm sand bottom */}
        <hemisphereLight args={['#b8d4ff', '#c8b87a', 0.5]} />

        {/* Sky backdrop */}
        <CitySkyBackdrop />

        {/* ── World group — backend uses real metres, we scale here ───── */}
        <group scale={renderScale}>
          {/* Terrain & build-mode grid (in real-metre coordinates). */}
          {map?.terrain ? (
            <>
              <TerrainMesh terrain={map.terrain} offsetY={terrainOffsetY} />
              {showGrid && (() => {
                const gridSize = Math.ceil(Math.max(map.bounds.width, map.bounds.depth) + 40);
                const divisions = Math.min(120, Math.max(20, Math.round(gridSize / 16)));
                return (
                  <gridHelper
                    args={[gridSize, divisions, '#1a2a1a', '#0f1a0f']}
                    position={[0, 0.1, 0]}
                  />
                );
              })()}
            </>
          ) : null}

          {/* City geometry — districts, roads, buildings (real metres). */}
          {map ? (
            <CityRenderer
              map={map}
              selectedDistrictId={selectedDistrictId}
              onSelectDistrict={(id) => onSelectDistrict(id as DistrictId)}
            />
          ) : null}
        </group>

        {/* ── Fallback — nothing while map is loading ─────────────────── */}
        {/* (no procedural fallback — avoids ghost city overlapping backend map) */}
      </Suspense>

      {/* Camera — outside Suspense so it always runs */}
      <CityCamera direction={cameraDirection} zoom={zoom} />
    </Canvas>
  );
}


