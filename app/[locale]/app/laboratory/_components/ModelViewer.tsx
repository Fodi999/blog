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
 *   `product_material`, `sauce_material`, `sauce_volume`, `bowl_ceramic`,
 *   `bowl_glass`, `plate_ceramic`, `food_material`, …). We walk the loaded scene and swap the default
 *   `MeshStandardMaterial` for a more physically-correct one based on that name:
 *
 *     *glass*           → MeshPhysicalMaterial { transmission, ior, thickness }
 *     *metal* / *lid*   → MeshStandardMaterial { metalness: 0.8, roughness: 0.25 }
 *     *liquid|sauce|volume|product* → glossy MeshStandardMaterial (low roughness)
 *                         PR #29: sauce_volume (side wall) uses same liquid shader
 *
 *   Combined with a studio HDRI environment map (drei `<Environment />`),
 *   this gets us recognisable glass / metal / glossy looks without any extra
 *   asset pipeline.
 *
 * Format is auto-detected from the URL extension. The legacy OBJ branch is
 * kept so older `laboratory_3d_assets` rows that were generated before
 * PR #8 keep rendering. New assets are always GLB.
 */

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Grid, OrbitControls, TransformControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// PR #17 — WebGPU progressive enhancement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect whether the current browser exposes the WebGPU API.
 *
 * We don't actually request an adapter here — that's an async call and
 * `WebGPURenderer.init()` will do it again immediately after. A simple
 * presence check is enough to avoid loading the WebGPU bundle on browsers
 * that can't use it (Safari < 18, Firefox without flags, …).
 */
function hasWebGPU(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

/**
 * Whether WebGPU should actually be used for this page load.
 *
 * Even on browsers that *support* WebGPU we keep it off by default because
 * `WebGPURenderer` rejects classic `ShaderMaterial`s (it requires the new
 * node material system) and several drei helpers we rely on —
 * notably `<ContactShadows />` — still ship a plain `ShaderMaterial`,
 * triggering: *"THREE.NodeBuilder: Material 'ShaderMaterial' is not
 * compatible."*
 *
 * Until drei catches up we expose WebGPU as an explicit opt-in:
 *   * URL query param: `?webgpu=1`
 *   * Or window flag set from devtools: `window.__chefosWebGPU = true`
 *
 * The TSL sauce shader (PR #18) uses the same gate — it can only run when
 * the active renderer is a `WebGPURenderer`.
 */
function isWebGPURequested(): boolean {
  if (typeof window === "undefined") return false;
  if ((window as unknown as { __chefosWebGPU?: boolean }).__chefosWebGPU) {
    return true;
  }
  try {
    return new URLSearchParams(window.location.search).get("webgpu") === "1";
  } catch {
    return false;
  }
}

function shouldUseWebGPU(): boolean {
  return hasWebGPU() && isWebGPURequested();
}

/**
 * R3F `gl` factory that prefers `WebGPURenderer` and falls back to the
 * default `WebGLRenderer` if WebGPU isn't available or fails to init.
 *
 * The renderer object exposes the same `toneMapping` / `outputColorSpace`
 * API on both backends, so the rest of the viewer (PR #16 ACES tone
 * mapping, `<Environment />`, `<ContactShadows />`, our PR #9 material
 * upgrades) keeps working unchanged.
 */
async function createRenderer(props: {
  canvas: HTMLCanvasElement;
}): Promise<THREE.WebGLRenderer> {
  if (shouldUseWebGPU()) {
    try {
      // Dynamic import keeps the WebGPU bundle out of the initial JS payload
      // for browsers that won't use it.
      const webgpu = await import("three/webgpu");
      const renderer = new webgpu.WebGPURenderer({
        canvas: props.canvas,
        antialias: true,
      });
      await renderer.init();
      // eslint-disable-next-line no-console
      console.info("[ModelViewer] using WebGPURenderer (opt-in)");
      // Cast: WebGPURenderer is API-compatible with WebGLRenderer for the
      // surface R3F + drei use (toneMapping / outputColorSpace / render).
      return renderer as unknown as THREE.WebGLRenderer;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[ModelViewer] WebGPU init failed, falling back to WebGL", e);
    }
  }
  return new THREE.WebGLRenderer({
    canvas: props.canvas,
    antialias: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PR #18 — TSL / node-based procedural sauce shader
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Async factory that builds a procedural sauce material using TSL nodes.
 *
 * Effects layered on top of a standard PBR material:
 *
 *   * **Micro-bubble roughness** — `mx_noise_float(positionLocal × 40)` is
 *     added to the base roughness with small amplitude (~0.05). This breaks
 *     up perfectly-uniform highlights so the sauce looks like a real
 *     viscous liquid rather than chrome paint.
 *   * **Wet clearcoat** — fixed clearcoat 0.3 / clearcoatRoughness 0.15
 *     gives the glossy "just poured" sheen.
 *
 * Returns `null` on browsers without WebGPU (TSL relies on the node
 * material system which only ships in `three/webgpu`). The viewer will
 * keep using the standard `makeLiquidMaterial` in that case.
 */
type SauceFactory = (color: THREE.Color, name: string) => THREE.Material;
let _sauceFactoryPromise: Promise<SauceFactory | null> | null = null;
function ensureSauceFactory(): Promise<SauceFactory | null> {
  if (_sauceFactoryPromise) return _sauceFactoryPromise;
  // Same opt-in gate as the renderer (PR #17). Without WebGPU the node
  // material system is still loadable on WebGL via three/webgpu, but the
  // sauce material would never render correctly through the legacy WebGL
  // renderer that R3F builds when the opt-in flag is off.
  if (!shouldUseWebGPU()) {
    _sauceFactoryPromise = Promise.resolve(null);
    return _sauceFactoryPromise;
  }
  _sauceFactoryPromise = (async () => {
    try {
      const webgpu = await import("three/webgpu");
      const tsl = await import("three/tsl");
      const { MeshPhysicalNodeMaterial } = webgpu;
      const { positionLocal, mx_noise_float, float } = tsl;

      const factory: SauceFactory = (color, name) => {
        const mat = new MeshPhysicalNodeMaterial({ name });
        mat.color = color.clone();
        mat.metalness = 0.0;

        // Micro-bubble noise on roughness. Amplitude is small so it doesn't
        // flicker; frequency 40 keeps bubbles below ~5 mm at our model
        // scale (model fits in a 1.5 m bounding box after `fitToView`).
        const noise = mx_noise_float(positionLocal.mul(float(40.0))).abs();
        mat.roughnessNode = float(0.18).add(noise.mul(float(0.05)));

        // Wet clearcoat — glossy thin film over the diffuse pigment.
        mat.clearcoatNode = float(0.3);
        mat.clearcoatRoughnessNode = float(0.15);

        mat.envMapIntensity = 1.2;
        mat.side = THREE.DoubleSide;
        return mat as unknown as THREE.Material;
      };
      // eslint-disable-next-line no-console
      console.info("[ModelViewer] TSL sauce shader ready");
      return factory;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[ModelViewer] TSL sauce shader unavailable", e);
      return null;
    }
  })();
  return _sauceFactoryPromise;
}

/**
 * Walk `root` and replace any material classified as `liquid` with the
 * TSL node version produced by `ensureSauceFactory`. Idempotent via the
 * `__tslUpgraded` tag.
 */
function upgradeSauceMaterialsTSL(root: THREE.Object3D, factory: SauceFactory): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mesh.userData.__tslUpgraded) return;

    const swap = (mat: THREE.Material): THREE.Material => {
      if (classify(mat.name ?? "") !== "liquid") return mat;
      const base = readBaseColor(mat as AnyStdMat);
      return factory(base, mat.name ?? "liquid_material");
    };

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(swap);
    } else {
      mesh.material = swap(mesh.material);
    }
    mesh.userData.__tslUpgraded = true;
  });
}

/** PR #22 — viewport render quality. */
export type RenderQuality = "performance" | "hd" | "2k" | "4k";

export const RENDER_QUALITY_CONFIG: Record<
  RenderQuality,
  { dpr: [number, number]; shadowResolution: number; textureAnisotropy: number; label: string }
> = {
  performance: { dpr: [1, 1.25],   shadowResolution: 256,  textureAnisotropy: 4,  label: "Perf" },
  hd:          { dpr: [1, 2],      shadowResolution: 512,  textureAnisotropy: 8,  label: "HD"   },
  "2k":        { dpr: [1.5, 2.5],  shadowResolution: 1024, textureAnisotropy: 12, label: "2K"   },
  "4k":        { dpr: [2, 3],      shadowResolution: 2048, textureAnisotropy: 16, label: "4K"   },
};

// ─────────────────────────────────────────────────────────────────────────────
// PR #20 — Studio Lighting Presets
// ─────────────────────────────────────────────────────────────────────────────

export type LightingPreset = "softFood" | "cleanProduct" | "darkPremium";

interface LightConfig {
  exposure: number;
  ambient: number;
  environment: StudioEnvPreset;
  environmentIntensity: number;
  key:  { position: [number, number, number]; intensity: number };
  fill: { position: [number, number, number]; intensity: number };
  rim:  { position: [number, number, number]; intensity: number };
  shadowOpacity: number;
}

export const LIGHT_PRESETS: Record<LightingPreset, LightConfig> = {
  /** Default for food / sauce / bowls — soft wrap light, less blow-out */
  softFood: {
    exposure: 0.92,
    ambient: 0.08,
    environment: "studio",
    environmentIntensity: 0.65,
    key:  { position: [ 2.5,  3.2,  2.2], intensity: 0.95 },
    fill: { position: [-3.0,  1.8,  2.0], intensity: 0.16 },
    rim:  { position: [-2.0,  2.4, -3.0], intensity: 0.42 },
    shadowOpacity: 0.45,
  },
  /** Jars / bottles / flat cards — crisp highlights, stronger rim */
  cleanProduct: {
    exposure: 0.90,
    ambient: 0.06,
    environment: "studio",
    environmentIntensity: 0.85,
    key:  { position: [ 2.8,  3.4,  2.0], intensity: 1.05 },
    fill: { position: [-2.8,  2.0,  1.5], intensity: 0.12 },
    rim:  { position: [-2.5,  2.6, -3.2], intensity: 0.58 },
    shadowOpacity: 0.38,
  },
  /** Dramatic dark presentations */
  darkPremium: {
    exposure: 0.82,
    ambient: 0.03,
    environment: "city",
    environmentIntensity: 0.55,
    key:  { position: [ 2.4,  3.0,  1.8], intensity: 0.75 },
    fill: { position: [-2.0,  1.5,  1.0], intensity: 0.08 },
    rim:  { position: [-2.8,  2.8, -3.2], intensity: 0.75 },
    shadowOpacity: 0.55,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Format detection
// ─────────────────────────────────────────────────────────────────────────────

function isGlb(url: string): boolean {
  // Match:
  //  • explicit .glb extension                (`/foo/bar.glb` or `?…`)
  //  • backend's extensionless debug-glb route (`/api/.../debug-glb/...`)
  //  • blob: object URLs created from a GLB Blob via URL.createObjectURL
  //    (used by useGeometryOrchestrator for in-memory CSG results)
  //  • data:model/gltf-binary URIs
  return (
    /\.glb(\?.*)?$/i.test(url) ||
    /\/debug-glb\//i.test(url) ||
    /^blob:/i.test(url) ||
    /^data:model\/gltf-binary/i.test(url)
  );
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
 * PR #28: first try `extras.material_class` (set by Rust GLB exporter),
 * then fall back to name-based heuristics.
 * Order for name heuristics:
 *   1. `bowl_glass` / anything with `glass` → transmissive glass
 *   2. `bowl_ceramic` / `ceramic` → opaque ceramic
 *   3. plain `bowl` (legacy fallback) → ceramic
 */
function classify(
  name: string,
  extras?: Record<string, unknown>,
): "ceramic" | "glass" | "metal" | "liquid" | "label" | null {
  // PR #28: authoritative class from GLB extras (set by Rust material_class field).
  const cls = extras?.material_class;
  if (typeof cls === "string") {
    if (cls === "opaque") return null;   // keep GLB material as-is — color already correct
    if (cls === "glass") return "glass";
    if (cls === "ceramic") return "ceramic";
    if (cls === "metal") return "metal";
    if (cls === "liquid" || cls === "food") return "liquid";
    if (cls === "label") return "label";
  }
  // Fallback: name heuristics.
  const n = name.toLowerCase();
  if (n.includes("label")) return "label";
  if (n.includes("glass")) return "glass";
  if (n.includes("ceramic") || n.includes("bowl")) return "ceramic";
  if (n.includes("metal") || n.includes("lid") || n.includes("cap")) return "metal";
  if (
    n.includes("liquid") ||
    n.includes("sauce") ||   // covers sauce_material + sauce_volume (PR #29)
    n.includes("volume") ||
    n.includes("product") ||
    n.includes("food")     // food_material (PR #30: plate_food)
  ) {
    return "liquid";
  }
  return null;
}

/** Build a `MeshPhysicalMaterial` configured for translucent product glass.
 * PR #28: transmission and roughness can be overridden from GLB extras.
 */
function makeGlassMaterial(
  base: THREE.Color,
  name: string,
  extras?: Record<string, unknown>,
): THREE.MeshPhysicalMaterial {
  const roughness = typeof extras?.roughness === "number" ? extras.roughness : 0.05;
  const transmission = typeof extras?.opacity === "number"
    ? Math.min(0.97, extras.opacity)   // opacity in Rust = transparency; invert for THREE
    : 0.92;
  return new THREE.MeshPhysicalMaterial({
    name,
    color: base,
    roughness,
    metalness: 0.0,
    transmission,
    thickness: 0.5,
    ior: 1.52,
    attenuationDistance: 0.4,
    attenuationColor: base,
    transparent: true,
    opacity: 1.0,
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

/** Matt-ish ceramic for bowls. PR #28: roughness from extras. */
function makeCeramicMaterial(
  base: THREE.Color,
  name: string,
  extras?: Record<string, unknown>,
): THREE.MeshStandardMaterial {
  const roughness = typeof extras?.roughness === "number" ? extras.roughness : 0.58;
  return new THREE.MeshStandardMaterial({
    name,
    color: base,
    roughness,
    metalness: 0.0,
    envMapIntensity: 0.5,
    side: THREE.DoubleSide,
  });
}

/**
 * Glossy liquid / sauce / generic product surface.
 * PR #28: roughness from extras (thin sauces = 0.05, thick pastes = 0.30).
 */
function makeLiquidMaterial(
  base: THREE.Color,
  name: string,
  extras?: Record<string, unknown>,
): THREE.MeshStandardMaterial {
  const roughness = typeof extras?.roughness === "number" ? extras.roughness : 0.18;
  return new THREE.MeshStandardMaterial({
    name,
    color: base,
    roughness,
    metalness: 0.0,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide,
  });
}

/**
 * Paper-/sticker-like material used for product labels (PR #15).
 *
 * The `texture_url` (set on the Rust side in `Material::with_texture_url`,
 * surfaced into glTF as `materials[i].extras.texture_url`, and retained by
 * GLTFLoader on `material.userData`) is loaded asynchronously and bound as
 * `material.map`. While the texture is in flight the material renders as a
 * flat off-white card so there's no visual pop on slow networks.
 */
const _textureCache = new Map<string, THREE.Texture>();
function loadLabelTexture(url: string, onReady: () => void): THREE.Texture {
  const cached = _textureCache.get(url);
  if (cached) return cached;
  const tex = new THREE.TextureLoader().load(
    url,
    (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      onReady();
    },
    undefined,
    (err) => {
      // eslint-disable-next-line no-console
      console.warn(`[ModelViewer] label texture failed: ${url}`, err);
    },
  );
  tex.colorSpace = THREE.SRGBColorSpace;
  _textureCache.set(url, tex);
  return tex;
}

function makeLabelMaterial(
  base: THREE.Color,
  name: string,
  textureUrl: string | undefined,
): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    name,
    color: base,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  if (textureUrl) {
    mat.map = loadLabelTexture(textureUrl, () => {
      mat.needsUpdate = true;
    });
  }
  return mat;
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
      // PR #28: read material_class + PBR overrides from GLB extras.
      const extras = (src.userData ?? {}) as Record<string, unknown>;
      const kind = classify(name, extras);
      if (!kind) return src;
      const base = readBaseColor(src);
      switch (kind) {
        case "ceramic":
          return makeCeramicMaterial(base, name, extras);
        case "glass":
          return makeGlassMaterial(base, name, extras);
        case "metal":
          return makeMetalMaterial(base, name);
        case "liquid":
          return makeLiquidMaterial(base, name, extras);
        case "label": {
          const url = typeof extras.texture_url === "string"
            ? extras.texture_url
            : undefined;
          return makeLabelMaterial(base, name, url);
        }
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

// ─────────────────────────────────────────────────────────────────────────────
// PR #32 — Error boundary for GLB loading failures (e.g. Koyeb ephemeral FS
// wipes uploads on redeploy → stale model_url in DB → 404).  Class components
// are required by React for error boundaries; this one calls `onError` so the
// parent (LaboratoryStudioViewer) can surface a graceful "Regenerate" prompt.
// ─────────────────────────────────────────────────────────────────────────────
interface GltfErrorBoundaryProps {
  onError: (e: Error) => void;
  children: React.ReactNode;
}
interface GltfErrorBoundaryState { hasError: boolean }

class GltfErrorBoundary extends React.Component<GltfErrorBoundaryProps, GltfErrorBoundaryState> {
  constructor(props: GltfErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): GltfErrorBoundaryState {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/** Y-coordinate of the floor plane (must match ContactShadows + Grid position). */
const FLOOR_Y = -0.78;

/**
 * Blender-style origin cross — X and Z axes spanning the full floor grid.
 * +X / −X  red,  +Z / −Z  green (Blender convention).
 * length should match grid fadeDistance so lines reach the horizon.
 */
function OriginCross({ y = FLOOR_Y, length = 50, opacity = 0.55 }: { y?: number; length?: number; opacity?: number }) {
  const matRed   = React.useMemo(() => new THREE.LineBasicMaterial({ color: '#E8503A', transparent: true, opacity, depthTest: false }), [opacity]);
  const matGreen = React.useMemo(() => new THREE.LineBasicMaterial({ color: '#6DBF67', transparent: true, opacity, depthTest: false }), [opacity]);

  const gXPos = React.useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, y, 0), new THREE.Vector3( length, y, 0)]), [y, length]);
  const gXNeg = React.useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, y, 0), new THREE.Vector3(-length, y, 0)]), [y, length]);
  const gZPos = React.useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, y, 0), new THREE.Vector3(0, y,  length)]), [y, length]);
  const gZNeg = React.useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, y, 0), new THREE.Vector3(0, y, -length)]), [y, length]);

  const lineXPos = React.useMemo(() => new THREE.Line(gXPos, matRed),   [gXPos, matRed]);
  const lineXNeg = React.useMemo(() => new THREE.Line(gXNeg, matRed),   [gXNeg, matRed]);
  const lineZPos = React.useMemo(() => new THREE.Line(gZPos, matGreen), [gZPos, matGreen]);
  const lineZNeg = React.useMemo(() => new THREE.Line(gZNeg, matGreen), [gZNeg, matGreen]);

  return (
    <group renderOrder={999}>
      <primitive object={lineXPos} />
      <primitive object={lineXNeg} />
      <primitive object={lineZPos} />
      <primitive object={lineZNeg} />
      {/* Small dot at origin */}
      <mesh position={[0, y + 0.002, 0]} renderOrder={999} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.012, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} depthTest={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Transform-tool modes used by the scene gizmo. */
export type TransformMode = 'select' | 'translate' | 'rotate' | 'scale';

function GltfModel({
  url,
  onScene,
  snapToFloor = false,
  viewMode = 'solid',
  selected = false,
  hovered = false,
  transform,
  transformMode = 'select',
  onCommitTransform,
  orbitRef,
}: {
  url: string;
  onScene?: (root: THREE.Object3D) => void;
  snapToFloor?: boolean;
  /** Solid / wireframe / both. */
  viewMode?: 'solid' | 'wire' | 'solid-wire';
  /** Render a cyan edge overlay slightly inflated above the mesh. */
  selected?: boolean;
  /** Render a faint white edge overlay (hover feedback). */
  hovered?: boolean;
  /** SceneObject transform (position / Euler rotation / scale, all XYZ). */
  transform?: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] };
  /** Active transform tool. `select` hides the gizmo. */
  transformMode?: TransformMode;
  /** Called on gizmo drag-end with the new transform values. */
  onCommitTransform?: (t: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }) => void;
  /** OrbitControls ref so we can disable camera while the user drags the gizmo. */
  orbitRef?: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
}) {
  const gltf = useLoader(GLTFLoader, url);
  const root = gltf.scene;

  // Upgrade materials by name (PR #9) — idempotent, safe to call on cached gltf.
  upgradeMaterials(root);

  // PR #31 — publish root so the parent can walk it for real-time roughness edits.
  useEffect(() => {
    onScene?.(root);
  }, [root, onScene]);

  // ── Wire / outline overlays ─────────────────────────────────────────────
  //
  // For every Mesh in the GLB we maintain three sibling LineSegments:
  //   • topology wire        — dim white, shows triangulation
  //   • selection outline    — cyan, slightly inflated
  //   • hover outline        — faint white, slightly inflated
  // They are attached as `userData.__overlay*` on the parent and added/removed
  // from the scene graph based on props. The Three.js objects themselves are
  // re-used across renders to avoid re-uploading geometry.
  useEffect(() => {
    type OverlayBag = {
      wire?: THREE.LineSegments;
      sel?: THREE.LineSegments;
      hov?: THREE.LineSegments;
    };
    const bags: { mesh: THREE.Mesh; bag: OverlayBag }[] = [];

    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      const bag: OverlayBag = (mesh.userData.__overlays ??= {}) as OverlayBag;

      // Lazily build EdgesGeometry once per mesh — feature-edge angle 1° to
      // get every triangle edge in wire mode (so subdivisions are visible),
      // and reuse the same geometry for outlines.
      const ensureWire = () => {
        if (!bag.wire) {
          const eg = new THREE.EdgesGeometry(mesh.geometry, 1);
          bag.wire = new THREE.LineSegments(
            eg,
            new THREE.LineBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.18,
              depthTest: true,
            }),
          );
          bag.wire.userData.__overlay = true;
          bag.wire.frustumCulled = false;
          bag.wire.renderOrder = 1;
        }
      };
      const ensureOutline = (key: 'sel' | 'hov', color: number, opacity: number) => {
        if (!bag[key]) {
          const eg = new THREE.EdgesGeometry(mesh.geometry, 30);
          const seg = new THREE.LineSegments(
            eg,
            new THREE.LineBasicMaterial({
              color,
              transparent: true,
              opacity,
              depthTest: false, // x-ray so the outline reads even behind faces
            }),
          );
          seg.userData.__overlay = true;
          seg.frustumCulled = false;
          seg.renderOrder = 999;
          // Tiny inflation so edges sit just above the surface.
          seg.scale.setScalar(1.003);
          bag[key] = seg;
        }
      };

      ensureWire();
      ensureOutline('sel', 0x38bdf8, 0.95);
      ensureOutline('hov', 0xffffff, 0.55);
      bags.push({ mesh, bag });
    });

    const wantWire = viewMode === 'wire' || viewMode === 'solid-wire';
    const wantSolid = viewMode === 'solid' || viewMode === 'solid-wire';

    for (const { mesh, bag } of bags) {
      // Toggle solid surface via material.visible so child overlays
      // (LineSegments) stay rendered even in wire-only mode.
      const mat = mesh.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) {
        for (const m of mat) m.visible = wantSolid;
      } else if (mat) {
        mat.visible = wantSolid;
      }

      const attach = (seg: THREE.LineSegments | undefined, on: boolean) => {
        if (!seg) return;
        if (on) {
          if (seg.parent !== mesh) mesh.add(seg);
        } else if (seg.parent) {
          seg.parent.remove(seg);
        }
      };
      attach(bag.wire, wantWire);
      attach(bag.sel,  selected);
      attach(bag.hov,  hovered && !selected);
    }

    return () => {
      // Detach (but don't dispose — geometry is reused on next prop change).
      for (const { bag } of bags) {
        for (const seg of [bag.wire, bag.sel, bag.hov]) {
          if (seg?.parent) seg.parent.remove(seg);
        }
      }
    };
  }, [root, viewMode, selected, hovered]);

  // PR #18 — once the gltf is mounted, lazily load the TSL sauce shader and
  // re-upgrade any liquid material to its node-based version. Only runs on
  // WebGPU-capable browsers; the WebGL fallback keeps the standard material.
  useEffect(() => {
    let cancelled = false;
    ensureSauceFactory().then((factory) => {
      if (cancelled || !factory) return;
      upgradeSauceMaterialsTSL(root, factory);
    });
    return () => {
      cancelled = true;
    };
  }, [root]);

  // Centre + normalise so the model fits the camera frame.
  const { scale, offset, boxMin } = fitToView(root);

  // snapToFloor: shift Y so the bottom face sits exactly on FLOOR_Y.
  // Formula: yPos = FLOOR_Y - boxMin.y * scale
  // (derived from: bottomWorld = (boxMin.y - offset.y)*scale + yPos = FLOOR_Y)
  const yPos = snapToFloor ? FLOOR_Y - boxMin.y * scale : -offset.y * scale;

  // ── Transform gizmo target ─────────────────────────────────────────────
  // The outer <group> applies the SceneObject.transform (user-edited values).
  // The inner <primitive> still applies fit-to-view normalisation. Composing
  // them means the gizmo always operates in the object's *user* coord space,
  // never on the fit-to-view scale.
  const [gizmoTarget, setGizmoTarget] = useState<THREE.Group | null>(null);

  // Sync external transform → the group whenever the prop changes
  // (e.g. inspector edit, undo/redo, scene load). Gizmo drag does not
  // change the prop until commit, so this won't fight the gizmo mid-drag.
  useEffect(() => {
    if (!gizmoTarget || !transform) return;
    gizmoTarget.position.set(transform.position[0], transform.position[1], transform.position[2]);
    gizmoTarget.rotation.set(transform.rotation[0], transform.rotation[1], transform.rotation[2]);
    gizmoTarget.scale.set(transform.scale[0], transform.scale[1], transform.scale[2]);
  }, [gizmoTarget, transform]);

  const showGizmo =
    selected && transformMode !== 'select' && gizmoTarget !== null;

  return (
    <>
      <group
        ref={setGizmoTarget}
        position={transform?.position ?? [0, 0, 0]}
        rotation={transform?.rotation ?? [0, 0, 0]}
        scale={transform?.scale ?? [1, 1, 1]}
      >
        <primitive
          object={root}
          scale={scale}
          position={[-offset.x * scale, yPos, -offset.z * scale]}
        />
      </group>
      {showGizmo && (
        <TransformControls
          object={gizmoTarget}
          mode={transformMode as 'translate' | 'rotate' | 'scale'}
          size={0.85}
          onMouseDown={() => {
            if (orbitRef?.current) (orbitRef.current as { enabled: boolean }).enabled = false;
          }}
          onMouseUp={() => {
            if (orbitRef?.current) (orbitRef.current as { enabled: boolean }).enabled = true;
            const g = gizmoTarget;
            if (!g) return;
            onCommitTransform?.({
              position: [g.position.x, g.position.y, g.position.z],
              rotation: [g.rotation.x, g.rotation.y, g.rotation.z],
              scale:    [g.scale.x,    g.scale.y,    g.scale.z],
            });
          }}
        />
      )}
    </>
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
  boxMin: THREE.Vector3;
} {
  // Save & reset the root transform so bbox is in the object's LOCAL space,
  // not world space (which would include position/scale set by a previous render).
  const savedPos   = obj.position.clone();
  const savedScale = obj.scale.clone();
  const savedRot   = obj.rotation.clone();
  obj.position.set(0, 0, 0);
  obj.scale.set(1, 1, 1);
  obj.rotation.set(0, 0, 0);
  obj.updateWorldMatrix(false, true);

  const box = new THREE.Box3().setFromObject(obj);

  // Restore
  obj.position.copy(savedPos);
  obj.scale.copy(savedScale);
  obj.rotation.copy(savedRot);
  obj.updateWorldMatrix(false, true);

  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? 1.0 / maxDim : 1;
  const offset = new THREE.Vector3();
  box.getCenter(offset);
  const boxMin = box.min.clone();
  return { scale, offset, boxMin };
}

// ─────────────────────────────────────────────────────────────────────────────
// Camera animation helper (PR #19 — camera presets)
// ─────────────────────────────────────────────────────────────────────────────

/** Camera positions for the standard preset views (model is fit to ~1.0 units). */
const CAMERA_PRESETS = {
  default: new THREE.Vector3(2.0, 1.5, 2.5),
  front:   new THREE.Vector3(0,   0.1, 3.2),
  side:    new THREE.Vector3(3.2, 0.1, 0),
  top:     new THREE.Vector3(0,   3.5, 0.01),
  iso:     new THREE.Vector3(2.0, 1.8, 2.0),
} as const;

export type CameraPresetKey = keyof typeof CAMERA_PRESETS;

/**
 * A render-loop component that smoothly lerps the camera to a target
 * position stored in a shared ref. Runs inside the R3F Canvas context.
 */
function CameraAnimator({
  targetRef,
}: {
  targetRef: React.MutableRefObject<THREE.Vector3 | null>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    const tgt = targetRef.current;
    if (!tgt) return;
    camera.position.lerp(tgt, 0.09);
    camera.lookAt(0, 0, 0);
    if (camera.position.distanceTo(tgt) < 0.002) {
      camera.position.copy(tgt);
      targetRef.current = null;
    }
  });

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public component
// ─────────────────────────────────────────────────────────────────────────────

/** drei `<Environment />` presets we expose to the studio. */
export type StudioEnvPreset =
  | "studio"
  | "city"
  | "warehouse"
  | "sunset"
  | "dawn"
  | "night"
  | "apartment"
  | "park"
  | "forest"
  | "lobby";

/** Imperative API surfaced via the `onReady` callback (PR #19). */
export interface ModelViewerApi {
  /** Reset the OrbitControls to the default product-shot framing. */
  resetCamera: () => void;
  /** Take a PNG screenshot of the current canvas (returns a data URL). */
  takeScreenshot: () => string | null;
  /** Smoothly animate the camera to one of the standard preset views. */
  setCameraPreset: (preset: CameraPresetKey) => void;
  /**
   * Set the zoom distance directly (0 = closest, 1 = farthest).
   * Maps linearly between minDistance (0.4) and maxDistance (6).
   */
  setZoom: (t: number) => void;
  /** Get current zoom as 0–1 (0 = closest). */
  getZoom: () => number;
  /**
   * PR #31 — instantly update roughness on all food/sauce/liquid materials
   * (client-side only, no backend call). v = 0.0 (mirror-glossy) → 1.0 (fully matte).
   */
  setFoodRoughness: (v: number) => void;
  /**
   * PR #31 — visual smoothness via material parameters only (no geometry mutation).
   * t = 0.0 → rough/matte sauce, t = 1.0 → glossy/smooth sauce.
   * Adjusts roughness, envMapIntensity and clearcoat so the surface *looks*
   * smoother without touching any vertices (geometry is unchanged client-side;
   * the backend regenerates the GLB after the debounce).
   */
  setFoodSmooth: (t: number) => void;
}

/** How the ground plane / grid is rendered under the model. */
export type DisplayMode = "clean" | "floor" | "grid";

/**
 * PR #21 — full live light settings.
 * All fields override the active `LightingPreset` value when provided.
 */
export interface StudioLightSettings {
  preset: LightingPreset;
  exposure: number;
  envIntensity: number;
  keyIntensity: number;
  fillIntensity: number;
  rimIntensity: number;
  keyPosition: [number, number, number];
  fillPosition: [number, number, number];
  rimPosition: [number, number, number];
  shadowOpacity: number;
  shadowBlur: number;
  shadowScale: number;
}

/** Build a `StudioLightSettings` from a preset (all values resolved). */
export function lightSettingsFromPreset(preset: LightingPreset): StudioLightSettings {
  const lp = LIGHT_PRESETS[preset];
  return {
    preset,
    exposure:      lp.exposure,
    envIntensity:  lp.environmentIntensity,
    keyIntensity:  lp.key.intensity,
    fillIntensity: lp.fill.intensity,
    rimIntensity:  lp.rim.intensity,
    keyPosition:   [...lp.key.position]  as [number,number,number],
    fillPosition:  [...lp.fill.position] as [number,number,number],
    rimPosition:   [...lp.rim.position]  as [number,number,number],
    shadowOpacity: lp.shadowOpacity,
    shadowBlur:    2.8,
    shadowScale:   5,
  };
}

interface ModelViewerProps {
  modelUrl: string;
  className?: string;
  studioMode?: boolean;
  autoRotate?: boolean;
  environmentPreset?: StudioEnvPreset;
  /** PR #19 — ground/grid display mode. Default `"floor"`. */
  displayMode?: DisplayMode;
  /** PR #20 — studio lighting preset (used when `lightSettings` is absent). Default `"softFood"`. */
  lightingPreset?: LightingPreset;
  /** PR #21 — full resolved light settings (overrides `lightingPreset`). */
  lightSettings?: StudioLightSettings;
  /** PR #22 — viewport render quality. Default `"hd"`. */
  renderQuality?: RenderQuality;
  /** PR #20 — override tone-mapping exposure (0.5–1.5). */
  exposure?: number;
  onReady?: (api: ModelViewerApi) => void;
  /** PR #32 — called when the GLB file returns 404 (ephemeral storage wipe). */
  onModelError?: (e: Error) => void;
  /** Snap the model's bottom face to the floor plane (like Blender default cube). */
  snapToFloor?: boolean;
  /** Solid / wireframe / both. Default `"solid"`. */
  viewMode?: 'solid' | 'wire' | 'solid-wire';
  /** Show cyan selection outline around the loaded model. */
  selected?: boolean;
  /** Show faint hover outline around the loaded model. */
  hovered?: boolean;
  /** Active transform tool. `select` (default) hides the gizmo. */
  transformMode?: TransformMode;
  /** Current SceneObject transform — driven gizmo + group placement. */
  transform?: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] };
  /** Called on gizmo drag-end with the new transform values. */
  onCommitTransform?: (t: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }) => void;
}

export function ModelViewer({
  modelUrl,
  className = "",
  studioMode = false,
  autoRotate = true,
  environmentPreset,
  displayMode = "floor",
  lightingPreset = "softFood",
  lightSettings,
  renderQuality = "hd",
  exposure,
  onReady,
  onModelError,
  snapToFloor = false,
  viewMode = 'solid',
  selected = false,
  hovered = false,
  transformMode = 'select',
  transform,
  onCommitTransform,
}: ModelViewerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);
  const cameraAnimTargetRef = useRef<THREE.Vector3 | null>(null);

  // ── Grid unit switcher (Plasticity-style: mm / cm / m) ──────────────────
  type GridUnit = 'mm' | 'cm' | 'm';
  const GRID_UNIT_PARAMS: Record<GridUnit, {
    cellSize: number; sectionSize: number; fadeDistance: number;
    cellLabel: string; sectionLabel: string;
  }> = {
    mm: { cellSize: 0.001, sectionSize: 0.01,  fadeDistance: 0.5,  cellLabel: '1 mm',  sectionLabel: '10 mm' },
    cm: { cellSize: 0.01,  sectionSize: 0.1,   fadeDistance: 5,    cellLabel: '1 cm',  sectionLabel: '10 cm' },
    m:  { cellSize: 0.1,   sectionSize: 1.0,   fadeDistance: 50,   cellLabel: '10 cm', sectionLabel: '1 m'   },
  };
  const [gridUnit, setGridUnit] = React.useState<GridUnit>('m');
  const gp = GRID_UNIT_PARAMS[gridUnit];
  // PR #31 — root scene ref (used to store the loaded GLB root)
  const sceneRef = useRef<THREE.Object3D | null>(null);
  // PR #31 — pre-classified mesh lists, populated once when the GLB loads.
  // Separating food from bowl meshes means smoothness only ever touches food.
  const foodMeshesRef = useRef<THREE.Mesh[]>([]);
  const useGlb = isGlb(modelUrl);

  // PR #21 — merge preset + live overrides from StudioLightSettings
  const lp = LIGHT_PRESETS[lightSettings?.preset ?? lightingPreset];
  const ls = lightSettings;
  const resolvedEnv = environmentPreset ?? lp.environment;
  const resolvedExp = ls?.exposure ?? exposure ?? lp.exposure;

  const keyPos   = ls?.keyPosition  ?? lp.key.position;
  const fillPos  = ls?.fillPosition ?? lp.fill.position;
  const rimPos   = ls?.rimPosition  ?? lp.rim.position;
  const keyInt   = ls?.keyIntensity  ?? lp.key.intensity;
  const fillInt  = ls?.fillIntensity ?? lp.fill.intensity;
  const rimInt   = ls?.rimIntensity  ?? lp.rim.intensity;
  const envInt   = ls?.envIntensity  ?? lp.environmentIntensity;
  const shadOp   = ls?.shadowOpacity ?? lp.shadowOpacity;
  const shadBlur = ls?.shadowBlur    ?? 2.8;
  const shadSc   = ls?.shadowScale   ?? 5;

  // PR #22 — render quality config
  const rq = RENDER_QUALITY_CONFIG[renderQuality];

  // Re-publish the imperative API whenever a dependency changes.
  useEffect(() => {
    if (!onReady) return;
    onReady({
      resetCamera: () => {
        const c = controlsRef.current;
        if (c && typeof (c as { reset?: () => void }).reset === "function") {
          (c as { reset: () => void }).reset();
        }
      },
      takeScreenshot: () => {
        const gl = glRef.current;
        if (!gl) return null;
        try {
          return gl.domElement.toDataURL("image/png");
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("[ModelViewer] screenshot failed", e);
          return null;
        }
      },
      setCameraPreset: (preset: CameraPresetKey) => {
        cameraAnimTargetRef.current = CAMERA_PRESETS[preset].clone();
      },
      setZoom: (t: number) => {
        const c = controlsRef.current as unknown as { object?: THREE.Camera; update?: () => void } | null;
        if (!c?.object) return;
        const MIN = 0.18, MAX = 6;
        const dist = MIN + (MAX - MIN) * (1 - Math.max(0, Math.min(1, t)));
        const cam = c.object as THREE.PerspectiveCamera;
        const dir = cam.position.clone().normalize();
        cam.position.copy(dir.multiplyScalar(dist));
        c.update?.();
      },
      getZoom: () => {
        const c = controlsRef.current as unknown as { object?: THREE.Camera } | null;
        if (!c?.object) return 0.5;
        const MIN = 0.18, MAX = 6;
        const dist = (c.object as THREE.PerspectiveCamera).position.length();
        return 1 - (dist - MIN) / (MAX - MIN);
      },
      setFoodRoughness: (v: number) => {
        // Only food meshes — bowl is in a separate list and is never touched.
        for (const mesh of foodMeshesRef.current) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            const mat = m as THREE.MeshStandardMaterial;
            if (!mat?.isMeshStandardMaterial) continue;
            mat.roughness = Math.max(0, Math.min(1, v));
            mat.needsUpdate = true;
          }
        }
      },
      setFoodSmooth: (t: number) => {
        // Material-only visual smoothness — geometry is NEVER modified client-side.
        // t=0 → rough/matte,  t=1 → glossy/smooth
        // roughness:        0.85 → 0.08
        // envMapIntensity:  0.6  → 2.2  (more reflection = looks smoother)
        // clearcoat:        0.0  → 0.6  (wet sheen at high smoothness)
        const roughness       = 0.85 - t * 0.77;
        const envMapIntensity = 0.6 + t * 1.6;
        const clearcoat       = t * 0.6;
        for (const mesh of foodMeshesRef.current) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            const mat = m as THREE.MeshStandardMaterial & { clearcoat?: number; clearcoatRoughness?: number };
            if (!mat?.isMeshStandardMaterial) continue;
            mat.roughness       = roughness;
            mat.envMapIntensity = envMapIntensity;
            if ('clearcoat' in mat) {
              mat.clearcoat          = clearcoat;
              mat.clearcoatRoughness = 0.1;
            }
            mat.needsUpdate = true;
          }
        }
      },
    });
  }, [onReady]);

  const wrapperClass = studioMode
    ? `relative h-full w-full overflow-hidden bg-zinc-950 ${className}`
    : displayMode === 'grid'
      ? `relative h-full w-full overflow-hidden ${className}`
      : `relative h-full w-full overflow-hidden rounded-xl bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 ${className}`;

  return (
    <div ref={ref} className={wrapperClass}>
      <Canvas
        // PR #16 — product-shot camera. Narrow FOV (35°) reduces perspective
        // distortion on tall bottles; the slight downward angle from
        // (1.8, 1.2, 2.2) shows the rim highlights and the foot at once.
        camera={{ position: [2.0, 1.5, 2.5], fov: 45, near: 0.01, far: 100 }}
        dpr={rq.dpr}
        // PR #17 — WebGPU progressive enhancement. `gl` may be a factory
        // function returning a Renderer (sync or async). We try
        // WebGPURenderer first and fall back to WebGLRenderer transparently.
        gl={createRenderer as unknown as undefined}
        // PR #16 — ACES Filmic tone mapping + sRGB output. Without this,
        // glass/metal highlights blow out to pure white and the bowl
        // ceramic looks chalky.
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = resolvedExp;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          glRef.current = gl;
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Blender-style background in grid mode */}
        {displayMode === "grid" && <color attach="background" args={["#4a4a4a"]} />}
        {displayMode === "grid" && <fog attach="fog" args={["#4a4a4a", 8, 30]} />}

        {/* PR #21 — 3-point studio lighting, all values from live settings */}
        <ambientLight intensity={displayMode === "grid" ? 0.5 : lp.ambient} />
        <directionalLight position={displayMode === "grid" ? [5, 8, 5] : keyPos} intensity={displayMode === "grid" ? 2.2 : keyInt} castShadow={false} />
        <directionalLight position={fillPos} intensity={fillInt} />
        <directionalLight position={rimPos}  intensity={rimInt}  />

        {/*
          Studio HDRI — gives glass / metal something to reflect (PR #9).
          `background={false}` keeps our dark gradient backdrop while still
          feeding the env map into PBR materials. Studio preset works best
          for transparent glass and brushed metal lids/caps.
        */}
        <Suspense fallback={null}>
          <Environment
            preset={resolvedEnv}
            background={false}
            environmentIntensity={envInt}
          />
        </Suspense>

        <Suspense fallback={null}>
          {useGlb ? (
            <GltfErrorBoundary onError={(e) => onModelError?.(e)}>
            <GltfModel
              url={modelUrl}
              snapToFloor={snapToFloor}
              viewMode={viewMode}
              selected={selected}
              hovered={hovered}
              transform={transform}
              transformMode={transformMode}
              onCommitTransform={onCommitTransform}
              orbitRef={controlsRef}
              onScene={(r) => {
                sceneRef.current = r;
                // Classify meshes once on load — food vs bowl/everything else.
                // food: material_class "food" OR name matches food|sauce|liquid|product|mound|swirl
                // bowl: everything else (ceramic, glass, metal, label…)
                const food: THREE.Mesh[] = [];
                r.traverse((child) => {
                  const mesh = child as THREE.Mesh;
                  if (!mesh.isMesh) return;
                  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                  const isFood = mats.some((m) => {
                    const mat = m as THREE.MeshStandardMaterial;
                    const cls = (mat.userData as Record<string, unknown>)?.material_class;
                    // "food" = plate_food generator, "liquid" = sauce_in_bowl generator
                    if (cls === 'food' || cls === 'liquid') return true;
                    return /food|sauce|liquid|product|mound|swirl/.test(mat.name ?? '');
                  });
                  if (isFood) food.push(mesh);
                });
                foodMeshesRef.current = food;
              }}
            />
            </GltfErrorBoundary>
          ) : <ObjModel url={modelUrl} />}
        </Suspense>

        {/*
          Ground plane rendering depends on displayMode:
          - "clean"  → nothing
          - "floor"  → soft contact shadow only (default)
          - "grid"   → grid + lighter shadow
        */}
        {displayMode !== "clean" && (
          <ContactShadows
            position={[0, -0.78, 0]}
            opacity={displayMode === "grid" ? shadOp * 0.6 : shadOp}
            scale={shadSc}
            blur={shadBlur}
            far={1.0}
            resolution={rq.shadowResolution}
            color="#000000"
          />
        )}
        {displayMode === "grid" && (
          <Grid
            args={[80, 80]}
            position={[0, -0.78, 0]}
            cellColor="#4d4d4d"
            cellThickness={0.5}
            sectionColor="#6a6a6a"
            sectionThickness={1.2}
            cellSize={gp.cellSize}
            sectionSize={gp.sectionSize}
            fadeDistance={gp.fadeDistance}
            fadeStrength={1.5}
            infiniteGrid
            followCamera
          />
        )}
        {displayMode === "grid" && <OriginCross />}

        <CameraAnimator targetRef={cameraAnimTargetRef} />

        <OrbitControls
          ref={controlsRef as never}
          enablePan={studioMode}
          minDistance={0.18}
          maxDistance={6}
          minPolarAngle={Math.PI * 0.05}
          maxPolarAngle={Math.PI * 0.85}
          autoRotate={autoRotate}
          autoRotateSpeed={1.0}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {/* Plasticity-style unit switcher — only in grid mode, right side */}
      {displayMode === "grid" && (
        <div className="pointer-events-auto absolute top-2 right-2 flex items-center gap-0.5 rounded-md border border-white/10 bg-black/40 px-1 py-0.5 backdrop-blur-sm select-none">
          {(["mm", "cm", "m"] as GridUnit[]).map((u) => (
            <button
              key={u}
              onClick={() => setGridUnit(u)}
              className={[
                "rounded px-2 py-0.5 text-[10px] font-mono font-semibold transition-colors",
                gridUnit === u
                  ? "bg-sky-500/80 text-white"
                  : "text-zinc-400 hover:text-zinc-200",
              ].join(" ")}
            >
              {u}
            </button>
          ))}
          <span className="ml-1 text-[9px] text-zinc-500 font-mono">
            {gp.cellLabel} / {gp.sectionLabel}
          </span>
        </div>
      )}

      {!studioMode ? (
        <span className="pointer-events-none absolute bottom-2 left-3 text-[10px] text-zinc-400/70 select-none">
          drag to rotate
        </span>
      ) : null}
    </div>
  );
}

/** Backwards-compat alias for the old name. */
export const ObjViewer = ModelViewer;
