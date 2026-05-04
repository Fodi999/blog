/**
 * studio/engine/mesh-builder.ts
 *
 * Three.js mesh utilities: default shape params, material factories,
 * bounding-box fitting, and the GLB material upgrade pipeline.
 *
 * This is the "Three.js" layer — only import here from three/fiber,
 * keep components thin.
 */

import * as THREE from 'three';
import type { SpawnShape, ShapeParams } from '../core/types';

// ── Shape param defaults ──────────────────────────────────────────────────────

export function defaultShapeParams(kind: SpawnShape): ShapeParams {
  switch (kind) {
    case 'cube':      return { kind: 'cube', subdivisions: 2 };
    case 'cylinder':  return { kind: 'cylinder', radius: 0.5, height: 1.0 };
    case 'cone':      return { kind: 'cone', radius: 0.5, radius_top: 0.0, height: 1.0 };
    case 'torus':     return { kind: 'torus', major_radius: 0.5, minor_radius: 0.15 };
    case 'sphere':    return { kind: 'sphere' };
    case 'square':    return { kind: 'square' };
    case 'rectangle': return { kind: 'rectangle' };
    case 'circle':    return { kind: 'circle' };
    case 'triangle':  return { kind: 'triangle' };
    case 'line':      return { kind: 'line' };
  }
}

// ── Bounding-box fit ──────────────────────────────────────────────────────────

const TARGET_SIZE = 1.4; // world-units the model should fit inside

export type FitResult = {
  scale: number;
  offset: THREE.Vector3; // bbox centre in local coords
  boxMin: THREE.Vector3;
  boxMax: THREE.Vector3;
  size: THREE.Vector3;
};

export function fitToView(root: THREE.Object3D): FitResult {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = TARGET_SIZE / maxDim;
  const offset = new THREE.Vector3();
  box.getCenter(offset);
  return { scale, offset, boxMin: box.min.clone(), boxMax: box.max.clone(), size };
}

// ── Material classification ───────────────────────────────────────────────────

type MatClass = 'glass' | 'metal' | 'liquid' | 'ceramic' | 'label' | 'default';

export function classifyMaterial(name: string): MatClass {
  const n = name.toLowerCase();
  if (/glass/.test(n))                          return 'glass';
  if (/metal|lid|cap/.test(n))                   return 'metal';
  if (/liquid|sauce|volume|product|sauce_volume/.test(n)) return 'liquid';
  if (/ceramic|bowl|plate/.test(n))              return 'ceramic';
  if (/label|sticker/.test(n))                   return 'label';
  return 'default';
}

// ── Material factories ────────────────────────────────────────────────────────

export function makeGlassMaterial(src: THREE.MeshStandardMaterial): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    name: src.name,
    color: src.color.clone(),
    transmission: 0.92,
    ior: 1.5,
    thickness: 0.4,
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
    envMapIntensity: 2.0,
  });
}

export function makeMetalMaterial(src: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  const m = src.clone();
  m.metalness = 0.85;
  m.roughness = 0.2;
  m.envMapIntensity = 1.8;
  return m;
}

export function makeLiquidMaterial(src: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  const m = src.clone();
  m.roughness = 0.08;
  m.metalness = 0.0;
  m.envMapIntensity = 1.2;
  return m;
}

export function makeCeramicMaterial(src: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  const m = src.clone();
  m.roughness = 0.55;
  m.metalness = 0.0;
  return m;
}

// ── Upgrade pipeline ──────────────────────────────────────────────────────────

/**
 * Walk a loaded GLB scene and replace default MeshStandardMaterials with
 * physically-correct variants based on material name conventions from the
 * Rust generator.
 *
 * Idempotent — safe to call on a cached gltf.scene.
 */
export function upgradeMaterials(root: THREE.Object3D): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    if (mesh.userData.__materialsUpgraded) return;

    const upgrade = (mat: THREE.Material): THREE.Material => {
      if (!(mat instanceof THREE.MeshStandardMaterial)) return mat;
      const cls = classifyMaterial(mat.name);
      switch (cls) {
        case 'glass':   return makeGlassMaterial(mat as THREE.MeshStandardMaterial);
        case 'metal':   return makeMetalMaterial(mat as THREE.MeshStandardMaterial);
        case 'liquid':  return makeLiquidMaterial(mat as THREE.MeshStandardMaterial);
        case 'ceramic': return makeCeramicMaterial(mat as THREE.MeshStandardMaterial);
        default:        return mat;
      }
    };

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(upgrade);
    } else {
      mesh.material = upgrade(mesh.material);
    }

    mesh.userData.__materialsUpgraded = true;
  });
}

/**
 * Apply a shape color (hex) as a brushed-metal override to all opaque
 * primitive meshes (skips glass, liquid, label meshes).
 */
export function applyShapeColor(root: THREE.Object3D, colorHex: string): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || mesh.userData.__overlay) return;

    const apply = (mat: THREE.Material) => {
      if (mat instanceof THREE.MeshPhysicalMaterial && mat.transmission > 0) return;
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.color.set(colorHex);
        mat.metalness = 0.75;
        mat.roughness = 0.22;
        mat.envMapIntensity = 1.5;
        mat.needsUpdate = true;
      }
    };

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(apply);
    } else {
      apply(mesh.material);
    }
  });
}

// ── Edge overlay builders ─────────────────────────────────────────────────────

export type OverlayBag = {
  wire?: THREE.LineSegments;
  sel?: THREE.LineSegments;
  hov?: THREE.LineSegments;
};

export function buildWireOverlay(geo: THREE.BufferGeometry): THREE.LineSegments {
  const seg = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo, 1),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthTest: true }),
  );
  seg.userData.__overlay = true;
  seg.frustumCulled = false;
  seg.renderOrder = 1;
  return seg;
}

export function buildOutlineOverlay(geo: THREE.BufferGeometry, color: number, opacity: number): THREE.LineSegments {
  const seg = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo, 30),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthTest: false }),
  );
  seg.userData.__overlay = true;
  seg.frustumCulled = false;
  seg.renderOrder = 999;
  seg.scale.setScalar(1.003);
  return seg;
}
