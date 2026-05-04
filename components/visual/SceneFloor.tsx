'use client';

/**
 * SceneFloor — shared sci-fi grid floor for the whole 3D scene.
 *
 * Layers (bottom → top):
 *   1. Solid dark base plate (receives shadows)
 *   2. Main grid — thin emissive lines (custom, not gridHelper)
 *   3. Cross-accent lines every N cells (brighter)
 *   4. Subtle radial fade vignette (plane + radial gradient texture)
 */

import { useMemo } from 'react';
import * as THREE from 'three';

interface SceneFloorProps {
  /** Total floor size in scene units. Default 60. */
  size?: number;
  /** Number of grid cells per side. Default 30 (= 2 units per cell). */
  divisions?: number;
  /** Main grid line color. Default dark blue-grey. */
  gridColor?: string;
  /** Accent line color (every 5th line). Default brighter blue-grey. */
  accentColor?: string;
  /** Base plate color. */
  baseColor?: string;
  /** Y position of the floor. Default -0.25. */
  y?: number;
}

/** Build a Float32Array of line segment positions for a grid on the XZ plane. */
function buildGridPositions(
  size: number,
  divisions: number,
): Float32Array {
  const half = size / 2;
  const step = size / divisions;
  const positions: number[] = [];

  for (let i = 0; i <= divisions; i++) {
    const t = -half + i * step;
    // line along X
    positions.push(-half, 0, t,  half, 0, t);
    // line along Z
    positions.push(t, 0, -half,  t, 0,  half);
  }
  return new Float32Array(positions);
}

/** Build positions for accent lines (every `nth` cell). */
function buildAccentPositions(
  size: number,
  divisions: number,
  nth: number,
): Float32Array {
  const half = size / 2;
  const step = size / divisions;
  const positions: number[] = [];

  for (let i = 0; i <= divisions; i++) {
    if (i % nth !== 0) continue;
    const t = -half + i * step;
    positions.push(-half, 0, t,  half, 0, t);
    positions.push(t, 0, -half,  t, 0,  half);
  }
  return new Float32Array(positions);
}

/** Radial gradient texture — dark center transparent, opaque at edges. */
function buildVignetteTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2, size / 2, size * 0.2,
    size / 2, size / 2, size * 0.72,
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export function SceneFloor({
  size = 60,
  divisions = 30,
  gridColor = '#1a2744',
  accentColor = '#2a4070',
  baseColor = '#020609',
  y = -0.26,
}: SceneFloorProps) {
  // ── main grid geometry ────────────────────────────────────────────────────
  const gridGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(buildGridPositions(size, divisions), 3));
    return geo;
  }, [size, divisions]);

  // ── accent grid geometry ──────────────────────────────────────────────────
  const accentGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(buildAccentPositions(size, divisions, 5), 3));
    return geo;
  }, [size, divisions]);

  // ── vignette texture (only on client) ────────────────────────────────────
  const vignetteTex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return buildVignetteTexture();
  }, []);

  const gridMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: gridColor, transparent: true, opacity: 0.7 }),
    [gridColor],
  );

  const accentMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 1.0 }),
    [accentColor],
  );

  return (
    <group position={[0, y, 0]}>
      {/* ── 1. Solid dark base plate ── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          color={baseColor}
          roughness={0.95}
          metalness={0.08}
        />
      </mesh>

      {/* ── 2. Main grid lines ── */}
      <lineSegments geometry={gridGeo} material={gridMat} />

      {/* ── 3. Accent lines (every 5th) ── */}
      <lineSegments geometry={accentGeo} material={accentMat} />

      {/* ── 4. Central glow spot under origin ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[18, 18]} />
        <meshBasicMaterial color="#0d1f3c" transparent opacity={0.55} depthWrite={false} />
      </mesh>

      {/* ── 5. Vignette fade at edges ── */}
      {vignetteTex && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial
            map={vignetteTex}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
