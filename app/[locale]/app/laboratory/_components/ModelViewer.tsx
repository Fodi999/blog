"use client";

/**
 * ModelViewer — React Three Fiber viewer for procedural product models.
 *
 * PR #8: GLB-first.
 *   * `.glb` → `GLTFLoader` (single self-contained file with PBR materials)
 *   * `.obj` → legacy fallback (`OBJLoader` + sibling `.mtl`)
 *
 * Format is auto-detected from the URL extension. The legacy OBJ branch is
 * kept so older `laboratory_3d_assets` rows that were generated before
 * PR #8 keep rendering. New assets are always GLB.
 *
 * Renders inside a Canvas with OrbitControls and tuned lighting.
 */

import { Suspense, useRef } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// Format detection
// ─────────────────────────────────────────────────────────────────────────────

function isGlb(url: string): boolean {
  return /\.glb(\?.*)?$/i.test(url);
}

function deriveMtlUrl(objUrl: string): string {
  return objUrl.replace(/\.obj(\?.*)?$/i, ".mtl$1");
}

// ─────────────────────────────────────────────────────────────────────────────
// GLB branch (preferred)
// ─────────────────────────────────────────────────────────────────────────────

function GltfModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  const root = gltf.scene;

  // Centre + normalise so the model fits the camera frame.
  const { scale, offset } = fitToView(root);

  return (
    <primitive
      object={root}
      scale={scale}
      position={[-offset.x * scale, -offset.y * scale, -offset.z * scale]}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy OBJ branch (kept for assets generated before PR #8)
// ─────────────────────────────────────────────────────────────────────────────

function ObjModel({ url }: { url: string }) {
  const mtlUrl = deriveMtlUrl(url);
  const materials = useLoader(MTLLoader, mtlUrl);
  materials.preload();

  const obj = useLoader(OBJLoader, url, (loader) => {
    (loader as OBJLoader).setMaterials(materials);
  });

  // Upgrade Phong → Standard so highlights show under our lighting.
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const src = mesh.material as THREE.MeshPhongMaterial | THREE.MeshStandardMaterial;
    if ((src as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;

    const color = (src as THREE.MeshPhongMaterial).color ?? new THREE.Color("#cccccc");
    const shininess = (src as THREE.MeshPhongMaterial).shininess ?? 32;
    const roughness = THREE.MathUtils.clamp(1 - shininess / 200, 0.15, 0.9);

    mesh.material = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0,
      name: src.name,
    });
  });

  const { scale, offset } = fitToView(obj);

  return (
    <primitive
      object={obj}
      scale={scale}
      position={[-offset.x * scale, -offset.y * scale, -offset.z * scale]}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function fitToView(obj: THREE.Object3D): {
  scale: number;
  offset: THREE.Vector3;
} {
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? 1.5 / maxDim : 1;
  const offset = new THREE.Vector3();
  box.getCenter(offset);
  return { scale, offset };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public component
// ─────────────────────────────────────────────────────────────────────────────

interface ModelViewerProps {
  /**
   * Public URL of the model file. Supports `.glb` (preferred) and `.obj`
   * (legacy — `model.mtl` is loaded from the same directory).
   */
  modelUrl: string;
  /** Tailwind/CSS class applied to the wrapping div. */
  className?: string;
}

export function ModelViewer({ modelUrl, className = "" }: ModelViewerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const useGlb = isGlb(modelUrl);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-xl bg-zinc-900 ${className}`}
    >
      <Canvas
        camera={{ position: [0, 1.5, 3], fov: 45 }}
        gl={{ antialias: true }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Lighting — tuned so PBR highlights are visible */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 3]} intensity={1.4} castShadow={false} />
        <directionalLight position={[-3, -2, -2]} intensity={0.35} />
        <pointLight position={[0, 3, 2]} intensity={0.5} />

        <Suspense fallback={null}>
          {useGlb ? <GltfModel url={modelUrl} /> : <ObjModel url={modelUrl} />}
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={0.5}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={1.2}
        />
      </Canvas>

      <span className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-zinc-500 select-none">
        drag to rotate
      </span>
    </div>
  );
}

/** Backwards-compat alias for the old name. */
export const ObjViewer = ModelViewer;
