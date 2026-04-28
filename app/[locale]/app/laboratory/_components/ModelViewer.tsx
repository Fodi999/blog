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

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
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
): "ceramic" | "glass" | "metal" | "liquid" | "label" | null {
  const n = name.toLowerCase();
  if (n.includes("label")) return "label";
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
        case "label": {
          // GLTFLoader stores material extras on `userData` directly
          // (three.js ≥ 0.150). PR #15 emits `extras.texture_url` from
          // the Rust exporter; pick it up here.
          const extras = (src.userData ?? {}) as Record<string, unknown>;
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

function GltfModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  const root = gltf.scene;

  // Upgrade materials by name (PR #9) — idempotent, safe to call on cached gltf.
  upgradeMaterials(root);

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
}

interface ModelViewerProps {
  /**
   * Public URL of the model file. Supports `.glb` (preferred) and `.obj`
   * (legacy — `model.mtl` is loaded from the same directory).
   */
  modelUrl: string;
  /** Tailwind/CSS class applied to the wrapping div. */
  className?: string;
  /**
   * PR #19 — fullscreen Studio mode.
   *
   * When `true`:
   *   * removes the rounded card / gradient backdrop (the parent owns it)
   *   * removes the "drag to rotate" hint
   *   * enables panning so the user can frame the product freely
   */
  studioMode?: boolean;
  /** Whether OrbitControls should auto-rotate. Default `true`. */
  autoRotate?: boolean;
  /** drei HDRI environment preset. Default `"studio"`. */
  environmentPreset?: StudioEnvPreset;
  /** Receives the imperative API once the canvas is mounted. */
  onReady?: (api: ModelViewerApi) => void;
}

export function ModelViewer({
  modelUrl,
  className = "",
  studioMode = false,
  autoRotate = true,
  environmentPreset = "studio",
  onReady,
}: ModelViewerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);
  const useGlb = isGlb(modelUrl);

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
          // Force a render so the back-buffer is fresh before reading.
          (gl as unknown as { render?: (s: unknown, c: unknown) => void });
          return gl.domElement.toDataURL("image/png");
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("[ModelViewer] screenshot failed", e);
          return null;
        }
      },
    });
  }, [onReady]);

  const wrapperClass = studioMode
    ? `relative h-full w-full overflow-hidden bg-zinc-950 ${className}`
    : `relative overflow-hidden rounded-xl bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 ${className}`;

  return (
    <div ref={ref} className={wrapperClass}>
      <Canvas
        // PR #16 — product-shot camera. Narrow FOV (35°) reduces perspective
        // distortion on tall bottles; the slight downward angle from
        // (1.8, 1.2, 2.2) shows the rim highlights and the foot at once.
        camera={{ position: [1.8, 1.2, 2.2], fov: 35, near: 0.01, far: 50 }}
        dpr={[1, 2]}
        // PR #17 — WebGPU progressive enhancement. `gl` may be a factory
        // function returning a Renderer (sync or async). We try
        // WebGPURenderer first and fall back to WebGLRenderer transparently.
        gl={createRenderer as unknown as undefined}
        // PR #16 — ACES Filmic tone mapping + sRGB output. Without this,
        // glass/metal highlights blow out to pure white and the bowl
        // ceramic looks chalky.
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          // For studio screenshots we need preserveDrawingBuffer; toggling
          // it post-hoc isn't supported, so we just live with the small
          // perf hit in studio mode.
          glRef.current = gl;
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Soft fill — HDRI does the heavy lifting; the directional adds a key. */}
        <ambientLight intensity={0.25} />
        <directionalLight
          position={[2.5, 4, 2]}
          intensity={0.9}
          castShadow={false}
        />
        <directionalLight position={[-3, -1, -2]} intensity={0.2} />

        {/*
          Studio HDRI — gives glass / metal something to reflect (PR #9).
          `background={false}` keeps our dark gradient backdrop while still
          feeding the env map into PBR materials. Studio preset works best
          for transparent glass and brushed metal lids/caps.
        */}
        <Suspense fallback={null}>
          <Environment
            preset={environmentPreset}
            background={false}
            environmentIntensity={0.9}
          />
        </Suspense>

        <Suspense fallback={null}>
          {useGlb ? <GltfModel url={modelUrl} /> : <ObjModel url={modelUrl} />}
        </Suspense>

        {/*
          Contact shadow under the product. The model is fit-to-view to span
          ~1.5 units along its largest axis and centred at origin, so its
          base sits near y = -0.75. We place the shadow plane just below
          that and keep its scale modest so the soft penumbra reads even on
          smaller cards. In studio mode we widen and soften it.
        */}
        <ContactShadows
          position={[0, -0.78, 0]}
          opacity={studioMode ? 0.55 : 0.45}
          scale={studioMode ? 6 : 3}
          blur={studioMode ? 3.2 : 2.6}
          far={1.2}
          resolution={studioMode ? 1024 : 512}
          color="#000000"
        />

        <OrbitControls
          ref={controlsRef as never}
          enablePan={studioMode}
          minDistance={1.0}
          maxDistance={8}
          minPolarAngle={Math.PI * 0.05}
          maxPolarAngle={Math.PI * 0.85}
          autoRotate={autoRotate}
          autoRotateSpeed={1.0}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {!studioMode ? (
        <span className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-zinc-400/70 select-none">
          drag to rotate
        </span>
      ) : null}
    </div>
  );
}

/** Backwards-compat alias for the old name. */
export const ObjViewer = ModelViewer;
