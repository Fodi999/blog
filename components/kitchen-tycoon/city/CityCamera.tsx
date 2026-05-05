/**
 * city/CityCamera.tsx
 *
 * Spherical orbit camera — full mouse control:
 *
 *   Left drag   → pan (move focus point on XZ plane)
 *   Right drag  → orbit  (azimuth + pitch/elevation)
 *   Middle drag → pan (same as left)
 *   Scroll      → zoom in/out
 *   WASD        → pan in screen space
 *   Q / E       → rotate azimuth ±
 */
'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useKitchen } from '../engine/StoreProvider';

interface Props {
  direction?: number;
  zoom?: number;
  target?: [number, number, number];
}

export function CityCamera({ direction = 0, zoom = 16, target = [0, 0, 0] }: Props) {
  const { camera, gl } = useThree();
  const zoomIn  = useKitchen((s) => s.zoomIn);
  const zoomOut = useKitchen((s) => s.zoomOut);

  const focusTarget = useRef(new THREE.Vector3(...target));
  const currentPos  = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  // Spherical angles
  const azimuth = useRef(THREE.MathUtils.degToRad(direction + 45));
  const elev    = useRef(THREE.MathUtils.degToRad(38)); // start: 38° above horizon → sky visible
  const azTarget = useRef(azimuth.current);
  const elTarget = useRef(elev.current);

  const keys = useRef<Record<string, boolean>>({});
  const drag = useRef<{ button: number; x: number; y: number; moved: boolean } | null>(null);

  // ── Keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const onUp   = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
    };
  }, []);

  // ── Mouse ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = gl.domElement;

    const onDown = (e: MouseEvent) => {
      drag.current = { button: e.button, x: e.clientX, y: e.clientY, moved: false };
    };

    const onMove = (e: MouseEvent) => {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      if (!drag.current.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      drag.current.moved = true;
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;

      if (drag.current.button === 2) {
        // Right drag → orbit
        azTarget.current -= dx * 0.005;
        elTarget.current += dy * 0.005;
        elTarget.current = THREE.MathUtils.clamp(
          elTarget.current,
          THREE.MathUtils.degToRad(8),
          THREE.MathUtils.degToRad(78),
        );
      } else {
        // Left / middle drag → pan
        const az = azimuth.current;
        const fwdX  = -Math.cos(az);
        const fwdZ  = -Math.sin(az);
        const rightX =  fwdZ;
        const rightZ = -fwdX;
        const sensitivity = 0.025 * (zoom / 16);
        focusTarget.current.x -= rightX * dx * sensitivity;
        focusTarget.current.z -= rightZ * dx * sensitivity;
        focusTarget.current.x += fwdX   * dy * sensitivity;
        focusTarget.current.z += fwdZ   * dy * sensitivity;
      }
    };

    const onUp  = () => { drag.current = null; };
    const noCtx = (e: MouseEvent) => e.preventDefault();
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) zoomOut();
      else zoomIn();
    };

    el.addEventListener('mousedown',     onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    el.addEventListener('contextmenu',   noCtx);
    el.addEventListener('wheel',         onWheel, { passive: false });
    return () => {
      el.removeEventListener('mousedown',     onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      el.removeEventListener('contextmenu',   noCtx);
      el.removeEventListener('wheel',         onWheel);
    };
  }, [gl, zoom, zoomIn, zoomOut]);

  // ── Per-frame ────────────────────────────────────────────────────────────────
  useFrame(() => {
    // Q/E → rotate azimuth
    if (keys.current['KeyQ']) azTarget.current += 0.02;
    if (keys.current['KeyE']) azTarget.current -= 0.02;

    // Smooth lerp angles
    azimuth.current += (azTarget.current - azimuth.current) * 0.12;
    elev.current    += (elTarget.current - elev.current)    * 0.12;

    // WASD pan aligned to current azimuth
    const spd    = 0.12 * (zoom / 16);
    const az     = azimuth.current;
    const fwdX   = -Math.cos(az);
    const fwdZ   = -Math.sin(az);
    const rightX =  fwdZ;
    const rightZ = -fwdX;

    let mx = 0, mz = 0;
    if (keys.current['KeyW'] || keys.current['ArrowUp'])    { mx += fwdX;  mz += fwdZ;  }
    if (keys.current['KeyS'] || keys.current['ArrowDown'])  { mx -= fwdX;  mz -= fwdZ;  }
    if (keys.current['KeyA'] || keys.current['ArrowLeft'])  { mx -= rightX; mz -= rightZ; }
    if (keys.current['KeyD'] || keys.current['ArrowRight']) { mx += rightX; mz += rightZ; }

    if (mx !== 0 || mz !== 0) {
      const len = Math.sqrt(mx * mx + mz * mz);
      focusTarget.current.x += (mx / len) * spd;
      focusTarget.current.z += (mz / len) * spd;
    }

    // Spherical → Cartesian
    const r  = zoom;
    const el = elev.current;
    const px = focusTarget.current.x + r * Math.cos(el) * Math.cos(az);
    const py = focusTarget.current.y + r * Math.sin(el);
    const pz = focusTarget.current.z + r * Math.cos(el) * Math.sin(az);

    const desired = new THREE.Vector3(px, py, pz);

    if (!initialized.current) {
      currentPos.current.copy(desired);
      initialized.current = true;
    }

    currentPos.current.lerp(desired, 0.1);
    camera.position.copy(currentPos.current);
    camera.lookAt(focusTarget.current);
  });

  return null;
}
