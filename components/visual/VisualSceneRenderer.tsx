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
      onPointerMissed={() => onSelectEntity?.(null)}
      onCreated={handleCreated}
    >
      <color attach="background" args={['#070707']} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 9, 5]} intensity={1.2} castShadow={false} />
      <pointLight position={[-5, 4, -4]} intensity={0.4} color="#2d8cff" />
      <pointLight position={[5, 4, -4]} intensity={0.4} color="#ef4444" />

      <SceneInvalidator tick={scene.tick} />

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
