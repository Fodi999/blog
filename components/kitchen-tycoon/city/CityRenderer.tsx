/**
 * city/CityRenderer.tsx
 *
 * Pure renderer — receives CityMap JSON from the backend and draws it.
 * No geometry is computed here. Frontend responsibilities:
 *   - Extrude building footprints
 *   - Triangulate road polylines into ribbon meshes
 *   - Fill district/lot polygons as ground planes
 *   - Apply materials, shadows, emissive
 *
 * Architecture:
 *   CityRenderer
 *     ├── CityGroundPlane
 *     ├── CityRoadsLayer    (polylines → ribbons)
 *     ├── CityDistrictFloor (polygons → flat mesh per district)
 *     ├── CityLotsLayer     (lot polygons)
 *     └── CityBuildingsLayer (footprint extrude per building)
 */
'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type {
  CityMap,
  CityRoad,
  CityDistrict,
  CityBuilding,
  CityLot,
} from '@/types/city-api';

// ─────────────────────────────────────────────────────────────────────────────
// Main renderer
// ─────────────────────────────────────────────────────────────────────────────

interface CityRendererProps {
  map: CityMap;
  selectedDistrictId: string | null;
  onSelectDistrict: (id: string) => void;
}

export function CityRenderer({ map, selectedDistrictId, onSelectDistrict }: CityRendererProps) {
  return (
    <group>
      {/* District ground tiles */}
      {map.districts.map((d) => (
        <DistrictFloor
          key={d.id}
          district={d}
          selected={d.id === selectedDistrictId}
          onClick={() => onSelectDistrict(d.id)}
        />
      ))}

      {/* Lot overlays (grass, plazas, water) */}
      {map.districts.flatMap((d) =>
        d.lots.map((lot) => <LotMesh key={lot.id} lot={lot} />)
      )}

      {/* Roads */}
      {map.roads.map((road) => (
        <RoadRibbon key={road.id} road={road} />
      ))}

      {/* Buildings */}
      {map.districts.flatMap((d) =>
        d.buildings
          .filter((b) => b.footprint.length >= 3 && b.height > 0)
          .map((b) => <BuildingMesh key={b.id} building={b} accentColor={d.accentColor} />)
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// District floor (polygon → flat mesh)
// ─────────────────────────────────────────────────────────────────────────────

function DistrictFloor({
  district,
  selected,
  onClick,
}: {
  district: CityDistrict;
  selected: boolean;
  onClick: () => void;
}) {
  const geometry = useMemo(() => polygonGeometry(district.polygon, 0), [district.polygon]);
  const color = selected
    ? lightenHex(district.groundColor, 30)
    : district.groundColor;

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.01, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        roughness={0.95}
        metalness={0.0}
        transparent={selected}
        opacity={selected ? 0.88 : 1}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lot mesh (grass, plaza, water)
// ─────────────────────────────────────────────────────────────────────────────

function LotMesh({ lot }: { lot: CityLot }) {
  const geometry = useMemo(() => polygonGeometry(lot.polygon, 0), [lot.polygon]);
  const isWater = lot.kind === 'water';

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        color={lot.color}
        roughness={isWater ? 0.1 : 0.9}
        metalness={isWater ? 0.3 : 0.0}
        transparent={isWater}
        opacity={isWater ? 0.75 : 1}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Road ribbon (polyline → flat strip mesh)
// ─────────────────────────────────────────────────────────────────────────────

function RoadRibbon({ road }: { road: CityRoad }) {
  const { ribbonGeom, markingGeoms } = useMemo(
    () => buildRoadGeometry(road),
    [road]
  );

  return (
    <group>
      <mesh geometry={ribbonGeom} position={[0, 0.005, 0]} receiveShadow>
        <meshStandardMaterial color={road.color} roughness={0.95} metalness={0.0} />
      </mesh>
      {markingGeoms.map((g, i) => (
        <mesh key={i} geometry={g} position={[0, 0.012, 0]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Building mesh (footprint extrude)
// ─────────────────────────────────────────────────────────────────────────────

function BuildingMesh({
  building,
  accentColor,
}: {
  building: CityBuilding;
  accentColor: string;
}) {
  // ── Prefer pre-baked mesh from backend geometry kernel ─────────────────────
  const kernelGeometry = useMemo(() => {
    if (!building.mesh) return null;
    const { positions, normals, uvs, indices } = building.mesh;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute('normal',   new THREE.BufferAttribute(new Float32Array(normals),   3));
    geo.setAttribute('uv',       new THREE.BufferAttribute(new Float32Array(uvs),       2));
    geo.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    return geo;
  }, [building.mesh]);

  // ── Fallback: client-side extrude (offline / no mesh field) ───────────────
  const fallbackGeometry = useMemo(
    () => (!kernelGeometry ? extrudeFootprint(building.footprint, building.height) : null),
    [kernelGeometry, building.footprint, building.height]
  );

  const geometry = kernelGeometry ?? fallbackGeometry!;

  const windowGeom = useMemo(
    () =>
      building.windows
        ? buildWindowGrid(building.footprint, building.height, building.floors)
        : null,
    [building.windows, building.footprint, building.height, building.floors]
  );

  return (
    <group position={[0, building.baseY, 0]}>
      {/* Main body — kernel mesh or fallback extrude */}
      <mesh geometry={geometry} castShadow={building.castShadow} receiveShadow>
        <meshStandardMaterial
          color={building.color}
          roughness={building.roughness}
          metalness={building.metalness}
          emissive={building.emissive ?? '#000000'}
          emissiveIntensity={building.emissiveIntensity}
        />
      </mesh>

      {/* Roof cap — always from footprint polygon (top face already in kernel mesh but separate material) */}
      <RoofCap
        footprint={building.footprint}
        height={building.height}
        color={building.roofColor ?? accentColor}
      />

      {/* Window facade grid */}
      {windowGeom && (
        <mesh geometry={windowGeom}>
          <meshStandardMaterial
            color={building.windowColor ?? '#b8d0f0'}
            emissive={building.windowColor ?? '#4060c0'}
            emissiveIntensity={0.1}
            roughness={0.15}
            metalness={0.7}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Roof cap (flat polygon at top of building)
// ─────────────────────────────────────────────────────────────────────────────

function RoofCap({
  footprint,
  height,
  color,
}: {
  footprint: [number, number][];
  height: number;
  color: string;
}) {
  const geometry = useMemo(
    () => polygonGeometry(footprint, height + 0.02),
    [footprint, height]
  );

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometry utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Triangulate a flat XZ polygon → BufferGeometry in the XZ plane.
 * The geometry is in THREE XY space; caller should rotation={[-PI/2,0,0]}.
 */
function polygonGeometry(
  polygon: [number, number][],
  _y: number
): THREE.BufferGeometry {
  if (polygon.length < 3) return new THREE.BufferGeometry();

  const shape = new THREE.Shape();
  shape.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) {
    shape.lineTo(polygon[i][0], polygon[i][1]);
  }
  shape.closePath();

  const geom = new THREE.ShapeGeometry(shape);
  return geom;
}

/**
 * Extrude a footprint polygon to `height`.
 * Returns a BufferGeometry with walls + top face.
 */
function extrudeFootprint(
  footprint: [number, number][],
  height: number
): THREE.BufferGeometry {
  if (footprint.length < 3) return new THREE.BufferGeometry();

  const shape = new THREE.Shape();
  shape.moveTo(footprint[0][0], footprint[0][1]);
  for (let i = 1; i < footprint.length; i++) {
    shape.lineTo(footprint[i][0], footprint[i][1]);
  }
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  });

  // ExtrudeGeometry extrudes along Z — rotate so extrusion goes up (Y)
  geom.rotateX(-Math.PI / 2);
  return geom;
}

/**
 * Build a road ribbon from a polyline.
 * Returns main ribbon + marking quads.
 */
function buildRoadGeometry(road: CityRoad): {
  ribbonGeom: THREE.BufferGeometry;
  markingGeoms: THREE.BufferGeometry[];
} {
  const pts = road.polyline;
  if (pts.length < 2) {
    return { ribbonGeom: new THREE.BufferGeometry(), markingGeoms: [] };
  }

  const hw = road.width / 2;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];

    // Tangent direction
    let tx = 0, tz = 1;
    if (i < pts.length - 1) {
      tx = pts[i + 1][0] - x;
      tz = pts[i + 1][1] - z;
    } else {
      tx = x - pts[i - 1][0];
      tz = z - pts[i - 1][1];
    }
    const len = Math.sqrt(tx * tx + tz * tz) || 1;
    tx /= len; tz /= len;

    // Normal (perpendicular in XZ)
    const nx = -tz, nz = tx;

    positions.push(x + nx * hw, 0, z + nz * hw);
    positions.push(x - nx * hw, 0, z - nz * hw);

    if (i < pts.length - 1) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  const ribbonGeom = new THREE.BufferGeometry();
  ribbonGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  ribbonGeom.setIndex(indices);
  ribbonGeom.computeVertexNormals();

  // Marking dashes (thin quads placed along polyline)
  const markingGeoms: THREE.BufferGeometry[] = road.markings.map((m) => {
    const t = Math.min(m.t, totalPolylineLength(pts) - 0.01);
    const [cx, cz] = samplePolyline(pts, t);
    const [tx2, tz2] = tangentAt(pts, t);
    const hw2 = m.width / 2;
    const hl = m.length / 2;
    const nx2 = -tz2, nz2 = tx2;

    const pos = new Float32Array([
      cx + nx2 * hw2 + tx2 * -hl, 0, cz + nz2 * hw2 + tz2 * -hl,
      cx - nx2 * hw2 + tx2 * -hl, 0, cz - nz2 * hw2 + tz2 * -hl,
      cx + nx2 * hw2 + tx2 *  hl, 0, cz + nz2 * hw2 + tz2 *  hl,
      cx - nx2 * hw2 + tx2 *  hl, 0, cz - nz2 * hw2 + tz2 *  hl,
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex([0, 1, 2, 1, 3, 2]);
    g.computeVertexNormals();
    return g;
  });

  return { ribbonGeom, markingGeoms };
}

/**
 * Build a simple window grid on the tallest wall of a building footprint.
 */
function buildWindowGrid(
  footprint: [number, number][],
  height: number,
  floors: number
): THREE.BufferGeometry | null {
  if (footprint.length < 2 || floors < 1) return null;

  // Pick the longest wall for window grid
  let bestIdx = 0;
  let bestLen = 0;
  for (let i = 0; i < footprint.length; i++) {
    const a = footprint[i];
    const b = footprint[(i + 1) % footprint.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (l > bestLen) { bestLen = l; bestIdx = i; }
  }

  const a = footprint[bestIdx];
  const b = footprint[(bestIdx + 1) % footprint.length];
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len = Math.hypot(dx, dz);
  if (len < 0.1) return null;
  const ux = dx / len, uz = dz / len;

  // Slight offset inward
  const nx = -uz * 0.05, nz = ux * 0.05;

  const cols = Math.max(1, Math.floor(len / 0.8));
  const rows = Math.max(1, floors);
  const floorH = height / rows;

  const positions: number[] = [];
  const idxArr: number[] = [];
  let v = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const t = (col + 0.3) / cols;
      const t2 = (col + 0.7) / cols;
      const y0 = row * floorH + floorH * 0.2;
      const y1 = row * floorH + floorH * 0.8;

      const x0 = a[0] + ux * t * len + nx;
      const z0 = a[1] + uz * t * len + nz;
      const x1 = a[0] + ux * t2 * len + nx;
      const z1 = a[1] + uz * t2 * len + nz;

      positions.push(x0, y0, z0, x1, y0, z1, x1, y1, z1, x0, y1, z0);
      idxArr.push(v, v + 1, v + 2, v, v + 2, v + 3);
      v += 4;
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(idxArr);
  g.computeVertexNormals();
  return g;
}

// ─────────────────────────────────────────────────────────────────────────────
// Polyline utilities
// ─────────────────────────────────────────────────────────────────────────────

function totalPolylineLength(pts: [number, number][]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return len;
}

function samplePolyline(pts: [number, number][], t: number): [number, number] {
  let remaining = t;
  for (let i = 1; i < pts.length; i++) {
    const segLen = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (remaining <= segLen) {
      const frac = remaining / segLen;
      return [
        pts[i - 1][0] + frac * (pts[i][0] - pts[i - 1][0]),
        pts[i - 1][1] + frac * (pts[i][1] - pts[i - 1][1]),
      ];
    }
    remaining -= segLen;
  }
  return pts[pts.length - 1];
}

function tangentAt(pts: [number, number][], t: number): [number, number] {
  let remaining = t;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dz = pts[i][1] - pts[i - 1][1];
    const segLen = Math.hypot(dx, dz) || 1;
    if (remaining <= segLen) return [dx / segLen, dz / segLen];
    remaining -= segLen;
  }
  const last = pts.length - 1;
  const dx = pts[last][0] - pts[last - 1][0];
  const dz = pts[last][1] - pts[last - 1][1];
  const l = Math.hypot(dx, dz) || 1;
  return [dx / l, dz / l];
}

// ─────────────────────────────────────────────────────────────────────────────
// Color utility
// ─────────────────────────────────────────────────────────────────────────────

function lightenHex(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (n >> 16) + amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + amount);
  const b = Math.min(255, (n & 0xff) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
