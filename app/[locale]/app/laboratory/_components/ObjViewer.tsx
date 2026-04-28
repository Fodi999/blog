"use client";

/**
 * ObjViewer — lightweight React Three Fiber viewer for OBJ models.
 *
 * Renders a single OBJ + its paired MTL file (assumed to be at
 * `<objUrl dir>/model.mtl`) inside a Canvas with OrbitControls.
 *
 * Used by LaboratoryClient once `asset.model_url` is set (status = "ready").
 * The OBJ is loaded lazily (Suspense) so the rest of the page renders
 * immediately.
 *
 * PR #4 — no GLB, no shadows, no environment maps.
 * A simple ambient + directional light is enough to see the shape.
 */

import { Suspense, useRef } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// Inner model component (must be inside Canvas + Suspense)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive the sibling MTL URL from an OBJ URL by replacing `.obj` with `.mtl`.
 * The Rust backend always writes `model.obj` + `model.mtl` side by side.
 */
function deriveMtlUrl(objUrl: string): string {
  return objUrl.replace(/\.obj(\?.*)?$/i, ".mtl$1");
}

function ObjModel({ url }: { url: string }) {
  // Load MTL first so the OBJLoader can attach materials. If MTL fails to
  // load (e.g. older asset without one), useLoader will throw — Suspense
  // will keep showing fallback. To stay robust we *try* MTL; if there is no
  // MTL the OBJ still renders with a default grey material.
  const mtlUrl = deriveMtlUrl(url);
  const materials = useLoader(MTLLoader, mtlUrl);
  materials.preload();

  const obj = useLoader(OBJLoader, url, (loader) => {
    (loader as OBJLoader).setMaterials(materials);
  });

  // Belt & suspenders: walk the scene graph and upgrade every mesh material
  // to a MeshStandardMaterial that carries the same Kd colour, so glossy
  // sauces actually look glossy under the simple Canvas lighting.
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const src = mesh.material as THREE.MeshPhongMaterial | THREE.MeshStandardMaterial;
    // If we already have a Standard material, leave it.
    if ((src as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;

    const color = (src as THREE.MeshPhongMaterial).color ?? new THREE.Color("#cccccc");
    const shininess = (src as THREE.MeshPhongMaterial).shininess ?? 32;
    // Map Phong shininess → Standard roughness (rough heuristic).
    const roughness = THREE.MathUtils.clamp(1 - shininess / 200, 0.15, 0.9);

    mesh.material = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0,
      name: src.name,
    });
  });

  // Centre and normalise the model so it always fits the view.
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? 1.5 / maxDim : 1;

  const center = new THREE.Vector3();
  box.getCenter(center);

  return (
    <primitive
      object={obj}
      scale={scale}
      position={[-center.x * scale, -center.y * scale, -center.z * scale]}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public component
// ─────────────────────────────────────────────────────────────────────────────

interface ObjViewerProps {
  /** Public URL of the `.obj` file (e.g. `/static/laboratory/models/.../model.obj`). */
  modelUrl: string;
  /** Tailwind/CSS class applied to the wrapping div. */
  className?: string;
}

export function ObjViewer({ modelUrl, className = "" }: ObjViewerProps) {
  const ref = useRef<HTMLDivElement>(null);

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
        {/* Lighting — tuned so MeshStandardMaterial highlights are visible */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 3]} intensity={1.4} castShadow={false} />
        <directionalLight position={[-3, -2, -2]} intensity={0.35} />
        <pointLight position={[0, 3, 2]} intensity={0.5} />

        {/* Model */}
        <Suspense
          fallback={
            // Nothing visible while loading — the parent already shows a
            // skeleton/spinner at the card level.
            null
          }
        >
          <ObjModel url={modelUrl} />
        </Suspense>

        {/* Controls */}
        <OrbitControls
          enablePan={false}
          minDistance={0.5}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={1.2}
        />
      </Canvas>

      {/* Subtle corner label */}
      <span className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-zinc-500 select-none">
        drag to rotate
      </span>
    </div>
  );
}
