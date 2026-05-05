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
import { CityGround } from './CityGround';
import { CityDistrictsLayer } from './CityDistrictsLayer';
import { CityBlocksLayer } from './CityBlocksLayer';
import { CitySkyBackdrop } from './CitySkyBackdrop';
import { CityRenderer } from './CityRenderer';
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
  const { map, loading } = useCityMap();

  return (
    <Canvas
      camera={{ position: [20, 18, 20], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      shadows="basic"
      style={{ background: 'transparent' }}
      onCreated={({ scene, gl }) => {
        scene.background = null;
        const fogColor = map?.ground.fogColor ?? '#7ab0e8';
        const fogNear  = map?.ground.fogNear  ?? 80;
        const fogFar   = map?.ground.fogFar   ?? 220;
        scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
        gl.shadowMap.type = THREE.PCFShadowMap;
        gl.setClearAlpha(0);
      }}
    >
      <Suspense fallback={null}>
        {/* ── Lighting ─────────────────────────────────────────────────── */}
        <ambientLight intensity={2.2} color="#ccdcff" />
        <directionalLight
          position={[30, 50, 20]}
          intensity={3.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.5}
          shadow-camera-far={150}
          shadow-camera-left={-70}
          shadow-camera-right={70}
          shadow-camera-top={70}
          shadow-camera-bottom={-70}
          color="#fff4d6"
        />
        <directionalLight position={[-25, 20, -25]} intensity={1.4} color="#a8c8ff" />
        <directionalLight position={[0, 15, 40]} intensity={1.0} color="#e8f0ff" />
        <hemisphereLight args={['#b8d4ff', '#e8c88a', 1.2]} />

        {/* Sky backdrop */}
        <CitySkyBackdrop />

        {/* Ground plane */}
        <CityGround
          showGrid={showGrid}
          size={90}
          color={map?.ground.color}
        />

        {/* ── City geometry ──────────────────────────────────────────── */}
        {map ? (
          // Backend-driven renderer — real polygon/polyline geometry
          <CityRenderer
            map={map}
            selectedDistrictId={selectedDistrictId}
            onSelectDistrict={(id) => onSelectDistrict(id as DistrictId)}
          />
        ) : (
          // Fallback: static procedural layers while loading / offline
          <>
            <CityBlocksLayer playerLevel={playerLevel} selectedId={selectedDistrictId} />
            <CityDistrictsLayer
              selectedId={selectedDistrictId}
              playerLevel={playerLevel}
              showOverlay={showOverlay}
              onSelect={onSelectDistrict}
            />
          </>
        )}
      </Suspense>

      {/* Camera — outside Suspense so it always runs */}
      <CityCamera direction={cameraDirection} zoom={zoom} />
    </Canvas>
  );
}


