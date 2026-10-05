'use client';

import { useEffect, useRef, useState } from 'react';

/* three.js is self-hosted under /public/vendor/three and resolved through the
   import map in the root layout ("three" + "three/addons/"). It is loaded with a
   runtime import so the bundler never touches it and pages without a viewer
   never download it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const runtimeImport = (url: string): Promise<Any> => new Function('u', 'return import(u)')(url);


type Finish = 'steel' | 'satin' | 'source';

/** A dimension line in model millimetres: from `a` to `b`, drawn shifted by `offset`. */
export type Dimension = { a: [number, number, number]; b: [number, number, number]; offset: [number, number, number]; label: string };

export type ViewerLabels = { explode: string; assemble: string; dims: string; demo: string };

type Props = {
  src: string;
  poster?: string;
  alt: string;
  finish?: Finish;
  autoRotate?: boolean;
  /** Camera direction as [yaw°, pitch°]; yaw 0 looks along -Z. */
  view?: [number, number];
  /** Model rotation in degrees (x, y, z), e.g. [90, 0, 0] to stand a wheel up. */
  rotate?: [number, number, number];
  loadingLabel?: string;
  fallbackLabel?: string;
  className?: string;
  interactive?: boolean;
  /** Dimension lines shown by the "dimensions" button (and at the end of the demo). */
  dims?: Dimension[];
  /** Button texts; the buttons appear only when the model has parts (GLB extras.explode) or dims. */
  labels?: ViewerLabels;
  /** Play the take-apart → assemble → dimensions demo once when the model first appears. */
  autoDemo?: boolean;
};

type Api = { explode: () => void; dims: () => void; demo: () => void };

const btn = (on: boolean) =>
  `glass rounded-full border px-3.5 py-1.5 font-mono text-[11.5px] transition-colors ${on ? 'border-signal text-signal' : 'border-hairline-ink-strong text-on-ink hover:border-on-ink/60'}`;

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function ModelViewer({
  src,
  poster,
  alt,
  finish = 'steel',
  autoRotate = true,
  view = [-30, 22],
  rotate,
  loadingLabel = 'Loading…',
  fallbackLabel,
  className = '',
  interactive = true,
  dims,
  labels,
  autoDemo = false,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const [ui, setUi] = useState({ parts: false, exploded: false, dims: false });
  const dimsKey = JSON.stringify(dims ?? []);
  const [rx, ry, rz] = rotate ?? [0, 0, 0];
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'fallback'>('idle');

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    const start = async () => {
      if (!webglAvailable()) {
        setState('fallback');
        return;
      }
      setState('loading');
      try {
        const [THREE, { GLTFLoader }, { OrbitControls }] = await Promise.all([
          runtimeImport('three'),
          runtimeImport('three/addons/loaders/GLTFLoader.js'),
          runtimeImport('three/addons/controls/OrbitControls.js'),
        ]);
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.setAttribute('aria-label', alt);
        renderer.domElement.setAttribute('role', 'img');
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        // Studio lighting baked into an environment map: a large top softbox, two
        // side strips (warm white + cool) and a faint signal-green kicker.
        const pmrem = new THREE.PMREMGenerator(renderer);
        const studio = new THREE.Scene();
        studio.background = new THREE.Color(0x4a525e);
        const panel = (w: number, h: number, color: number, intensity: number, pos: [number, number, number]) => {
          const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
          );
          mesh.position.set(...pos);
          mesh.lookAt(0, 0, 0);
          studio.add(mesh);
        };
        panel(14, 7, 0xffffff, 4.0, [0, 6, 1]);
        panel(2.5, 8, 0xffffff, 3.0, [-6, 1, 2]);
        panel(2.5, 8, 0xbfe9ff, 2.2, [6, 1, -2]);
        panel(8, 0.8, 0xc4ff4d, 0.08, [0, -2.5, -6]);
        panel(16, 16, 0x0e1218, 1.0, [0, -5, 0]);
        const envTex = pmrem.fromScene(studio, 0.02).texture;
        scene.environment = envTex;
        studio.traverse((obj: Any) => {
          obj.geometry?.dispose?.();
          obj.material?.dispose?.();
        });

        const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 1000);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = false;
        controls.enabled = interactive;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        controls.autoRotate = autoRotate && !reduceMotion;
        controls.autoRotateSpeed = 0.9;
        renderer.domElement.style.touchAction = interactive ? 'none' : 'auto';
        controls.addEventListener('start', () => {
          controls.autoRotate = false;
        });

        const gltf = await new GLTFLoader().loadAsync(src);
        if (disposed) {
          renderer.dispose();
          return;
        }
        const model = gltf.scene;
        const material =
          finish === 'source'
            ? new THREE.MeshPhysicalMaterial({ color: 0x2a3038, metalness: 0, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.4 })
            : new THREE.MeshPhysicalMaterial({
                color: finish === 'satin' ? 0xbcc2c9 : 0xd2d6db,
                metalness: 1,
                roughness: finish === 'satin' ? 0.34 : 0.22,
                clearcoat: finish === 'satin' ? 0 : 0.3,
                clearcoatRoughness: 0.25,
              });
        // Parts keep their kind from the GLB material name: rubber pads and plastic plugs stay dark.
        const rubber = new THREE.MeshPhysicalMaterial({ color: 0x0b0c0e, metalness: 0, roughness: 0.85 });
        const plastic = new THREE.MeshPhysicalMaterial({ color: 0x121418, metalness: 0, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.4 });
        const wood = new THREE.MeshPhysicalMaterial({ color: 0x8c6a46, metalness: 0, roughness: 0.8 });
        model.traverse((obj: Any) => {
          if (!obj.isMesh) return;
          const kind = String(obj.material?.name ?? '');
          obj.material = kind === 'rubber' ? rubber : kind === 'plastic' ? plastic : kind === 'wood' ? wood : material;
        });
        model.rotation.set((rx * Math.PI) / 180, (ry * Math.PI) / 180, (rz * Math.PI) / 180);
        const holder = new THREE.Group();
        holder.add(model);

        // Parts that can be taken apart: nodes carrying extras.explode (metres, model axes) and
        // extras.order (0 = first off). Exploding runs the order forwards, assembling backwards.
        type Part = { obj: Any; base: Any; ex: Any; order: number };
        const parts: Part[] = [];
        model.traverse((o: Any) => {
          const ex = o.userData?.explode;
          if (Array.isArray(ex) && ex.length === 3) parts.push({ obj: o, base: o.position.clone(), ex: new THREE.Vector3(ex[0], ex[1], ex[2]), order: Number(o.userData.order) || 0 });
        });
        const maxOrder = parts.reduce((m, p) => Math.max(m, p.order), 0);
        const STAGGER = 0.45;
        const span = 1 + maxOrder * STAGGER;
        const applyExplode = (e: number) => {
          for (const p of parts) {
            let t = Math.min(1, Math.max(0, e * span - p.order * STAGGER));
            t = t * t * (3 - 2 * t);
            p.obj.position.copy(p.base).addScaledVector(p.ex, t);
          }
        };

        // Centre the assembled model at the origin; frame it so the exploded view fits too.
        const box = new THREE.Box3().setFromObject(holder);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        let radius = size.length() / 2 || 1;
        if (parts.length) {
          applyExplode(1);
          const ebox = new THREE.Box3().setFromObject(holder).union(box);
          applyExplode(0);
          const corners = [ebox.min, ebox.max].flatMap((a: Any) => [ebox.min, ebox.max].flatMap((b: Any) => [ebox.min, ebox.max].map((c: Any) => new THREE.Vector3(a.x, b.y, c.z))));
          radius = Math.max(radius, ...corners.map((v: Any) => v.distanceTo(center))) * 0.92;
        }
        holder.position.sub(center);
        scene.add(holder);

        // Dimension lines (model millimetres → metres), children of the model so they follow it.
        const dimList: Dimension[] = JSON.parse(dimsKey);
        const lime = 0xc4ff4d;
        type DimObj = { line: Any; ext: Any; arrows: Any[]; label: Any; a: Any; b: Any };
        const dimObjs: DimObj[] = [];
        const lineMat = new THREE.LineBasicMaterial({ color: lime, transparent: true, depthTest: false, opacity: 0 });
        const extMat = new THREE.LineBasicMaterial({ color: lime, transparent: true, depthTest: false, opacity: 0 });
        const arrowMat = new THREE.MeshBasicMaterial({ color: lime, transparent: true, depthTest: false, opacity: 0 });
        const MM = 0.001;
        for (const d of dimList) {
          const A = new THREE.Vector3(...d.a).multiplyScalar(MM);
          const B = new THREE.Vector3(...d.b).multiplyScalar(MM);
          const O = new THREE.Vector3(...d.offset).multiplyScalar(MM);
          const a = A.clone().add(O);
          const b = B.clone().add(O);
          const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lineMat);
          const ext = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([A, a.clone().addScaledVector(O.clone().normalize(), radius * 0.03), B, b.clone().addScaledVector(O.clone().normalize(), radius * 0.03)]), extMat);
          const arrows = [0, 1].map(() => new THREE.Mesh(new THREE.ConeGeometry(radius * 0.012, radius * 0.04, 12), arrowMat));
          const cv = document.createElement('canvas');
          cv.width = 512;
          cv.height = 128;
          const cx = cv.getContext('2d');
          if (cx) {
            cx.font = '600 64px ui-monospace, "JetBrains Mono", monospace';
            const w = Math.min(500, cx.measureText(d.label).width + 48);
            cx.fillStyle = 'rgba(7,9,12,0.82)';
            cx.beginPath();
            cx.roundRect((512 - w) / 2, 14, w, 100, 50);
            cx.fill();
            cx.fillStyle = '#c4ff4d';
            cx.textAlign = 'center';
            cx.textBaseline = 'middle';
            cx.fillText(d.label, 256, 66);
          }
          const tex = new THREE.CanvasTexture(cv);
          tex.colorSpace = THREE.SRGBColorSpace;
          const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, opacity: 0 }));
          const lh = radius * 0.075;
          label.scale.set(lh * 4, lh, 1);
          label.position.copy(a.clone().add(b).multiplyScalar(0.5)).addScaledVector(O.clone().normalize(), lh * 0.6);
          for (const o of [line, ext, label, ...arrows]) {
            o.renderOrder = 10;
            model.add(o);
          }
          dimObjs.push({ line, ext, arrows, label, a, b });
        }
        const applyDims = (v: number) => {
          const n = dimObjs.length;
          dimObjs.forEach((d, i) => {
            let t = Math.min(1, Math.max(0, v * (1 + (n - 1) * 0.5) - i * 0.5));
            t = t * t * (3 - 2 * t);
            const m = d.a.clone().add(d.b).multiplyScalar(0.5);
            const pa = m.clone().lerp(d.a, t);
            const pb = m.clone().lerp(d.b, t);
            d.line.geometry.setFromPoints([pa, pb]);
            const dir = d.b.clone().sub(d.a).normalize();
            d.arrows[0].position.copy(pa).addScaledVector(dir, radius * 0.02);
            d.arrows[0].quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
            d.arrows[1].position.copy(pb).addScaledVector(dir, -radius * 0.02);
            d.arrows[1].quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            d.label.material.opacity = Math.max(0, t * 1.4 - 0.4);
          });
          lineMat.opacity = Math.min(1, v * 3);
          extMat.opacity = Math.min(0.55, v * 2);
          arrowMat.opacity = Math.min(1, v * 3);
          const on = v > 0.001;
          for (const d of dimObjs) for (const o of [d.line, d.ext, d.label, ...d.arrows]) o.visible = on;
        };
        applyDims(0);

        // Soft floor shadow: a radial gradient disc just under the model.
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = shadowCanvas.height = 128;
        const g = shadowCanvas.getContext('2d');
        if (g) {
          const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
          grad.addColorStop(0, 'rgba(0,0,0,0.55)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = grad;
          g.fillRect(0, 0, 128, 128);
        }
        const shadow = new THREE.Mesh(
          new THREE.PlaneGeometry(radius * 2.6, radius * 2.6),
          new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }),
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = -size.y / 2 - radius * 0.02;
        scene.add(shadow);

        const [yaw, pitch] = view;
        const fov = (camera.fov * Math.PI) / 180;
        const dist = (radius / Math.sin(fov / 2)) * 1.02;
        const yr = (yaw * Math.PI) / 180;
        const pr = (pitch * Math.PI) / 180;
        camera.position.set(Math.sin(yr) * Math.cos(pr) * dist, Math.sin(pr) * dist, Math.cos(yr) * Math.cos(pr) * dist);
        camera.near = dist / 100;
        camera.far = dist * 10;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.minDistance = radius * 0.8;
        controls.maxDistance = dist * 2.5;
        controls.update();

        const resize = () => {
          const w = host.clientWidth || 1;
          const h = host.clientHeight || 1;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(host);

        let visible = true;
        const io = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
        });
        io.observe(host);

        // Animation state: explode 0…1 and dimensions 0…1 ease towards their targets; the demo
        // takes the model apart, holds, assembles it and then draws the dimensions.
        let ex = 0, exTo = 0, dm = 0, dmTo = 0;
        let demo: { step: number; wait: number } | null = null;
        const sync = () => setUi({ parts: parts.length > 0, exploded: exTo > 0.5, dims: dmTo > 0.5 });
        apiRef.current = {
          explode: () => {
            demo = null;
            exTo = exTo > 0.5 ? 0 : 1;
            if (exTo > 0.5) dmTo = 0;
            controls.autoRotate = false;
            sync();
          },
          dims: () => {
            demo = null;
            dmTo = dmTo > 0.5 ? 0 : 1;
            if (dmTo > 0.5) exTo = 0;
            sync();
          },
          demo: () => {
            demo = { step: 0, wait: 0 };
            dmTo = 0;
            exTo = parts.length ? 1 : 0;
            controls.autoRotate = false;
            sync();
          },
        };
        sync();

        let raf = 0;
        let last = performance.now();
        const approach = (v: number, to: number, rate: number, dt: number) => (v < to ? Math.min(to, v + rate * dt) : Math.max(to, v - rate * dt));
        const tick = () => {
          raf = requestAnimationFrame(tick);
          const now = performance.now();
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          if (!visible || document.hidden) return;
          if (demo) {
            if (demo.step === 0 && ex >= exTo) { demo.step = 1; demo.wait = 1.4; }
            else if (demo.step === 1 && (demo.wait -= dt) <= 0) { demo.step = 2; exTo = 0; sync(); }
            else if (demo.step === 2 && ex <= 0) { demo.step = 3; dmTo = dimObjs.length ? 1 : 0; sync(); demo = null; }
          }
          // dimensions belong to the assembled model: fade them out while it is apart
          if (ex > 0 && dmTo === 0) dm = approach(dm, 0, 2.5, dt);
          const nex = approach(ex, exTo, 0.42, dt);
          if (nex !== ex) { ex = nex; applyExplode(ex); }
          const ndm = approach(dm, ex > 0.01 ? 0 : dmTo, 0.6, dt);
          if (ndm !== dm) { dm = ndm; applyDims(dm); }
          controls.update();
          renderer.render(scene, camera);
        };
        tick();
        setState('ready');
        if (autoDemo && !reduceMotion && (parts.length || dimObjs.length)) setTimeout(() => apiRef.current?.demo(), 900);

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          controls.dispose();
          apiRef.current = null;
          scene.traverse((obj: Any) => {
            obj.geometry?.dispose?.();
            obj.material?.map?.dispose?.();
            const m = obj.material;
            if (Array.isArray(m)) m.forEach((x) => x.dispose?.());
            else m?.dispose?.();
          });
          envTex.dispose();
          pmrem.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch (error) {
        console.warn('[ModelViewer]', error);
        if (!disposed) setState('fallback');
      }
    };

    // Start only when the viewer comes near the viewport.
    const lazy = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          lazy.disconnect();
          void start();
        }
      },
      { rootMargin: '200px' },
    );
    lazy.observe(host);

    return () => {
      disposed = true;
      lazy.disconnect();
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, finish, autoRotate, interactive, alt, view[0], view[1], rx, ry, rz, dimsKey, autoDemo]);

  return (
    <div className={`overflow-hidden ${className || 'relative'}`}>
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt={state === 'ready' ? '' : alt}
          aria-hidden={state === 'ready'}
          className={`absolute inset-0 size-full object-contain transition-opacity duration-700 ease-premium ${state === 'ready' ? 'opacity-0' : 'opacity-100'}`}
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <div ref={hostRef} className="absolute inset-0" />
      {state === 'loading' ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <span className="glass rounded-full border border-hairline-ink px-3 py-1.5 font-mono text-[11px] tracking-wide text-on-ink-muted">{loadingLabel}</span>
        </div>
      ) : null}
      {state === 'ready' && labels && (ui.parts || (dims && dims.length > 0)) ? (
        <div className="absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-center justify-center gap-2">
          {ui.parts ? (
            <button type="button" onClick={() => apiRef.current?.explode()} aria-pressed={ui.exploded} className={btn(ui.exploded)}>
              {ui.exploded ? labels.assemble : labels.explode}
            </button>
          ) : null}
          {dims && dims.length > 0 ? (
            <button type="button" onClick={() => apiRef.current?.dims()} aria-pressed={ui.dims} className={btn(ui.dims)}>
              {labels.dims}
            </button>
          ) : null}
          <button type="button" onClick={() => apiRef.current?.demo()} className={btn(false)}>
            ▶ {labels.demo}
          </button>
        </div>
      ) : null}
      {state === 'fallback' && fallbackLabel ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <span className="glass rounded-full border border-hairline-ink px-3 py-1.5 font-mono text-[11px] text-on-ink-muted">{fallbackLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
