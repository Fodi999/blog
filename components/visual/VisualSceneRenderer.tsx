'use client';

/**
 * VisualSceneRenderer — domain-agnostic R3F renderer.
 *
 * Reads a `SceneState`, walks `entities`, and dispatches each entity to
 * its prefab. Knows nothing about inventory, recipes, etc. The shell
 * around it (header, toolbar, detail panel) is composed by the page.
 */

// ── Suppress troika-three-text THREE.Clock deprecation noise ────────────────
// troika-three-text@0.52.x internally uses THREE.Clock which Three.js 0.175+
// marks deprecated. It's a third-party issue; suppress until troika updates.
if (typeof window !== 'undefined') {
  const _origWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return;
    _origWarn(...args);
  };
}

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { memo, useEffect, useRef } from 'react';
import * as THREE from 'three';

import { resolveEntityPrefab } from './prefabs/registry';
import { SceneFloor } from './SceneFloor';
import type { SceneEntity, SceneState, Vec3Tuple } from './sceneTypes';

interface Props {
  scene: SceneState;
  selectedEntityId?: string | null;
  onSelectEntity?: (entityId: string | null) => void;
}

// ── Camera rig — flies toward selected entity ────────────────────────────────
const _camTarget = new THREE.Vector3();
const _camPos = new THREE.Vector3();

function CameraRig({ target }: { target: Vec3Tuple | null }) {
  const { camera, invalidate } = useThree();
  useFrame(() => {
    if (!target) return;
    _camTarget.set(target[0], target[1] + 0.5, target[2]);
    _camPos.set(target[0], target[1] + 4, target[2] + 5.5);
    camera.position.lerp(_camPos, 0.04);
    camera.lookAt(_camTarget);
    invalidate();
  });
  return null;
}

// ── Per-entity dispatch ──────────────────────────────────────────────────────
const EntityRenderer = memo(function EntityRenderer({
  entity,
  selected,
  onSelect,
}: {
  entity: SceneEntity;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const Prefab = resolveEntityPrefab(entity);
  if (!Prefab || Prefab.name === 'NotImplemented') {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        '[VisualSceneRenderer] No prefab for entity',
        { id: entity.id, prefab: entity.prefab, kind: entity.geometry.kind },
      );
    }
    return null;
  }
  return <Prefab entity={entity} selected={selected} onSelect={onSelect} />;
});

// ── Scene invalidator — forces a repaint whenever the scene tick changes ────
// Required because frameloop="demand" otherwise wouldn't repaint when the
// entities array is replaced (e.g. fallback → backend swap).
function SceneInvalidator({ tick }: { tick: number }) {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [tick, invalidate]);
  return null;
}

// ── Atmospheric sky dome + horizon glow + dust ───────────────────────────────

/** Subtle star/dust particles — very faint, non-distracting */
const _dustPositions = (() => {
  const COUNT = 280;
  const arr = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r   = 30 + Math.random() * 55;
    const phi = Math.random() * Math.PI * 2;
    const th  = (0.05 + Math.random() * 0.7) * Math.PI;
    arr[i * 3]     = r * Math.sin(th) * Math.cos(phi);
    arr[i * 3 + 1] = r * Math.cos(th);
    arr[i * 3 + 2] = r * Math.sin(th) * Math.sin(phi);
  }
  return arr;
})();

function SceneDust() {
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[_dustPositions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        color="#4a6fa8"
        transparent
        opacity={0.30}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/** Background sky dome — deep navy, BackSide material */
function SceneSkyDome() {
  return (
    <mesh scale={110}>
      <sphereGeometry args={[1, 32, 20]} />
      <meshBasicMaterial color="#020810" side={THREE.BackSide} />
    </mesh>
  );
}

/** Layered atmosphere planes — gradient from top to horizon */
function SceneAtmosphere() {
  return (
    <group>
      {/* Top sky glow — very distant, cool deep blue */}
      <mesh position={[0, 28, -55]} rotation={[0.32, 0, 0]}>
        <planeGeometry args={[200, 80]} />
        <meshBasicMaterial color="#06112a" transparent opacity={0.55} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Mid glow layer */}
      <mesh position={[0, 16, -48]} rotation={[0.22, 0, 0]}>
        <planeGeometry args={[160, 50]} />
        <meshBasicMaterial color="#08182e" transparent opacity={0.40} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Horizon glow band */}
      <mesh position={[0, 7, -38]} rotation={[0.10, 0, 0]}>
        <planeGeometry args={[130, 22]} />
        <meshBasicMaterial color="#0e2248" transparent opacity={0.28} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Very faint aurora-tint — cyan strip high up */}
      <mesh position={[0, 22, -50]} rotation={[0.28, 0, 0]}>
        <planeGeometry args={[100, 10]} />
        <meshBasicMaterial color="#0a2240" transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Subtle left-side glow pillar */}
      <mesh position={[-55, 14, -30]} rotation={[0, 0.35, 0]}>
        <planeGeometry args={[18, 60]} />
        <meshBasicMaterial color="#071830" transparent opacity={0.14} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Subtle right-side glow pillar */}
      <mesh position={[55, 14, -30]} rotation={[0, -0.35, 0]}>
        <planeGeometry args={[18, 60]} />
        <meshBasicMaterial color="#071830" transparent opacity={0.14} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function VisualSceneRenderer({ scene, selectedEntityId, onSelectEntity }: Props) {
  const orbitRef = useRef<OrbitControlsImpl | null>(null);

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[VisualSceneRenderer] scene', {
      sceneId: scene.sceneId,
      mode: scene.mode,
      tick: scene.tick,
      entities: scene.entities?.length,
      kinds: Array.from(new Set(scene.entities.map((e) => e.geometry.kind))),
    });
  }

  const selected = scene.entities.find((e) => e.id === selectedEntityId) ?? null;
  const cameraTarget: Vec3Tuple | null = selected ? selected.transform.position : null;

  const handleSelect = (id: string) => {
    onSelectEntity?.(id === selectedEntityId ? null : id);
  };

  // Camera config is captured ONCE on first render and frozen — re-creating
  // the `camera` prop on each render would otherwise trigger R3F to consider
  // the camera "new" and could remount the renderer.
  const initialCameraRef = useRef({
    position: scene.camera.position,
    fov: scene.camera.fov,
  });

  // Frozen on first render — see initialCameraRef rationale above.
  const orbitTargetRef = useRef<Vec3Tuple>(scene.camera.target);

  // Memoise gl options for the same reason — reference stability matters
  // because Canvas compares prop refs to decide whether to re-create renderer.
  const glOptionsRef = useRef({
    antialias: true,
    powerPreference: 'default' as const,
    failIfMajorPerformanceCaveat: false,
    preserveDrawingBuffer: false,
  });

  // Critical: allow the browser to recover the WebGL context after it gets
  // evicted (HMR, GPU pressure, tab backgrounding). Without preventDefault
  // on `webglcontextlost` the browser will NOT fire `webglcontextrestored`.
  const handleCreated = ({ gl, invalidate }: {
    gl: THREE.WebGLRenderer;
    invalidate: () => void;
  }) => {
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[VisualSceneRenderer] WebGL context lost — will auto-restore');
      }
      // Try to nudge the browser into restoring the context. Some browsers
      // require an explicit hint, otherwise they keep the context dead
      // until tab backgrounding / focus.
      requestAnimationFrame(() => {
        const ext = gl.getContext().getExtension('WEBGL_lose_context');
        try {
          ext?.restoreContext();
        } catch {
          /* ignore — restore is best-effort */
        }
      });
    }, { passive: false });
    canvas.addEventListener('webglcontextrestored', () => {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.info('[VisualSceneRenderer] WebGL context restored');
      }
      invalidate();
    });
  };

  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop="demand"
      camera={initialCameraRef.current}
      className="h-full w-full"
      gl={glOptionsRef.current}
      shadows
      onPointerMissed={() => onSelectEntity?.(null)}
      onCreated={handleCreated}
    >
      {/* ── Background: deep space dark with subtle blue tint ── */}
      <color attach="background" args={['#020810']} />

      {/* ── Fog: blends scene into sky dome at distance ── */}
      <fog attach="fog" args={['#040e20', 32, 90]} />

      {/* ── Ambient: very low base, prevents total blackness ── */}
      <ambientLight intensity={0.35} />

      {/* ── Key light: main directional from top-right, warm white ── */}
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.6}
        color="#e8f0ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0005}
      />

      {/* ── Rim light: cool blue from left-back (edge highlight) ── */}
      <directionalLight
        position={[-10, 6, -8]}
        intensity={0.55}
        color="#3b82f6"
      />

      {/* ── Fill light: soft warm from front-right ── */}
      <directionalLight
        position={[6, 3, 10]}
        intensity={0.30}
        color="#fcd34d"
      />

      {/* ── Overhead wide fill: ensures floors lit from above ── */}
      <pointLight
        position={[0, 16, 0]}
        intensity={0.9}
        color="#c7d8ff"
        distance={55}
        decay={1.5}
      />

      {/* ── Left accent: cold blue glow ── */}
      <pointLight
        position={[-14, 3, 0]}
        intensity={0.4}
        color="#38bdf8"
        distance={22}
        decay={2}
      />

      {/* ── Right accent: warm amber glow ── */}
      <pointLight
        position={[14, 3, 0]}
        intensity={0.3}
        color="#fb923c"
        distance={22}
        decay={2}
      />

      <SceneInvalidator tick={scene.tick} />

      {/* ── Atmosphere: sky dome + gradient planes + dust ── */}
      <SceneSkyDome />
      <SceneAtmosphere />
      <SceneDust />

      {/* Shared sci-fi grid floor */}
      <SceneFloor size={60} divisions={30} />

      {scene.entities.map((entity) => (
        <EntityRenderer
          key={entity.id}
          entity={entity}
          selected={entity.id === selectedEntityId}
          onSelect={handleSelect}
        />
      ))}

      <CameraRig target={cameraTarget} />

      <OrbitControls
        ref={orbitRef}
        enablePan
        enableZoom
        enableRotate
        minDistance={6}
        maxDistance={24}
        maxPolarAngle={Math.PI / 2.05}
        target={orbitTargetRef.current}
        makeDefault
      />
    </Canvas>
  );
}
