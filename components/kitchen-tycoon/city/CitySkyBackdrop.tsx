/**
 * city/CitySkyBackdrop.tsx
 *
 * Layers:
 *  1. Sky dome   — gradient dark blue → twilight warm horizon
 *  2. Horizon    — warm ground plane at distance
 *  3. City silhouette — low-detail background buildings
 *  4. Distant lights  — emissive window dots
 */
'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

// ── Sky dome ─────────────────────────────────────────────────────────────────
function SkyDome() {
  const material = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,   // always renders as background — never clipped by depth buffer
    uniforms: {},
    vertexShader: /* glsl */`
      varying vec3 vWorldPos;
      void main() {
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vWorldPos;
      void main() {
        float t = clamp(normalize(vWorldPos).y * 0.5 + 0.5, 0.0, 1.0);
        // t=1 zenith, t=0 horizon/bottom
        vec3 zenith   = vec3(0.02,  0.05,  0.14);   // #050d24 — deep midnight blue
        vec3 midSky   = vec3(0.04,  0.11,  0.30);   // #0a1c4d — dark navy
        vec3 lowSky   = vec3(0.07,  0.20,  0.42);   // #12336b — evening blue
        vec3 horizon  = vec3(0.22,  0.38,  0.62);   // #38619e — lighter blue horizon
        vec3 warmHor  = vec3(0.48,  0.26,  0.10);   // #7a421a — warm amber glow
        vec3 ground   = vec3(0.06,  0.09,  0.14);   // #0f1724 — dark below horizon

        vec3 color;
        if (t > 0.70) {
          color = mix(midSky, zenith,  (t - 0.70) / 0.30);
        } else if (t > 0.45) {
          color = mix(lowSky, midSky,  (t - 0.45) / 0.25);
        } else if (t > 0.25) {
          color = mix(horizon, lowSky, (t - 0.25) / 0.20);
        } else if (t > 0.10) {
          color = mix(warmHor, horizon, (t - 0.10) / 0.15);
        } else {
          color = mix(ground, warmHor, t / 0.10);
        }
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  }), []);

  return (
    <mesh renderOrder={-1000}>
      <sphereGeometry args={[280, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// ── Horizon ground ────────────────────────────────────────────────────────────
function HorizonGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.0, 0]} renderOrder={-9}>
      <planeGeometry args={[800, 800]} />
      <meshStandardMaterial
        color="#0f1724"
        roughness={1}
        metalness={0}
        fog={false}
      />
    </mesh>
  );
}

// ── Seeded random ─────────────────────────────────────────────────────────────
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Single silhouette building ────────────────────────────────────────────────
function SilBuilding({ x, z, w, h, d, emissive, opacity }: {
  x: number; z: number; w: number; h: number; d: number; emissive: string; opacity: number;
}) {
  return (
    <group position={[x, h / 2, z]}>
      {/* Main block */}
      <mesh castShadow={false} receiveShadow={false}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color="#0c111a"
          emissive="#0d1428"
          emissiveIntensity={0.5}
          roughness={1}
          metalness={0}
          fog={false}
        />
      </mesh>
      {/* Random lit windows — emissive plane on front face */}
      {h > 3 && (
        <mesh position={[0, 0, d / 2 + 0.05]}>
          <planeGeometry args={[w * 0.7, h * 0.65]} />
          <meshBasicMaterial
            color={emissive}
            transparent
            opacity={opacity}
            fog={false}
          />
        </mesh>
      )}
      {/* Rooftop antenna */}
      {h > 6 && (
        <mesh position={[w * 0.3, h / 2 + 0.6, 0]}>
          <boxGeometry args={[0.06, 1.2, 0.06]} />
          <meshBasicMaterial color="#c84040" transparent opacity={0.7} fog={false} />
        </mesh>
      )}
    </group>
  );
}

// ── City silhouette ring ──────────────────────────────────────────────────────
function CitySilhouette() {
  const buildings = useMemo(() => {
    const result: Array<{ x: number; z: number; w: number; h: number; d: number; emissive: string; opacity: number }> = [];
    const rng = seeded(42);

    // 4 sides, each with a row of background buildings
    const sides = [
      { axis: 'z' as const, sign:  1, spread: 90, dist: 75 },
      { axis: 'z' as const, sign: -1, spread: 90, dist: 75 },
      { axis: 'x' as const, sign:  1, spread: 90, dist: 75 },
      { axis: 'x' as const, sign: -1, spread: 90, dist: 75 },
    ];

    // Warm tones for windows
    const windowColors = ['#ffcc66', '#ffe080', '#80b0ff', '#ff9040'];

    sides.forEach(({ axis, sign, spread, dist }) => {
      // Two depth layers per side
      [0, 20, 38].forEach((depthOffset) => {
        const count = 28 - depthOffset;
        for (let i = 0; i < count; i++) {
          const pos = (rng() - 0.5) * spread;
          const w   = 1.5 + rng() * 4;
          const d   = 1.5 + rng() * 3;
          // Taller buildings near center (old town feel)
          const distFactor = 1 - Math.abs(pos) / (spread / 2);
          const h = 1.5 + rng() * (3 + distFactor * 12);
          const emissive = windowColors[Math.floor(rng() * windowColors.length)];
          const opacity  = 0.06 + rng() * 0.08;

          if (axis === 'z') {
            result.push({ x: pos, z: sign * (dist + depthOffset), w, h, d, emissive, opacity });
          } else {
            result.push({ x: sign * (dist + depthOffset), z: pos, w, h, d, emissive, opacity });
          }
        }
      });
    });

    return result;
  }, []);

  return (
    <group>
      {buildings.map((b, i) => (
        <SilBuilding key={i} {...b} />
      ))}
    </group>
  );
}

// ── Distant light particles (city glow dots) ──────────────────────────────────
function CityLightParticles() {
  const { positions, colors } = useMemo(() => {
    const rng = seeded(99);
    const N = 300;
    const pos: number[] = [];
    const col: number[] = [];
    const palette = [
      [1.0, 0.75, 0.3],   // warm gold
      [0.6, 0.8,  1.0],   // bright blue-white
      [1.0, 0.5,  0.15],  // orange
      [1.0, 1.0,  0.9],   // near-white
    ];
    for (let i = 0; i < N; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = 55 + rng() * 70;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 0.5 + rng() * 10;
      pos.push(x, y, z);
      const c = palette[Math.floor(rng() * palette.length)];
      col.push(c[0], c[1], c[2]);
    }
    return {
      positions: new Float32Array(pos),
      colors:    new Float32Array(col),
    };
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
    return g;
  }, [positions, colors]);

  return (
    <points geometry={geo}>
      <pointsMaterial
        size={0.55}
        vertexColors
        transparent
        opacity={0.95}
        sizeAttenuation
        depthWrite={false}
        fog={false}
      />
    </points>
  );
}

// ── Stars (subtle) ────────────────────────────────────────────────────────────
function Stars() {
  const geo = useMemo(() => {
    const rng = seeded(7);
    const N = 600;
    const pos: number[] = [];
    for (let i = 0; i < N; i++) {
      const theta = rng() * Math.PI * 2;
      const phi   = rng() * Math.PI * 0.5; // upper hemisphere only
      const r     = 260;
      pos.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      );
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    return g;
  }, []);

  return (
    <points geometry={geo}>
      <pointsMaterial size={0.5} color="#c8d8f0" transparent opacity={0.45} depthWrite={false} sizeAttenuation fog={false} />
    </points>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function CitySkyBackdrop() {
  return (
    <group>
      <HorizonGround />
    </group>
  );
}
