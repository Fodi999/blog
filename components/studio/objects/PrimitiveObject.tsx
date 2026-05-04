'use client';
/**
 * studio/objects/PrimitiveObject.tsx
 *
 * Renders a SceneObject using pure Three.js geometry (no backend call).
 * Used as instant placeholder while the GLB is loading, or for shapes
 * that don't have a Rust generator yet.
 *
 * Shape map:
 *   cube       → BoxGeometry
 *   sphere     → SphereGeometry
 *   cylinder   → CylinderGeometry
 *   cone       → ConeGeometry
 *   torus      → TorusGeometry
 *   square     → PlaneGeometry (1×1)
 *   rectangle  → PlaneGeometry (2×1)
 *   circle     → CircleGeometry
 *   triangle   → custom BufferGeometry
 *   line       → LineSegments
 *
 * Sub-element picking (cube only):
 *   face mode   → hover/click highlights the face (yellow quad)
 *   edge mode   → hover near edge → orange line; click selects edge
 *   vertex mode → hover near corner → orange sphere; click selects vertex
 *   Cursor:
 *     default   → 'default'
 *     face mode → 'crosshair'
 *     edge mode → 'cell' near edge, 'crosshair' on face interior
 *     vertex    → 'cell' near corner, 'crosshair' near edge, 'default' interior
 */

import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { SceneObject } from '../core/types';
import { useStudioStore } from '../engine/StudioProvider';
import { FaceHighlight, getFaceIdFromNormal } from './FaceHighlight';
import {
  getHoverZoneFromLocal,
  EdgeHighlight,
  VertexHighlight,
  SelectedEdgeHighlight,
  SelectedVertexHighlight,
  edgeEndpointsVec3,
  vertexPosition,
  type ZoneInfo,
} from './EdgeVertexHighlight';
import type { FaceId } from '../core/types';

export interface PrimitiveObjectProps {
  obj: SceneObject;
  /** Legacy prop — ignored, store-driven state takes priority. */
  selected?: boolean;
  /** Legacy prop — ignored, store-driven state takes priority. */
  hovered?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

function buildGeometry(obj: SceneObject): THREE.BufferGeometry {
  const s = obj.shape;
  switch (s.kind) {
    case 'cube':
      return new THREE.BoxGeometry(1, 1, 1, s.subdivisions, s.subdivisions, s.subdivisions);
    case 'sphere':
      return new THREE.SphereGeometry(0.5, 32, 24);
    case 'cylinder':
      return new THREE.CylinderGeometry(s.radius, s.radius, s.height, 32);
    case 'cone':
      return new THREE.ConeGeometry(s.radius, s.height, 32);
    case 'torus':
      return new THREE.TorusGeometry(s.major_radius, s.minor_radius, 16, 64);
    case 'square':
      return new THREE.PlaneGeometry(1, 1);
    case 'rectangle':
      return new THREE.PlaneGeometry(2, 1);
    case 'circle':
      return new THREE.CircleGeometry(0.5, 48);
    case 'triangle': {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([
        0, 0.6, 0,  -0.5, -0.4, 0,  0.5, -0.4, 0,
      ], 3));
      geo.setIndex([0, 1, 2]);
      geo.computeVertexNormals();
      return geo;
    }
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

export function PrimitiveObject({
  obj,
  onClick,
  onPointerOver,
  onPointerOut,
}: PrimitiveObjectProps) {
  // ── Store-driven state ──
  const selectedId        = useStudioStore((s) => s.selection.objectId);
  const hoveredId         = useStudioStore((s) => s.hoveredId);
  const selectionMode     = useStudioStore((s) => s.tool.selectionMode);
  const sub               = useStudioStore((s) => s.selection.sub);
  const selectObject      = useStudioStore((s) => s.selectObject);
  const setHoveredId      = useStudioStore((s) => s.setHoveredId);
  const selectSubFace     = useStudioStore((s) => s.selectSubFace);
  const selectSubEdge     = useStudioStore((s) => s.selectSubEdge);
  const selectSubVertex   = useStudioStore((s) => s.selectSubVertex);
  const registerObjectRef = useStudioStore((s) => s.registerObjectRef);

  const isSelected = selectedId === obj.id;
  const isHovered  = hoveredId  === obj.id;

  // Active sub-selections on THIS object
  const activeFaceId =
    sub?.mode === 'face' && sub.data.objectId === obj.id ? sub.data.faceId : null;
  const activeEdge =
    sub?.mode === 'edge' && sub.data.objectId === obj.id ? sub.data : null;
  const activeVertex =
    sub?.mode === 'vertex' && sub.data.objectId === obj.id ? sub.data : null;

  // ── Local hover-zone state (face/edge/vertex proximity) ──
  // Only used for cubes in sub-selection modes.
  const [hoverZone, setHoverZone] = useState<{
    faceId: FaceId;
    zone: ZoneInfo;
  } | null>(null);

  const geo = useMemo(() => buildGeometry(obj), [obj.shape]);

  // ── Material — emissive highlight for object-level selection ──
  const mat = useMemo(() => {
    if (obj.shape.kind === 'line') return null;
    return new THREE.MeshStandardMaterial({
      color: isSelected ? '#facc15' : isHovered ? '#d9f99d' : obj.material.color_hex,
      metalness: isSelected ? 0.1 : 0.45,
      roughness: isSelected ? 0.6 : 0.38,
      emissive: new THREE.Color(isSelected ? '#facc15' : isHovered ? '#84cc16' : '#000000'),
      emissiveIntensity: isSelected ? 0.15 : isHovered ? 0.08 : 0,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obj.material.color_hex, isSelected, isHovered, obj.shape.kind]);

  const { position, rotation, scale } = obj.transform;
  const meshRef = useRef<THREE.Mesh>(null);

  // ── Register / unregister so GizmoLayer can attach TransformControls ──
  useEffect(() => {
    if (meshRef.current) registerObjectRef(obj.id, meshRef.current);
    return () => registerObjectRef(obj.id, null);
  }, [obj.id, registerObjectRef]);

  // ── Cursor management ──
  useEffect(() => {
    if (!isHovered || obj.shape.kind !== 'cube') {
      document.body.style.cursor = '';
      return;
    }

    if (selectionMode === 'object') {
      document.body.style.cursor = 'pointer';
      return;
    }

    if (!hoverZone) {
      document.body.style.cursor = 'crosshair';
      return;
    }

    const zone = hoverZone.zone.zone;

    switch (selectionMode) {
      case 'face':
        document.body.style.cursor = 'crosshair';
        break;
      case 'edge':
        document.body.style.cursor =
          zone === 'edge' || zone === 'vertex' ? 'cell' : 'crosshair';
        break;
      case 'vertex':
        document.body.style.cursor =
          zone === 'vertex' ? 'cell'
          : zone === 'edge' ? 'crosshair'
          : 'default';
        break;
      default:
        document.body.style.cursor = '';
    }

    return () => { document.body.style.cursor = ''; };
  }, [isHovered, hoverZone, selectionMode, obj.shape.kind]);

  // ── Click handler — object or sub-element ──
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectObject(obj.id);

    if (obj.shape.kind !== 'cube') { onClick?.(); return; }

    if (selectionMode === 'face') {
      if (!e.face) { onClick?.(); return; }
      const faceId = getFaceIdFromNormal(e.face.normal.clone());
      selectSubFace(obj.id, faceId);

    } else if (selectionMode === 'edge' && hoverZone) {
      if (hoverZone.zone.zone === 'edge') {
        const [a, b] = edgeEndpointsVec3(hoverZone.faceId, hoverZone.zone);
        selectSubEdge(obj.id, a, b);
      } else if (hoverZone.zone.zone === 'vertex') {
        // Clicking a vertex while in edge mode: no-op (don't pollute edge state)
      }

    } else if (selectionMode === 'vertex' && hoverZone) {
      if (hoverZone.zone.zone === 'vertex') {
        const pos = vertexPosition(hoverZone.faceId, hoverZone.zone);
        selectSubVertex(obj.id, pos);
      }
    }

    onClick?.();
  };

  // ── Pointer move — detects sub-zone for cubes ──
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (obj.shape.kind !== 'cube' || selectionMode === 'object' || !e.face || !meshRef.current) {
      setHoverZone(null);
      return;
    }

    const local = meshRef.current.worldToLocal(e.point.clone());
    const faceId = getFaceIdFromNormal(e.face.normal.clone());
    const zone = getHoverZoneFromLocal(local, faceId);
    setHoverZone({ faceId, zone });
  };

  if (obj.shape.kind === 'line') {
    return (
      <lineSegments
        position={position}
        rotation={rotation}
        scale={scale}
        visible={obj.visible}
      >
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-0.5, 0, 0, 0.5, 0, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={obj.material.color_hex} />
      </lineSegments>
    );
  }

  // ── Determine what to show inside the mesh ──
  const showFaceHover   = isHovered && hoverZone && selectionMode === 'face';
  const showEdgeHover   = isHovered && hoverZone && selectionMode === 'edge'
                          && hoverZone.zone.zone === 'edge';
  const showVertexHover = isHovered && hoverZone && selectionMode === 'vertex'
                          && hoverZone.zone.zone === 'vertex';
  // Show vertex highlight also when edge mode + hovering corner (nice UX hint)
  const showVertexInEdgeMode = isHovered && hoverZone && selectionMode === 'edge'
                          && hoverZone.zone.zone === 'vertex';

  return (
    <mesh
      ref={meshRef}
      geometry={geo}
      material={mat ?? undefined}
      position={position}
      rotation={rotation}
      scale={scale}
      visible={obj.visible}
      onClick={handleClick as never}
      onPointerMove={handlePointerMove as never}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredId(obj.id);
        onPointerOver?.();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHoveredId(null);
        setHoverZone(null);
        onPointerOut?.();
      }}
    >
      {/* ── Selected face (yellow quad) ── */}
      {activeFaceId && obj.shape.kind === 'cube' && (
        <FaceHighlight faceId={activeFaceId} variant="selected" />
      )}

      {/* ── Hovered face (lime quad) ── */}
      {showFaceHover && hoverZone && (
        <FaceHighlight faceId={hoverZone.faceId} variant="hovered" />
      )}

      {/* ── Selected edge (orange line) ── */}
      {activeEdge && (
        <SelectedEdgeHighlight a={activeEdge.a} b={activeEdge.b} />
      )}

      {/* ── Selected vertex (white sphere) ── */}
      {activeVertex && (
        <SelectedVertexHighlight position={activeVertex.position} />
      )}

      {/* ── Hovered edge (light orange line) ── */}
      {showEdgeHover && hoverZone && (
        <EdgeHighlight faceId={hoverZone.faceId} zone={hoverZone.zone} variant="hover" />
      )}

      {(showVertexHover || showVertexInEdgeMode) && hoverZone && (
        <VertexHighlight faceId={hoverZone.faceId} zone={hoverZone.zone} variant="hover" />
      )}
    </mesh>
  );
}
