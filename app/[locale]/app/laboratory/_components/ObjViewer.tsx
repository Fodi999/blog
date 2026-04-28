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
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// Inner model component (must be inside Canvas + Suspense)
// ─────────────────────────────────────────────────────────────────────────────

function ObjModel({ url }: { url: string }) {
  const obj = useLoader(OBJLoader, url);

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
        {/* Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 3]} intensity={1.2} castShadow={false} />
        <directionalLight position={[-3, -2, -2]} intensity={0.3} />

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
