'use client';
/**
 * studio/viewport/GridFloor.tsx
 *
 * Infinite grid + cardinal origin cross (Blender-style).
 * Drop into any R3F Canvas.
 */

import React from 'react';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';

const FLOOR_Y = -0.78;

function OriginCross({
  y = FLOOR_Y,
  length = 50,
  opacity = 0.55,
}: {
  y?: number;
  length?: number;
  opacity?: number;
}) {
  const matRed   = React.useMemo(() => new THREE.LineBasicMaterial({ color: '#E8503A', transparent: true, opacity, depthTest: false }), [opacity]);
  const matGreen = React.useMemo(() => new THREE.LineBasicMaterial({ color: '#6DBF67', transparent: true, opacity, depthTest: false }), [opacity]);

  const gXPos = React.useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, y, 0), new THREE.Vector3( length, y, 0)]), [y, length]);
  const gXNeg = React.useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, y, 0), new THREE.Vector3(-length, y, 0)]), [y, length]);
  const gZPos = React.useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, y, 0), new THREE.Vector3(0, y,  length)]), [y, length]);
  const gZNeg = React.useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, y, 0), new THREE.Vector3(0, y, -length)]), [y, length]);

  return (
    <group renderOrder={999}>
      <primitive object={new THREE.Line(gXPos, matRed)} />
      <primitive object={new THREE.Line(gXNeg, matRed)} />
      <primitive object={new THREE.Line(gZPos, matGreen)} />
      <primitive object={new THREE.Line(gZNeg, matGreen)} />
      <mesh position={[0, y + 0.002, 0]} renderOrder={999} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.012, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} depthTest={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export interface GridFloorProps {
  /** Floor Y level */
  y?: number;
  /** Cell size in world units */
  cellSize?: number;
  /** Show origin cross */
  showCross?: boolean;
}

export function GridFloor({ y = FLOOR_Y, cellSize = 0.5, showCross = true }: GridFloorProps) {
  return (
    <>
      <Grid
        position={[0, y, 0]}
        args={[100, 100]}
        cellSize={cellSize}
        cellThickness={0.4}
        cellColor="#2a2a2a"
        sectionSize={cellSize * 4}
        sectionThickness={0.8}
        sectionColor="#333333"
        fadeDistance={22}
        fadeStrength={1.4}
        infiniteGrid
      />
      {showCross && <OriginCross y={y} />}
    </>
  );
}
