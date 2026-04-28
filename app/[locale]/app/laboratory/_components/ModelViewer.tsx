"use client";

/**
 * ModelViewer — React Three Fiber viewer for procedural product models.
 *
 * PR #8: GLB-first.
 *   * `.glb` → `GLTFLoader` (single self-contained file with PBR materials)
 *   * `.obj` → legacy fallback (`OBJLoader` + sibling `.mtl`)
 *
 * PR #9: per-name material upgrade.
 *   The Rust generators tag every material with a stable name
 *   (`bottle_glass`, `jar_glass`, `cap_metal`, `lid_metal`, `liquid_material`,
 *   `product_material`, `sauce_material`, `bowl_material`, …). We walk the
 *   loaded scene and swap the default `MeshStandardMaterial` for a more
 *   physically-correct one based on that name:
 *
 *     *glass*           → MeshPhysicalMaterial { transmission, ior, thickness }
 *     *metal* / *lid*   → MeshStandardMaterial { metalness: 0.8, roughness: 0.25 }
 *     *liquid|sauce|product* → glossy MeshStandardMaterial (low roughness)
 *
 *   Combined with a studio HDRI environment map (drei `<Environment />`),
 *   this gets us recognisable glass / metal / glossy looks without any extra
 *   asset pipeline.
 *
 * Format is auto-detected from the URL extension. The legacy OBJ branch is
 * kept so older `laboratory_3d_assets` rows that were generated before
 * PR #8 keep rendering. New assets are always GLB.
 */

import { Suspense, useRef } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
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
// PR #9 — material upgrade by name
// ─────────────────────────────────────────────────────────────────────────────

type AnyStdMat =
  | THREE.MeshStandardMaterial
  | THREE.MeshPhysicalMaterial
  | THREE.MeshPhongMaterial
  | THREE.MeshLambertMaterial
  | THREE.MeshBasicMaterial;

/**
 * Pull a sensible base colour out of any material the loaders may produce.
 * GLTFLoader gives us MeshStandardMaterial; MTLLoader gives MeshPhongMaterial.
 */
function readBaseColor(mat: AnyStdMat): THREE.Color {
  // All of these expose `.color`.
  return (mat as THREE.MeshStandardMaterial).color?.clone() ?? new THREE.Color("#cccccc");
}

/**
 * Decide which physically-themed material a material name implies.
 * Returns `null` if no rule matches and the original material should be kept.
 *
 * Order matters — `bowl` / `ceramic` are checked **before** `glass` so the
 * ceramic bowl in `sauce_in_bowl` never accidentally turns transmissive.
 */
function classify(
  name: string,
): "ceramic" | "glass" | "metal" | "liquid" | null {
  const n = name.toLowerCase();
  if (n.includes("bowl") || n.includes("ceramic")) return "ceramic";
  if (n.includes("glass")) return "glass";
  if (n.includes("metal") || n.includes("lid") || n.includes("cap")) return "metal";
  if (
    n.includes("liquid") ||
    n.includes("sauce") ||
    n.includes("product")
  ) {
    return "liquid";
  }
  return null;
}

/** Build a `MeshPhysicalMaterial` configured for translucent product glass. */
function makeGlassMaterial(base: THREE.Color, name: string): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    name,
    color: base,
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.92,    // see-through
    thickness: 0.5,        // refraction strength
    ior: 1.45,             // typical for glass
    attenuationDistance: 0.4,
    attenuationColor: base,
    transparent: true,
    opacity: 1.0,          // transmission handles the look; keep opacity 1
    side: THREE.DoubleSide,
    envMapIntensity: 1.2,
  });
}

/** Brushed-metal lid / cap. */
function makeMetalMaterial(base: THREE.Color, name: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    name,
    color: base,
    metalness: 0.8,
    roughness: 0.28,
    envMapIntensity: 1.4,
  });
}

/** Matt-ish ceramic for bowls. Never transmissive — opaque dish. */
function makeCeramicMaterial(base: THREE.Color, name: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    name,
    color: base,
    roughness: 0.58,
    metalness: 0.0,
    envMapIntensity: 0.5,
    side: THREE.DoubleSide,
  });
}

/**
 * Glossy liquid / sauce / generic product surface. Tuned for the swirl
 * relief on top of `sauce_in_bowl` and the meniscus on jars/bottles.
 */
function makeLiquidMaterial(base: THREE.Color, name: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    name,
    color: base,
    roughness: 0.18,
    metalness: 0.0,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide,
  });
}

/**
 * Walk every mesh in `root` and upgrade its material based on the material
 * name. Idempotent: if a mesh has already been upgraded (we tag it with
 * `userData.__upgraded`), it is skipped.
 */
function upgradeMaterials(root: THREE.Object3D): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const upgrade = (src: AnyStdMat): THREE.Material => {
      const name = src.name ?? "";
      const kind = classify(name);
      if (!kind) return src;
      const base = readBaseColor(src);
      switch (kind) {
        case "ceramic":
          return makeCeramicMaterial(base, name);
        case "glass":
          return makeGlassMaterial(base, name);
        case "metal":
          return makeMetalMaterial(base, name);
        case "liquid":
          return makeLiquidMaterial(base, name);
      }
    };

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((m) => upgrade(m as AnyStdMat));
    } else {
      mesh.material = upgrade(mesh.material as AnyStdMat);
    }
    mesh.userData.__upgraded = true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GLB branch (preferred)
// ─────────────────────────────────────────────────────────────────────────────

function GltfModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  const root = gltf.scene;

  // Upgrade materials by name (PR #9) — idempotent, safe to call on cached gltf.
  upgradeMaterials(root);

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

  // PR #9 — apply name-based upgrades on the now-Standard materials too.
  upgradeMaterials(obj);

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
        <ambientLight intensity={0.45} />
        <directionalLight position={[3, 5, 3]} intensity={1.2} castShadow={false} />
        <directionalLight position={[-3, -2, -2]} intensity={0.3} />
        <pointLight position={[0, 3, 2]} intensity={0.4} />

        {/*
          Studio HDRI — gives glass / metal something to reflect (PR #9).
          `background={false}` keeps the dark zinc-900 background but still
          feeds the env map into PBR materials.
        */}
        <Suspense fallback={null}>
          <Environment preset="studio" background={false} environmentIntensity={0.8} />
        </Suspense>

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
