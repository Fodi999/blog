/**
 * TycoonCamera.tsx
 *
 * Game-style tycoon camera controller:
 *   – Fixed elevation angle (~55°), pan freely around Y axis
 *   – WASD / Arrow keys — pan the view
 *   – Scroll wheel — zoom in/out
 *   – Q / E — snap-rotate 90° (like PlateUp! / Two Point Hospital)
 *   – Right-mouse drag — pan
 *   – No free tilt (polar angle locked)
 */
'use client';

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const POLAR = Math.PI / 3.5;          // ~51° from zenith — tycoon sweet-spot
const PAN_SPEED = 0.07;
const ZOOM_SPEED = 0.8;
const ZOOM_MIN = 5;
const ZOOM_MAX = 22;
const SNAP_DEG = 90;
const LERP_FACTOR = 0.10;             // camera smoothing (lower = smoother)
const SNAP_LERP = 0.12;

export function TycoonCamera({ target = [0, 0, 0] as [number, number, number] }) {
  const { camera, gl } = useThree();

  // ── State refs ────────────────────────────────────────────────────────────
  const azimuth  = useRef(Math.PI / 4);           // 45° initial — corner view
  const targetAz = useRef(Math.PI / 4);
  const radius   = useRef(13);
  const targetR  = useRef(13);
  const focus    = useRef(new THREE.Vector3(...target));
  const targetFocus = useRef(new THREE.Vector3(...target));

  // Keys held
  const keys = useRef<Record<string, boolean>>({});

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;

      // Q = rotate CCW 90°, E = rotate CW 90°
      if (e.code === 'KeyQ') {
        targetAz.current -= (SNAP_DEG * Math.PI) / 180;
      }
      if (e.code === 'KeyE') {
        targetAz.current += (SNAP_DEG * Math.PI) / 180;
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // ── Scroll zoom ───────────────────────────────────────────────────────────
  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetR.current = THREE.MathUtils.clamp(
        targetR.current + e.deltaY * 0.01 * ZOOM_SPEED,
        ZOOM_MIN,
        ZOOM_MAX,
      );
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [gl]);

  // ── Mouse drag: left = rotate, right/middle = pan ────────────────────────
  const drag = useRef<{ button: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = gl.domElement;

    const onMouseDown = (e: MouseEvent) => {
      // button 0 = left (rotate), 1 = middle (pan), 2 = right (pan)
      drag.current = { button: e.button, x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      drag.current = { ...drag.current, x: e.clientX, y: e.clientY };

      if (drag.current.button === 0) {
        // Left drag → rotate azimuth
        targetAz.current -= dx * 0.008;
      } else {
        // Right / middle drag → pan
        const speed = 0.015 * (radius.current / 10);
        const az = azimuth.current;
        const ndx = dx * speed, ndz = dy * speed;
        targetFocus.current.x -= Math.cos(az) * ndx - Math.sin(az) * ndz;
        targetFocus.current.z -= Math.sin(az) * ndx + Math.cos(az) * ndz;
      }
    };
    const onMouseUp = () => { drag.current = null; };
    const noCtx = (e: MouseEvent) => e.preventDefault();

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('contextmenu', noCtx);
    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('contextmenu', noCtx);
    };
  }, [gl]);

  // ── Per-frame update ──────────────────────────────────────────────────────
  useFrame(() => {
    // WASD / Arrow pan — direction relative to current azimuth
    const az = azimuth.current;
    let dx = 0, dz = 0;
    if (keys.current['KeyW'] || keys.current['ArrowUp'])    dz -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown'])  dz += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft'])  dx -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) dx += 1;

    if (dx !== 0 || dz !== 0) {
      // normalise
      const len = Math.sqrt(dx * dx + dz * dz);
      const ndx = dx / len, ndz = dz / len;
      const panSpeed = PAN_SPEED * (radius.current / 10); // scale speed with zoom
      targetFocus.current.x += (Math.cos(az) * ndx - Math.sin(az) * ndz) * panSpeed;
      targetFocus.current.z += (Math.sin(az) * ndx + Math.cos(az) * ndz) * panSpeed;
    }

    // Lerp values
    azimuth.current += (targetAz.current - azimuth.current) * SNAP_LERP;
    radius.current  += (targetR.current  - radius.current)  * LERP_FACTOR;
    focus.current.lerp(targetFocus.current, LERP_FACTOR);

    // Compute camera position from spherical coords
    const r  = radius.current;
    const phi = POLAR; // fixed elevation
    const theta = azimuth.current;

    camera.position.set(
      focus.current.x + r * Math.sin(phi) * Math.sin(theta),
      focus.current.y + r * Math.cos(phi),
      focus.current.z + r * Math.sin(phi) * Math.cos(theta),
    );
    camera.lookAt(focus.current);
  });

  return null;
}
