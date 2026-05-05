/**
 * kitchen-tycoon/viewport/KitchenLocation.tsx
 *
 * Self-contained "кухня" — стены, пол, потолок и плитка
 * собраны из GLB-примитивов, загруженных напрямую с Rust-бэкенда.
 *
 * Структура:
 *   Floor       — деревянный пол (1 плоский куб)
 *   Tiles       — плитка (тонкий куб поверх пола, 4×4 блоки)
 *   Wall_N      — северная стена (позади игрока)
 *   Wall_S      — южная стена (у камеры — полупрозрачная, чтобы видеть внутрь)
 *   Wall_W      — западная стена
 *   Wall_E      — восточная стена
 *   Ceiling     — потолок
 *   BaseBoardN/W/E — плинтусы
 *   Skirting    — тёмная полоса у пола на стенах
 *
 * Все геометрии = один shape_cube с разными scale/position.
 * Нет Three.js-only BoxGeometry здесь — только GLB с бэкенда.
 */
'use client';

import { Suspense, type ReactElement } from 'react';
import { RoomPiece } from './RoomPiece';

// ── Размеры комнаты ───────────────────────────────────────────────────────────
const W  = 10;   // ширина (X)
const D  = 8;    // глубина (Z)
const H  = 2.8;  // высота (Y)
const WT = 0.15; // толщина стены

// Цвета
const CLR = {
  floor:        '#5c3d1e',   // тёмное дерево
  floorEdge:    '#3b2512',
  tile:         '#d4c9a8',   // светлая плитка
  tileGrout:    '#9e9480',
  wallMain:     '#c8b99a',   // кремовая штукатурка
  wallDark:     '#b5a48a',
  wallSouth:    '#b0a48e',   // чуть темнее (видна у камеры)
  ceiling:      '#ede7d9',   // белёный потолок
  skirting:     '#4a3a28',   // тёмный плинтус
};

// ── Небольшая решётка тайлов на полу ─────────────────────────────────────────
function FloorTiles() {
  const tileW  = 1.0;
  const tileD  = 1.0;
  const thick  = 0.012;
  const gap    = 0.04;
  const cols   = Math.floor(W / tileW);
  const rows   = Math.floor(D / tileD);
  const tiles: ReactElement[] = [];

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const px = -W / 2 + (c + 0.5) * tileW;
      const pz = -D / 2 + (r + 0.5) * tileD;
      // alternate darker tile every other diagonal
      const dark = (c + r) % 2 === 1;
      tiles.push(
        <RoomPiece
          key={`tile_${c}_${r}`}
          slug="shape_cube"
          position={[px, thick / 2 + 0.002, pz]}
          scale={[tileW - gap, thick, tileD - gap]}
          color={dark ? CLR.tileGrout : CLR.tile}
          roughness={0.6}
          receiveShadow
        />
      );
    }
  }
  return <>{tiles}</>;
}

// ── Плинтус по периметру ──────────────────────────────────────────────────────
function Skirtings() {
  const sh = 0.12;  // высота плинтуса
  const sd = 0.06;  // толщина
  return (
    <>
      {/* North */}
      <RoomPiece slug="shape_cube" position={[0, sh / 2, -D / 2 + sd / 2]}
        scale={[W, sh, sd]} color={CLR.skirting} roughness={0.9} receiveShadow />
      {/* South */}
      <RoomPiece slug="shape_cube" position={[0, sh / 2, D / 2 - sd / 2]}
        scale={[W, sh, sd]} color={CLR.skirting} roughness={0.9} receiveShadow />
      {/* West */}
      <RoomPiece slug="shape_cube" position={[-W / 2 + sd / 2, sh / 2, 0]}
        scale={[sd, sh, D]} color={CLR.skirting} roughness={0.9} receiveShadow />
      {/* East */}
      <RoomPiece slug="shape_cube" position={[W / 2 - sd / 2, sh / 2, 0]}
        scale={[sd, sh, D]} color={CLR.skirting} roughness={0.9} receiveShadow />
    </>
  );
}

// ── Главный компонент локации ─────────────────────────────────────────────────
export function KitchenLocation() {
  return (
    <group name="kitchen-location">

      {/* ── Пол ── */}
      <RoomPiece
        slug="shape_cube"
        position={[0, -0.05, 0]}
        scale={[W, 0.1, D]}
        color={CLR.floor}
        roughness={0.92}
        receiveShadow
      />

      {/* ── Плитка поверх пола ── */}
      <Suspense fallback={null}>
        <FloorTiles />
      </Suspense>

      {/* ── Потолок ── */}
      <RoomPiece
        slug="shape_cube"
        position={[0, H + 0.05, 0]}
        scale={[W + WT * 2, 0.1, D + WT * 2]}
        color={CLR.ceiling}
        roughness={0.95}
        receiveShadow
      />

      {/* ── Северная стена (дальняя) ── */}
      <RoomPiece
        slug="shape_cube"
        position={[0, H / 2, -D / 2 - WT / 2]}
        scale={[W + WT * 2, H, WT]}
        color={CLR.wallMain}
        roughness={0.85}
        receiveShadow
        castShadow
      />

      {/* ── Южная стена (ближняя — полупрозрачная) ── */}
      <RoomPiece
        slug="shape_cube"
        position={[0, H / 2, D / 2 + WT / 2]}
        scale={[W + WT * 2, H, WT]}
        color={CLR.wallSouth}
        roughness={0.85}
        transparent
        opacity={0.3}
      />

      {/* ── Западная стена ── */}
      <RoomPiece
        slug="shape_cube"
        position={[-W / 2 - WT / 2, H / 2, 0]}
        scale={[WT, H, D]}
        color={CLR.wallDark}
        roughness={0.85}
        receiveShadow
        castShadow
      />

      {/* ── Восточная стена ── */}
      <RoomPiece
        slug="shape_cube"
        position={[W / 2 + WT / 2, H / 2, 0]}
        scale={[WT, H, D]}
        color={CLR.wallDark}
        roughness={0.85}
        receiveShadow
        castShadow
      />

      {/* ── Плинтусы ── */}
      <Suspense fallback={null}>
        <Skirtings />
      </Suspense>

    </group>
  );
}

/** Экспорт размеров для других компонентов */
export const ROOM = { W, D, H, WT } as const;
