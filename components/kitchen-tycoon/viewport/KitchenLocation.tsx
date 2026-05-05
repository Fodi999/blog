/**
 * kitchen-tycoon/viewport/KitchenLocation.tsx
 *
 * Industrial dark kitchen — стены/пол/плитка из GLB (Rust backend).
 * Без потолка (tycoon-камера). Вместо него:
 *   – верхний бортик стен
 *   – точечные лампы вдоль северной стены
 *
 * Цвета: industrial dark (#2b-#3a palette), не домашняя бежевая.
 */
'use client';

import { Suspense, type ReactElement } from 'react';
import { RoomPiece } from './RoomPiece';

// ── Размеры комнаты ───────────────────────────────────────────────────────────
const W  = 10;
const D  = 8;
const H  = 2.8;
const WT = 0.15;

// ── Industrial dark palette ───────────────────────────────────────────────────
const CLR = {
  floor:     '#2b2a27',
  tileA:     '#2f2d2a',
  tileB:     '#383530',
  wallMain:  '#4a423a',
  wallSide:  '#3a342f',
  wallSouth: '#3a342f',
  skirting:  '#171717',
  topBorder: '#1a1815',
  lampBody:  '#9ca3af',
  lampLight: '#facc15',
};

// ── Плитка пола (тёмная шахматка) ────────────────────────────────────────────
function FloorTiles() {
  const tileW = 1.0;
  const tileD = 1.0;
  const thick = 0.014;
  const gap   = 0.045;
  const cols  = Math.floor(W / tileW);
  const rows  = Math.floor(D / tileD);
  const tiles: ReactElement[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const px = -W / 2 + (c + 0.5) * tileW;
      const pz = -D / 2 + (r + 0.5) * tileD;
      tiles.push(
        <RoomPiece
          key={`t_${c}_${r}`}
          position={[px, thick / 2 + 0.002, pz]}
          scale={[tileW - gap, thick, tileD - gap]}
          color={(c + r) % 2 === 0 ? CLR.tileA : CLR.tileB}
          roughness={0.55}
          metalness={0.08}
          receiveShadow
        />
      );
    }
  }
  return <>{tiles}</>;
}

// ── Плинтусы ──────────────────────────────────────────────────────────────────
function Skirtings() {
  const sh = 0.1;
  const sd = 0.055;
  return (
    <>
      <RoomPiece position={[0, sh / 2, -D / 2 + sd / 2]}       scale={[W, sh, sd]}  color={CLR.skirting} roughness={0.95} receiveShadow />
      <RoomPiece position={[0, sh / 2,  D / 2 - sd / 2]}       scale={[W, sh, sd]}  color={CLR.skirting} roughness={0.95} receiveShadow />
      <RoomPiece position={[-W / 2 + sd / 2, sh / 2, 0]}       scale={[sd, sh, D]}  color={CLR.skirting} roughness={0.95} receiveShadow />
      <RoomPiece position={[ W / 2 - sd / 2, sh / 2, 0]}       scale={[sd, sh, D]}  color={CLR.skirting} roughness={0.95} receiveShadow />
    </>
  );
}

// ── Верхний бортик стен (вместо потолка) ──────────────────────────────────────
function TopBorders() {
  const bh = 0.18;  // высота бортика
  const bd = WT;
  return (
    <>
      {/* North */}
      <RoomPiece position={[0, H - bh / 2, -D / 2 - bd / 2]}     scale={[W + bd * 2, bh, bd]}  color={CLR.topBorder} roughness={0.9} castShadow />
      {/* West */}
      <RoomPiece position={[-W / 2 - bd / 2, H - bh / 2, 0]}     scale={[bd, bh, D]}            color={CLR.topBorder} roughness={0.9} castShadow />
      {/* East */}
      <RoomPiece position={[ W / 2 + bd / 2, H - bh / 2, 0]}     scale={[bd, bh, D]}            color={CLR.topBorder} roughness={0.9} castShadow />
    </>
  );
}

// ── Потолочные лампы (3 вдоль северной стены, тянутся вперёд) ─────────────────
function CeilingLamps() {
  const positions: [number, number, number][] = [
    [-3.2, H - 0.06, -2.5],
    [ 0.0, H - 0.06, -2.5],
    [ 3.2, H - 0.06, -2.5],
  ];
  return (
    <>
      {positions.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          {/* корпус лампы */}
          <RoomPiece position={[0, 0, 0]}       scale={[0.28, 0.06, 0.28]} color={CLR.lampBody}  roughness={0.3} metalness={0.7} />
          {/* рассеиватель (жёлтый) */}
          <RoomPiece position={[0, -0.045, 0]}  scale={[0.22, 0.02, 0.22]} color={CLR.lampLight} roughness={0.2} metalness={0.1} />
          {/* штанга к потолку */}
          <RoomPiece position={[0, 0.12, 0]}    scale={[0.03, 0.24, 0.03]} color={CLR.skirting}  roughness={0.9} />
          {/* R3F pointLight — не GLB, чистый Three.js */}
          <pointLight
            position={[0, -0.15, 0]}
            intensity={1.8}
            distance={4.5}
            color="#ffe8a0"
            castShadow={false}
          />
        </group>
      ))}
    </>
  );
}

// ── Главный компонент ─────────────────────────────────────────────────────────
export function KitchenLocation() {
  return (
    <group name="kitchen-location">

      {/* Пол */}
      <RoomPiece
        position={[0, -0.05, 0]}
        scale={[W, 0.1, D]}
        color={CLR.floor}
        roughness={0.95}
        receiveShadow
      />

      {/* Плитка */}
      <Suspense fallback={null}>
        <FloorTiles />
      </Suspense>

      {/* Северная стена */}
      <RoomPiece
        position={[0, H / 2, -D / 2 - WT / 2]}
        scale={[W + WT * 2, H, WT]}
        color={CLR.wallMain}
        roughness={0.88}
        receiveShadow castShadow
      />

      {/* Южная стена — полупрозрачная */}
      <RoomPiece
        position={[0, H / 2, D / 2 + WT / 2]}
        scale={[W + WT * 2, H, WT]}
        color={CLR.wallSouth}
        roughness={0.88}
        transparent
        opacity={0.15}
      />

      {/* Западная стена */}
      <RoomPiece
        position={[-W / 2 - WT / 2, H / 2, 0]}
        scale={[WT, H, D]}
        color={CLR.wallSide}
        roughness={0.88}
        receiveShadow castShadow
      />

      {/* Восточная стена */}
      <RoomPiece
        position={[W / 2 + WT / 2, H / 2, 0]}
        scale={[WT, H, D]}
        color={CLR.wallSide}
        roughness={0.88}
        receiveShadow castShadow
      />

      {/* Плинтусы */}
      <Suspense fallback={null}>
        <Skirtings />
      </Suspense>

      {/* Верхний бортик */}
      <Suspense fallback={null}>
        <TopBorders />
      </Suspense>

      {/* Лампы + pointLights */}
      <CeilingLamps />

    </group>
  );
}

export const ROOM = { W, D, H, WT } as const;
