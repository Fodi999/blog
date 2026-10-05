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
};

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
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
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
        panel(8, 1.2, 0xc4ff4d, 0.6, [0, -1.5, -6]);
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
                color: finish === 'satin' ? 0xb9c1cb : 0xc8cfd8,
                metalness: 1,
                roughness: finish === 'satin' ? 0.34 : 0.22,
                clearcoat: finish === 'satin' ? 0 : 0.3,
                clearcoatRoughness: 0.25,
              });
        model.traverse((obj: Any) => {
          if (obj.isMesh) obj.material = material;
        });
        model.rotation.set((rx * Math.PI) / 180, (ry * Math.PI) / 180, (rz * Math.PI) / 180);
        const holder = new THREE.Group();
        holder.add(model);

        // Centre the model at the origin and frame it.
        const box = new THREE.Box3().setFromObject(holder);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        holder.position.sub(center);
        scene.add(holder);
        const radius = size.length() / 2 || 1;

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
          scene.traverse((obj: Any) => {
            obj.geometry?.dispose?.();
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
  }, [src, finish, autoRotate, interactive, alt, view[0], view[1], rx, ry, rz]);

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
      {state === 'fallback' && fallbackLabel ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <span className="glass rounded-full border border-hairline-ink px-3 py-1.5 font-mono text-[11px] text-on-ink-muted">{fallbackLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
