'use client';

/**
 * SceneFloor — Plasticity-style infinite grid floor.
 *
 * Supports three real-world unit modes:
 *   mm  — 1 mm cells,  10 mm sections
 *   cm  — 1 cm cells,  10 cm sections
 *   m   — 10 cm cells,  1 m  sections   (default)
 *
 * Uses drei <Grid> (shader-based infinite grid — no CPU geometry limit).
 * X-axis (red) and Z-axis (green) drawn with custom BufferGeometry.
 *
 * All distances in metres (Three.js world units = 1 unit = 1 m).
 */

import { useMemo } from 'react';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';

// ── Unit definitions ──────────────────────────────────────────────────────────

export type GridUnit = 'mm' | 'cm' | 'm';

/**
 * | unit | cellSize | sectionSize | cell label   | section label |
 * |------|----------|-------------|--------------|---------------|
 * | mm   | 0.001 m  | 0.010 m     | 1 mm         | 10 mm         |
 * | cm   | 0.010 m  | 0.100 m     | 1 cm         | 10 cm         |
 * | m    | 0.100 m  | 1.000 m     | 10 cm        | 1 m           |
 */
export const GRID_UNIT_PARAMS: Record<
  GridUnit,
  {
    cellSize: number;
    sectionSize: number;
    fadeDistance: number;
    cellLabel: string;
    sectionLabel: string;
  }
> = {
  mm: { cellSize: 0.001, sectionSize: 0.01,  fadeDistance: 0.5,  cellLabel: '1 mm',  sectionLabel: '10 mm' },
  cm: { cellSize: 0.01,  sectionSize: 0.1,   fadeDistance: 5,    cellLabel: '1 cm',  sectionLabel: '10 cm' },
  m:  { cellSize: 0.1,   sectionSize: 1.0,   fadeDistance: 50,   cellLabel: '10 cm', sectionLabel: '1 m'   },
};

// ── Axis geometry (X = red, Z = green) ───────────────────────────────────────

function buildAxisGeometry(size: number): THREE.BufferGeometry {
  const half = size / 2;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(
    new Float32Array([
      -half, 0, 0,   half, 0, 0,   // X
       0, 0, -half,  0, 0,  half,  // Z
    ]), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(
    new Float32Array([
      0.85, 0.18, 0.18,  0.85, 0.18, 0.18,  // X — red
      0.18, 0.75, 0.35,  0.18, 0.75, 0.35,  // Z — green
    ]), 3));
  return geo;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SceneFloorProps {
  /** Background plane + axis size in metres. Default 80. */
  size?: number;
  /** Real-world unit mode. Default 'm'. */
  unit?: GridUnit;
  /** Y position. Default -0.001. */
  y?: number;
  /** @deprecated kept for backward compat — use `unit` instead. */
  divisions?: number;
}

export function SceneFloor({ size = 80, unit = 'm', y = -0.001 }: SceneFloorProps) {
  const { cellSize, sectionSize, fadeDistance } = GRID_UNIT_PARAMS[unit];

  const axisGeo = useMemo(() => buildAxisGeometry(size), [size]);
  const axisMat = useMemo(
    () => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 }),
    [],
  );

  return (
    <group position={[0, y, 0]}>
      {/* Base plate — Blender mid-gray */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#3d3d3d" roughness={0.95} metalness={0} />
      </mesh>

      {/* Infinite shader grid — minor + major lines */}
      <Grid
        position={[0, 0.001, 0]}
        args={[size, size]}
        cellSize={cellSize}
        cellColor="#4d4d4d"
        cellThickness={0.5}
        sectionSize={sectionSize}
        sectionColor="#6a6a6a"
        sectionThickness={1.2}
        fadeDistance={fadeDistance}
        fadeStrength={1.5}
        infiniteGrid
        followCamera
      />

      {/* X = red,  Z = green */}
      <lineSegments geometry={axisGeo} material={axisMat} />
    </group>
  );
}
