/**
 * types/city-api.ts
 *
 * TypeScript mirror of src/domain/city/mod.rs
 * All field names are camelCase (serde rename_all = "camelCase").
 *
 * Frontend is a pure renderer — it receives CityMap and draws it.
 * No geometry is computed on the frontend.
 */

// ── Economy HUD ──────────────────────────────────────────────────────────────

export interface CityEconomy {
  inventoryValueCents: number;
  avgProfitMargin: number;
  assistantProgress: number;
  dishCount: number;
  inventoryCount: number;
  expiringSoon: number;
  revenueCents: number;
  restaurantName: string;
}

// ── Road — polyline centerline ───────────────────────────────────────────────

export interface RoadMarking {
  t: number;      // parametric distance along polyline
  length: number;
  width: number;
}

export interface CityRoad {
  id: string;
  polyline: [number, number][];  // [[x,z], [x,z], …]
  width: number;
  lanes: number;
  roadType: 'primary' | 'secondary' | 'alley';
  color: string;
  markings: RoadMarking[];
}

// ── District — polygon boundary ──────────────────────────────────────────────

export type DistrictKind =
  | 'player'
  | 'office'
  | 'residential'
  | 'market'
  | 'shops'
  | 'competitor'
  | 'park'
  | 'industrial';

export interface CityDistrict {
  id: string;
  name: string;
  kind: DistrictKind;
  polygon: [number, number][];   // XZ boundary, closed
  centroid: [number, number];    // pre-computed [x, z]
  groundColor: string;
  accentColor: string;
  buildings: CityBuilding[];
  lots: CityLot[];
  unlocked: boolean;
  badge: string | null;
}

// ── Building mesh — pre-baked 3D geometry from backend geometry kernel ────────

/**
 * Pre-computed indexed triangle mesh for a building.
 * Backend calls extrude_polygon (geometry kernel), transforms to Y-up city space,
 * and serialises flat float buffers here.
 *
 * Frontend usage:
 *   const geo = new THREE.BufferGeometry();
 *   geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(mesh.positions), 3));
 *   geo.setAttribute('normal',   new THREE.BufferAttribute(new Float32Array(mesh.normals),   3));
 *   geo.setAttribute('uv',       new THREE.BufferAttribute(new Float32Array(mesh.uvs),       2));
 *   geo.setIndex(mesh.indices);
 */
export interface CityMesh {
  positions: number[];  // flat [x0,y0,z0, x1,y1,z1, …]
  normals:   number[];  // flat [nx0,ny0,nz0, …]
  uvs:       number[];  // flat [u0,v0, u1,v1, …]
  indices:   number[];  // triangle indices (every 3 = one face)
  /** Optional flat per-vertex RGB in 0..1 — use vertexColors when present. */
  colors?:   number[];  // flat [r0,g0,b0, …]
}

// ── Building — footprint polygon + extrude ───────────────────────────────────

export interface CityBuilding {
  id: string;
  footprint: [number, number][]; // XZ contour (fallback if mesh absent)
  baseY: number;
  height: number;
  floors: number;
  kind: string;
  color: string;
  roofColor: string | null;
  emissive: string | null;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
  windows: boolean;
  windowColor: string | null;
  castShadow: boolean;
  /** Pre-baked 3D mesh from backend geometry kernel. Preferred over client-side extrude. */
  mesh?: CityMesh;
}

// ── Lot — ground polygon ─────────────────────────────────────────────────────

export interface CityLot {
  id: string;
  polygon: [number, number][];
  kind: 'grass' | 'parking' | 'plaza' | 'pavement' | 'water';
  color: string;
}

// ── Ground + bounds ──────────────────────────────────────────────────────────

export interface CityGround {
  color: string;
  size: number;
  fogColor: string;
  fogNear: number;
  fogFar: number;
}

export interface CityBounds {
  width: number;
  depth: number;
}

// ── Terrain — pre-baked landscape mesh from backend ──────────────────────────

export interface CityTerrain {
  mesh: CityMesh;
  width: number;
  depth: number;
  cellSize: number;
  minHeight: number;
  maxHeight: number;
  color: string;
}

// ── Units — backend ships real metres; frontend may rescale ─────────────────

export interface CityUnits {
  /** Always "meter" in this build. */
  lengthUnit: string;
  /** Always 1.0 in this build. */
  metersPerUnit: number;
  /** Suggested `<group scale={...}>` factor (e.g. 0.05 for a ~1 km city). */
  renderScaleHint: number;
}

// ── Top-level map ────────────────────────────────────────────────────────────

export interface CityMap {
  seed: number;
  bounds: CityBounds;
  economy: CityEconomy;
  roads: CityRoad[];
  districts: CityDistrict[];
  ground: CityGround;
  /** Optional pre-baked terrain mesh. When present, render via BufferGeometry. */
  terrain?: CityTerrain;
  /** Length-unit metadata. Multiply scene by `units.renderScaleHint`. */
  units: CityUnits;
}
