'use client';
/**
 * studio/objects/EdgeVertexHighlight.tsx
 *
 * Sub-element hover/selection highlights for a UNIT cube (1×1×1).
 *
 * Exports:
 *   getHoverZoneFromLocal() — classifies a local-space point into face/edge/vertex
 *   EdgeHighlight           — colored line along the hovered/selected edge
 *   VertexHighlight         — colored sphere at the hovered/selected corner
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { FaceId } from '../core/types';
import type { Vec3 } from '../core/types';

// ── Face axis table ───────────────────────────────────────────────────────────
// For each face, defines:
//   fixed: [axisIndex, value] — the constant axis (e.g. y=0.5 for top)
//   u / v: free axes (0=x, 1=y, 2=z)
// offset is slightly > 0.5 so highlights sit just outside the cube surface.

const OFF = 0.502; // outside face by 2mm → no z-fight
const HALF = 0.5;

type FaceAxes = { fixed: [0 | 1 | 2, number]; u: 0 | 1 | 2; v: 0 | 1 | 2 };

const FACE_AXES: Record<FaceId, FaceAxes> = {
  top:    { fixed: [1,  OFF], u: 0, v: 2 },
  bottom: { fixed: [1, -OFF], u: 0, v: 2 },
  front:  { fixed: [2,  OFF], u: 0, v: 1 },
  back:   { fixed: [2, -OFF], u: 0, v: 1 },
  right:  { fixed: [0,  OFF], u: 2, v: 1 },
  left:   { fixed: [0, -OFF], u: 2, v: 1 },
};

// ── Zone detection ────────────────────────────────────────────────────────────

export type HoverZone = 'face' | 'edge' | 'vertex';

export interface ZoneInfo {
  zone: HoverZone;
  /** Defined for edge (one sign set) and vertex (both signs set) */
  uSign?: number; // -1 | 1
  vSign?: number; // -1 | 1
}

/**
 * Given a local-space intersection point and the face it hit,
 * classify it as face interior, edge proximity, or vertex corner.
 *
 * thresh: distance from the edge (in local units, cube side = 1)
 * at which the zone changes. Default 0.15 = 15% of half-edge.
 */
export function getHoverZoneFromLocal(
  local: THREE.Vector3,
  faceId: FaceId,
  thresh = 0.15,
): ZoneInfo {
  const { u, v } = FACE_AXES[faceId];
  const uVal = local.getComponent(u);
  const vVal = local.getComponent(v);

  const nearU = Math.abs(uVal) > HALF - thresh;
  const nearV = Math.abs(vVal) > HALF - thresh;

  if (nearU && nearV) {
    return { zone: 'vertex', uSign: Math.sign(uVal), vSign: Math.sign(vVal) };
  }
  if (nearU) return { zone: 'edge', uSign: Math.sign(uVal) };
  if (nearV) return { zone: 'edge', vSign: Math.sign(vVal) };
  return { zone: 'face' };
}

// ── Edge endpoint helpers ─────────────────────────────────────────────────────

/**
 * Returns the two endpoints of the hovered edge in cube local-space.
 * Used by EdgeHighlight and by selectSubEdge dispatch.
 */
export function edgeEndpoints(faceId: FaceId, zone: ZoneInfo): [THREE.Vector3, THREE.Vector3] {
  const { fixed, u, v } = FACE_AXES[faceId];
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();

  // Place both points on the face plane
  p1.setComponent(fixed[0], fixed[1]);
  p2.setComponent(fixed[0], fixed[1]);

  if (zone.uSign !== undefined && zone.vSign === undefined) {
    // Edge runs along the v-axis at u = ±HALF
    p1.setComponent(u, zone.uSign * HALF);
    p2.setComponent(u, zone.uSign * HALF);
    p1.setComponent(v, -HALF);
    p2.setComponent(v,  HALF);
  } else if (zone.vSign !== undefined && zone.uSign === undefined) {
    // Edge runs along the u-axis at v = ±HALF
    p1.setComponent(v, zone.vSign * HALF);
    p2.setComponent(v, zone.vSign * HALF);
    p1.setComponent(u, -HALF);
    p2.setComponent(u,  HALF);
  }

  return [p1, p2];
}

/** Vec3 tuple version of edgeEndpoints — for store dispatch. */
export function edgeEndpointsVec3(faceId: FaceId, zone: ZoneInfo): [Vec3, Vec3] {
  const [p1, p2] = edgeEndpoints(faceId, zone);
  return [
    [p1.x, p1.y, p1.z],
    [p2.x, p2.y, p2.z],
  ];
}

/** Vertex position in local space — for store dispatch. */
export function vertexPosition(faceId: FaceId, zone: ZoneInfo): Vec3 {
  const { fixed, u, v } = FACE_AXES[faceId];
  const p = new THREE.Vector3();
  p.setComponent(fixed[0], fixed[1]);
  p.setComponent(u, (zone.uSign ?? 1) * HALF);
  p.setComponent(v, (zone.vSign ?? 1) * HALF);
  return [p.x, p.y, p.z];
}

// ── EdgeHighlight ─────────────────────────────────────────────────────────────

interface EdgeHighlightProps {
  faceId: FaceId;
  zone: ZoneInfo;
  /** 'hover' = orange, 'selected' = amber */
  variant?: 'hover' | 'selected';
}

export function EdgeHighlight({ faceId, zone, variant = 'hover' }: EdgeHighlightProps) {
  const geo = useMemo(() => {
    const [p1, p2] = edgeEndpoints(faceId, zone);
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [p1.x, p1.y, p1.z, p2.x, p2.y, p2.z],
        3,
      ),
    );
    return g;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceId, zone.uSign, zone.vSign]);

  const color = variant === 'selected' ? '#fb923c' : '#fdba74';

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color={color} linewidth={2} depthTest={false} />
    </lineSegments>
  );
}

// ── VertexHighlight ───────────────────────────────────────────────────────────

interface VertexHighlightProps {
  faceId: FaceId;
  zone: ZoneInfo;
  /** 'hover' = bright orange, 'selected' = white */
  variant?: 'hover' | 'selected';
}

const SPHERE_GEO = new THREE.SphereGeometry(0.055, 12, 8);

export function VertexHighlight({ faceId, zone, variant = 'hover' }: VertexHighlightProps) {
  const pos = useMemo(
    () => {
      const { fixed, u, v } = FACE_AXES[faceId];
      const p = new THREE.Vector3();
      p.setComponent(fixed[0], fixed[1]);
      p.setComponent(u, (zone.uSign ?? 1) * HALF);
      p.setComponent(v, (zone.vSign ?? 1) * HALF);
      return p;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [faceId, zone.uSign, zone.vSign],
  );

  const color = variant === 'selected' ? '#ffffff' : '#f97316';

  return (
    <mesh geometry={SPHERE_GEO} position={pos}>
      <meshBasicMaterial color={color} depthTest={false} />
    </mesh>
  );
}

// ── Selected edge/vertex (uses raw Vec3, not faceId) ─────────────────────────

const SEL_SPHERE_GEO = new THREE.SphereGeometry(0.065, 12, 8);

/** Highlight a SELECTED edge from store (a+b in local space). */
export function SelectedEdgeHighlight({ a, b }: { a: Vec3; b: Vec3 }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([...a, ...b], 3),
    );
    return g;
  }, [a, b]);

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#fb923c" linewidth={2} depthTest={false} />
    </lineSegments>
  );
}

/** Highlight a SELECTED vertex from store (position in local space). */
export function SelectedVertexHighlight({ position }: { position: Vec3 }) {
  return (
    <mesh geometry={SEL_SPHERE_GEO} position={position}>
      <meshBasicMaterial color="#ffffff" depthTest={false} />
    </mesh>
  );
}
