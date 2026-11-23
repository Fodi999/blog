'use client';

import { useEffect, useRef, useState } from 'react';
import { ensureThreeImportMap } from '@/lib/three';

/* A texture on a ball or a plate in the site's studio light: the downloaded maps exactly as a standard PBR renderer
   (three.js MeshStandardMaterial) reads them — normal map in the OpenGL convention, roughness linear, base colour and
   metalness as values. three.js is self-hosted (lib/three.ts) and loaded only when the preview comes near the screen. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const runtimeImport = (url: string): Promise<Any> => new Function('u', 'return import(u)')(url);

type Shape = 'ball' | 'plate';

type Props = {
  normal: string;
  roughness: string;
  /** colour map (sRGB), when the colour varies; then `base` is only its average */
  colour?: string;
  /** linear RGB */
  base: [number, number, number];
  metal: number;
  /** the tile's real size, mm: the ball (Ø50 mm) and the plate (120 mm) show the pattern at its true scale */
  tileMm: number;
  alt: string;
  labels: { ball: string; plate: string; loading: string; fallback: string };
  poster?: string;
};

export function TexturePreview({ normal, roughness, colour, base, metal, tileMm, alt, labels, poster }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<(s: Shape) => void>(() => {});
  const [shape, setShape] = useState<Shape>('ball');
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'fallback'>('idle');

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    const start = async () => {
      setState('loading');
      try {
        ensureThreeImportMap();
        const [THREE, { OrbitControls }] = await Promise.all([runtimeImport('three'), runtimeImport('three/addons/controls/OrbitControls.js')]);
        if (disposed) return;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.setAttribute('role', 'img');
        renderer.domElement.setAttribute('aria-label', alt);
        host.appendChild(renderer.domElement);

        // the studio of the site's model viewer: a top softbox, two side strips, a dark floor
        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        const studio = new THREE.Scene();
        studio.background = new THREE.Color(0x4a525e);
        const panel = (w: number, h: number, color: number, k: number, pos: [number, number, number]) => {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
          m.position.set(...pos);
          m.lookAt(0, 0, 0);
          studio.add(m);
        };
        panel(14, 7, 0xffffff, 4.0, [0, 6, 1]);
        panel(2.5, 8, 0xffffff, 3.0, [-6, 1, 2]);
        panel(2.5, 8, 0xbfe9ff, 2.2, [6, 1, -2]);
        panel(16, 16, 0x0e1218, 1.0, [0, -5, 0]);
        const envTex = pmrem.fromScene(studio, 0.02).texture;
        scene.environment = envTex;
        studio.traverse((o: Any) => {
          o.geometry?.dispose?.();
          o.material?.dispose?.();
        });

        const loader = new THREE.TextureLoader();
        const load = async (url: string, srgb = false) => {
          const t = await loader.loadAsync(url);
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
          t.anisotropy = renderer.capabilities.getMaxAnisotropy();
          return t;
        };
        const [nTex, rTex, cTex] = await Promise.all([load(normal), load(roughness), colour ? load(colour, true) : Promise.resolve(null)]);
        if (disposed) {
          renderer.dispose();
          return;
        }
        const material = new THREE.MeshStandardMaterial({ metalness: metal, roughness: 1, normalMap: nTex, roughnessMap: rTex });
        if (cTex) material.map = cTex;
        else material.color.setRGB(base[0], base[1], base[2], THREE.LinearSRGBColorSpace);

        // metres; repeats so one tile = tileMm on the surface
        const R = 0.025;
        const tile = tileMm / 1000;
        const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 160, 80), material);
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(2 * tile, 2 * tile), material);
        plate.rotation.x = -Math.PI / 2;
        scene.add(ball, plate);

        const camera = new THREE.PerspectiveCamera(30, 1, 0.001, 10);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        controls.autoRotate = !reduceMotion;
        controls.autoRotateSpeed = 0.8;
        controls.addEventListener('start', () => (controls.autoRotate = false));

        const show = (s: Shape) => {
          const isBall = s === 'ball';
          ball.visible = isBall;
          plate.visible = !isBall;
          const rep = isBall ? [(2 * Math.PI * R) / tile, (Math.PI * R) / tile] : [2, 2];
          for (const t of [nTex, rTex, cTex]) t?.repeat.set(rep[0], rep[1]);
          const d = isBall ? 0.2 : 0.26;
          const pitch = isBall ? 0.32 : 0.68;
          camera.position.set(0, Math.sin(pitch) * d, Math.cos(pitch) * d);
          controls.target.set(0, 0, 0);
          controls.minDistance = isBall ? 0.06 : 0.08;
          controls.maxDistance = 0.5;
          controls.maxPolarAngle = isBall ? Math.PI : Math.PI / 2 - 0.05;
          controls.update();
        };
        shapeRef.current = show;
        show('ball');

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
        const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
        io.observe(host);

        let raf = 0;
        const tick = () => {
          raf = requestAnimationFrame(tick);
          if (!visible || document.hidden) return;
          controls.update();
          renderer.render(scene, camera);
        };
        tick();
        setState('ready');

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          controls.dispose();
          for (const o of [ball, plate]) o.geometry.dispose();
          material.dispose();
          nTex.dispose();
          rTex.dispose();
          cTex?.dispose();
          envTex.dispose();
          pmrem.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch (error) {
        console.warn('[TexturePreview]', error);
        if (!disposed) setState('fallback');
      }
    };

    const lazy = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          lazy.disconnect();
          start();
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
  }, [normal, roughness, colour, base, metal, tileMm, alt]);

  const pick = (s: Shape) => {
    setShape(s);
    shapeRef.current(s);
  };
  const btn = (on: boolean) =>
    `glass rounded-md border px-3.5 py-1.5 font-mono text-[11.5px] transition-colors ${on ? 'border-signal text-signal' : 'border-hairline-ink-strong text-on-ink hover:border-on-ink/60'}`;

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-hairline-ink-strong bg-[radial-gradient(ellipse_at_50%_40%,#2a3038,#0b0e12_70%)]">
      <div ref={hostRef} className="absolute inset-0" />
      {state !== 'ready' && poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt={alt} className="absolute inset-0 h-full w-full object-cover opacity-90" />
      )}
      {state === 'loading' && <span className="absolute bottom-3 left-3 font-mono text-[11.5px] text-on-ink-muted">{labels.loading}</span>}
      {state === 'fallback' && <span className="absolute bottom-3 left-3 font-mono text-[11.5px] text-on-ink-muted">{labels.fallback}</span>}
      {state === 'ready' && (
        <div className="absolute right-3 bottom-3 flex gap-2">
          <button type="button" className={btn(shape === 'ball')} aria-pressed={shape === 'ball'} onClick={() => pick('ball')}>
            {labels.ball}
          </button>
          <button type="button" className={btn(shape === 'plate')} aria-pressed={shape === 'plate'} onClick={() => pick('plate')}>
            {labels.plate}
          </button>
        </div>
      )}
    </div>
  );
}
