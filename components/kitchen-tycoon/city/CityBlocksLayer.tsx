/**
 * city/CityBlocksLayer.tsx
 *
 * Procedural city blockout:
 *  - Residential blocks  → short grey cubes
 *  - Office blocks       → tall dark cubes
 *  - Shop units          → low cube with coloured roof
 *  - Competitor spots    → small red-tagged cube
 *  - Roads               → dark flat strips between blocks
 *  - Player spot         → yellow glowing marker
 */
'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { DISTRICT_LIST, type DistrictId } from '../world/city-map';

// ── Layout constants (must match CityDistrictsLayer) ──────────────────────
const CELL_W = 18;
const CELL_H = 14;

function districtCenter(col: number, row: number) {
  return {
    x: (col - 1) * CELL_W,
    z: (row - 1) * CELL_H,
  };
}

// ── Seeded pseudo-random (no Math.random so layout is stable) ─────────────
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Road strips inside a district ─────────────────────────────────────────
function DistrictRoads({ cx, cz, districtId }: { cx: number; cz: number; districtId: string }) {
  return (
    <group position={[cx, 0.015, cz]}>
      {/* Horizontal road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CELL_W - 2, 1.2]} />
        <meshStandardMaterial color="#4a4a52" roughness={1} />
      </mesh>
      {/* Vertical road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, CELL_H - 2]} />
        <meshStandardMaterial color="#4a4a52" roughness={1} />
      </mesh>
      {/* Road markings */}
      {[-3, 0, 3].map((ox) => (
        <mesh key={ox} position={[ox, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, 0.8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── One residential block (short grey cube cluster) ───────────────────────
function ResidentialBlock({ x, z, rng }: { x: number; z: number; rng: () => number }) {
  const h = 0.6 + rng() * 0.8;
  const w = 1.2 + rng() * 0.8;
  const d = 1.0 + rng() * 0.6;
  const gray = Math.floor(130 + rng() * 60);
  const color = `rgb(${gray},${gray - 2},${gray - 6})`;
  return (
    <mesh position={[x, h / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

// ── One office block (tall dark cube) ─────────────────────────────────────
function OfficeBlock({ x, z, rng, accent }: { x: number; z: number; rng: () => number; accent: string }) {
  const h = 2.5 + rng() * 4;
  const w = 1.4 + rng() * 0.6;
  const d = 1.4 + rng() * 0.6;
  return (
    <group position={[x, 0, z]}>
      {/* Main body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#7a8898" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Accent strip on top */}
      <mesh position={[0, h + 0.05, 0]}>
        <boxGeometry args={[w + 0.05, 0.1, d + 0.05]} />
        <meshBasicMaterial color={accent} transparent opacity={0.8} />
      </mesh>
      {/* Window grid (glass reflection) */}
      <mesh position={[0, h / 2, d / 2 + 0.01]}>
        <planeGeometry args={[w * 0.85, h * 0.85]} />
        <meshStandardMaterial
          color="#b8cce0"
          emissive="#4060c0"
          emissiveIntensity={0.15}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

// ── Shop unit (low cube + coloured roof band) ─────────────────────────────
function ShopUnit({ x, z, rng, accent }: { x: number; z: number; rng: () => number; accent: string }) {
  const h = 0.5 + rng() * 0.3;
  const w = 0.9 + rng() * 0.5;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, 0.8]} />
        <meshStandardMaterial color="#c8b89a" roughness={0.9} />
      </mesh>
      {/* Awning strip */}
      <mesh position={[0, h + 0.05, 0]}>
        <boxGeometry args={[w, 0.08, 0.85]} />
        <meshBasicMaterial color={accent} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

// ── Competitor marker (red flag cube) ─────────────────────────────────────
function CompetitorSpot({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial color="#8a3030" roughness={0.8} />
      </mesh>
      {/* Red tag on top */}
      <mesh position={[0, 0.76, 0]}>
        <boxGeometry args={[0.5, 0.12, 0.5]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      {/* Pole */}
      <mesh position={[0.28, 0.95, 0]}>
        <boxGeometry args={[0.04, 0.5, 0.04]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// ── Player spot marker (yellow glow) ─────────────────────────────────────
function PlayerSpot({ x, z, accent }: { x: number; z: number; accent: string }) {
  return (
    <group position={[x, 0, z]}>
      {/* Base pad */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 8]} />
        <meshBasicMaterial color={accent} transparent opacity={0.25} />
      </mesh>
      {/* Small building */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.4} roughness={0.5} />
      </mesh>
      {/* Flag pole */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.04, 0.6, 0.04]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      {/* Flag */}
      <mesh position={[0.2, 1.1, 0]}>
        <planeGeometry args={[0.3, 0.2]} />
        <meshBasicMaterial color={accent} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Per-district block layout ─────────────────────────────────────────────
type BlockLayout = {
  residential: Array<[number, number]>;
  offices:     Array<[number, number]>;
  shops:       Array<[number, number]>;
  competitors: Array<[number, number]>;
  playerSpots: Array<[number, number]>;
};

function generateLayout(districtId: DistrictId, cx: number, cz: number, playerLevel: number): BlockLayout {
  const rng = seeded(districtId.split('').reduce((a, c) => a + c.charCodeAt(0), 0));

  const half_w = CELL_W / 2 - 1.8;
  const half_h = CELL_H / 2 - 1.8;

  // Road divides district into 4 quadrants. We place blocks in each quadrant.
  const quadrants: Array<[number, number, number, number]> = [
    [-half_w / 2, -half_h / 2, half_w / 2 - 0.6, half_h / 2 - 0.6],  // TL
    [ half_w / 2 + 0.6, -half_h / 2, half_w, half_h / 2 - 0.6],        // TR
    [-half_w / 2, half_h / 2 + 0.6, half_w / 2 - 0.6, half_h],         // BL
    [ half_w / 2 + 0.6, half_h / 2 + 0.6, half_w, half_h],             // BR
  ];

  const residential: Array<[number, number]> = [];
  const offices:     Array<[number, number]> = [];
  const shops:       Array<[number, number]> = [];
  const competitors: Array<[number, number]> = [];
  const playerSpots: Array<[number, number]> = [];

  const isOfficeDistrict = districtId === 'office_district' || districtId === 'old_town';
  const isResidential    = districtId === 'residential_west' || districtId === 'student_area';
  const isShopping       = districtId === 'shopping_center';

  quadrants.forEach(([x1, z1, x2, z2]) => {
    const qw = Math.abs(x2 - x1);
    const qh = Math.abs(z2 - z1);
    const cols = Math.floor(qw / 2.0);
    const rows = Math.floor(qh / 2.0);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bx = cx + Math.min(x1, x2) + c * 2.0 + 1.0;
        const bz = cz + Math.min(z1, z2) + r * 2.0 + 1.0;
        const roll = rng();

        if (isShopping && roll < 0.55) {
          shops.push([bx, bz]);
        } else if (isOfficeDistrict && roll < 0.5) {
          offices.push([bx, bz]);
        } else if (isResidential && roll < 0.6) {
          residential.push([bx, bz]);
        } else if (roll < 0.3) {
          residential.push([bx, bz]);
        } else if (roll < 0.55) {
          shops.push([bx, bz]);
        } else {
          offices.push([bx, bz]);
        }

        // Occasionally place competitor
        if (rng() < 0.12) {
          competitors.push([bx + rng() * 0.5, bz + rng() * 0.5]);
        }
      }
    }
  });

  // Player spot — center of district (unlocked districts only)
  if (playerLevel >= 1) {
    playerSpots.push([cx, cz]);
  }

  return { residential, offices, shops, competitors, playerSpots };
}

// ── Main component ────────────────────────────────────────────────────────
interface Props {
  playerLevel: number;
  selectedId:  DistrictId | null;
}

export function CityBlocksLayer({ playerLevel, selectedId }: Props) {
  const layouts = useMemo(() => {
    return DISTRICT_LIST.map((d) => {
      const [col, row] = d.gridPos;
      const { x: cx, z: cz } = districtCenter(col, row);
      const locked = playerLevel < d.unlockLevel;
      return {
        d,
        cx,
        cz,
        locked,
        layout: generateLayout(d.id, cx, cz, locked ? 0 : playerLevel),
      };
    });
  }, [playerLevel]);

  return (
    <group>
      {layouts.map(({ d, cx, cz, locked, layout }) => {
        const rng = seeded(d.id.length * 31 + cx);
        const accent = locked ? '#333' : d.color;

        return (
          <group key={d.id}>
            {/* Roads */}
            <DistrictRoads cx={cx} cz={cz} districtId={d.id} />

            {/* Residential blocks */}
            {layout.residential.map(([bx, bz], i) => (
              <ResidentialBlock key={`res-${i}`} x={bx} z={bz} rng={seeded(i * 7 + bx * 13)} />
            ))}

            {/* Office blocks */}
            {layout.offices.map(([bx, bz], i) => (
              <OfficeBlock key={`off-${i}`} x={bx} z={bz} rng={seeded(i * 11 + bz * 7)} accent={accent} />
            ))}

            {/* Shops */}
            {layout.shops.map(([bx, bz], i) => (
              <ShopUnit key={`shop-${i}`} x={bx} z={bz} rng={seeded(i * 5 + bx * 3)} accent={accent} />
            ))}

            {/* Competitors */}
            {!locked && layout.competitors.map(([bx, bz], i) => (
              <CompetitorSpot key={`comp-${i}`} x={bx} z={bz} />
            ))}

            {/* Player spots */}
            {!locked && layout.playerSpots.map(([bx, bz], i) => (
              <PlayerSpot key={`player-${i}`} x={bx} z={bz} accent={d.color} />
            ))}
          </group>
        );
      })}
    </group>
  );
}
