'use client';

/**
 * StorageRoom3D — sci-fi open cold zone / storage module prefab.
 *
 * Assembly:
 *   0. Contact shadow plane (shadowMaterial)
 *   0b. Bottom mass — thick dark base giving weight
 *   1. Thick dark base plate (RoundedBox)
 *   2. Inner recessed floor — theme-tinted color
 *   2b. Subtle emissive floor accent lines
 *   3. 4 metal corner pillars
 *   4. Back + side glass walls (meshPhysicalMaterial)
 *   5. Front low metal frame bar
 *   6. Top rear cooling block
 *   7. Emissive light strips (front + side edges + top trim)
 *   8. Front label plaque (title / subtitle / item count)
 *
 * Backend drives size, wall_height, wall_thickness, corner_radius via
 * EntityGeometry and accent / glass / emissive via EntityMaterial.
 *
 * Theme presets (matched to MaterialTheme):
 *   cold    → #38bdf8   glass 0.22  roughness 0.20  emissive 1.2
 *   freezer → #60a5fa   glass 0.32  roughness 0.45  emissive 1.5
 *   dry     → #f59e0b   glass 0.14  roughness 0.35  emissive 0.8
 *   risk    → #ef4444   glass 0.20  roughness 0.18  emissive 1.8
 */

import { RoundedBox, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

import type { SceneEntity } from '../sceneTypes';
import { themeColor } from '../theme';

// ─── theme presets ────────────────────────────────────────────────────────────
const PRESETS: Record<string, { accent: string; glassOpacity: number; roughness: number; emissiveInt: number }> = {
  cold:    { accent: '#38bdf8', glassOpacity: 0.22, roughness: 0.20, emissiveInt: 1.2 },
  freezer: { accent: '#60a5fa', glassOpacity: 0.32, roughness: 0.45, emissiveInt: 1.5 },
  dry:     { accent: '#f59e0b', glassOpacity: 0.14, roughness: 0.35, emissiveInt: 0.8 },
  risk:    { accent: '#ef4444', glassOpacity: 0.20, roughness: 0.18, emissiveInt: 1.8 },
  ok:      { accent: '#4ade80', glassOpacity: 0.18, roughness: 0.25, emissiveInt: 0.9 },
  warning: { accent: '#fb923c', glassOpacity: 0.18, roughness: 0.22, emissiveInt: 1.1 },
  neutral: { accent: '#94a3b8', glassOpacity: 0.16, roughness: 0.40, emissiveInt: 0.6 },
};

/** Per-theme inner floor color — gives each zone a distinct identity.
 *  Bright enough to be visible under ambient 0.9 + point lights. */
const FLOOR_COLOR: Record<string, string> = {
  cold:    '#0e2a40',
  freezer: '#0c1f3a',
  dry:     '#2a1c08',
  risk:    '#2d0c0c',
  ok:      '#0c2414',
  warning: '#2a1808',
  neutral: '#111827',
};

/** Subtle emissive tint on the floor — keeps it readable in dark scenes. */
const FLOOR_EMISSIVE: Record<string, string> = {
  cold:    '#06121d',
  freezer: '#051525',
  dry:     '#171006',
  risk:    '#180707',
  ok:      '#061408',
  warning: '#171007',
  neutral: '#0a0f1a',
};

// ─── THEME ICONS ─────────────────────────────────────────────────────────────
const THEME_ICON: Record<string, string> = {
  freezer: '❄',
  cold:    '🌡',
  dry:     '📦',
  risk:    '⚠',
  ok:      '✓',
  warning: '!',
  neutral: '○',
};

// ─── Ghost slot grid shown when zone is empty ─────────────────────────────────
function EmptyZoneContent({
  w, d, baseH, innerFloorY, accent, accentColor, theme,
}: {
  w: number; d: number; baseH: number; innerFloorY: number;
  accent: string; accentColor: THREE.Color; theme: string;
}) {
  const pulseRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (pulseRef.current) {
      pulseRef.current.emissiveIntensity = 0.18 + Math.sin(clock.elapsedTime * 1.4) * 0.10;
    }
  });

  // 3 ghost slots in a row
  const SLOT_W = 1.05;
  const SLOT_D = 0.16;
  const SLOT_H = 1.45;
  const slots = [-1.15, 0, 1.15].filter((_, i) => i < Math.floor((w - 1) / 1.35) + 1);

  return (
    <group>
      {/* Ghost empty slots */}
      {slots.map((x) => (
        <group key={x} position={[x, innerFloorY + SLOT_H / 2, 0]}>
          {/* Slot pocket outline */}
          <mesh>
            <boxGeometry args={[SLOT_W, SLOT_H, SLOT_D]} />
            <meshStandardMaterial
              color={accent}
              emissive={accentColor}
              emissiveIntensity={0.06}
              transparent
              opacity={0.09}
              roughness={0.4}
            />
          </mesh>
          {/* Top edge glow */}
          <mesh position={[0, SLOT_H / 2, 0]}>
            <boxGeometry args={[SLOT_W, 0.018, SLOT_D + 0.01]} />
            <meshStandardMaterial
              ref={x === 0 ? pulseRef : undefined}
              color={accent}
              emissive={accentColor}
              emissiveIntensity={0.18}
              transparent opacity={0.5}
            />
          </mesh>
          {/* Bottom edge glow */}
          <mesh position={[0, -SLOT_H / 2, 0]}>
            <boxGeometry args={[SLOT_W, 0.018, SLOT_D + 0.01]} />
            <meshStandardMaterial color={accent} emissive={accentColor} emissiveIntensity={0.12} transparent opacity={0.4} />
          </mesh>
        </group>
      ))}

      {/* "EMPTY" floating badge */}
      <group position={[0, innerFloorY + 2.1, 0.18]}>
        <RoundedBox args={[1.6, 0.38, 0.06]} radius={0.06} smoothness={3}>
          <meshStandardMaterial
            color="#0a0f1a"
            emissive={accentColor}
            emissiveIntensity={0.12}
            transparent opacity={0.85}
          />
        </RoundedBox>
        <Text
          position={[0.15, 0, 0.04]}
          fontSize={0.13}
          color={accent}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.12}
        >
          {`${THEME_ICON[theme] ?? '○'}  EMPTY`}
        </Text>
      </group>

      {/* Diagonal dashed floor pattern — subtle grid lines */}
      {[-0.9, -0.3, 0.3, 0.9].map((z) => (
        <mesh key={z} position={[0, innerFloorY + 0.032, z]}>
          <boxGeometry args={[w - 0.9, 0.008, 0.012]} />
          <meshStandardMaterial
            color={accent}
            emissive={accentColor}
            emissiveIntensity={0.20}
            transparent opacity={0.18}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Main prefab ──────────────────────────────────────────────────────────────
export function StorageRoom3D({ entity }: { entity: SceneEntity }) {
  const theme   = entity.material.theme ?? 'cold';
  const preset  = PRESETS[theme] ?? PRESETS.neutral;

  // Backend overrides beat preset defaults
  const accent       = themeColor(theme, entity.material.color) ?? preset.accent;
  const glassOpacity = entity.material.glassOpacity ?? preset.glassOpacity;
  const roughnessVal = entity.material.roughness    ?? preset.roughness;
  const emissiveInt  = entity.material.emissive > 0 ? entity.material.emissive : preset.emissiveInt;

  // Geometry sizes from backend or sensible defaults
  const geo         = entity.geometry;
  const w           = geo.size?.[0] ?? 6.0;
  const d           = geo.size?.[2] ?? 4.2;
  const wallH       = geo.wallHeight    ?? 0.55;
  const wallT       = geo.wallThickness ?? 0.08;
  const baseH       = 0.28;
  const innerFloorY = baseH + 0.03;
  const glassY      = baseH + wallH * 0.5;
  const cr          = geo.cornerRadius  ?? 0.16;

  const accentColor    = new THREE.Color(accent);
  const floorColor     = FLOOR_COLOR[theme]    ?? FLOOR_COLOR.neutral;
  const floorEmissive  = FLOOR_EMISSIVE[theme] ?? FLOOR_EMISSIVE.neutral;

  // ── materials ──────────────────────────────────────────────────────────────
  // Outer structural frame — dark brushed metal, high metalness
  const frameMat = new THREE.MeshStandardMaterial({
    color: '#0d1117',
    roughness: 0.42,
    metalness: 0.72,
    envMapIntensity: 1.2,
  });

  // Inner channel trim — slightly lighter, distinct from outer frame
  const innerFrameMat = new THREE.MeshStandardMaterial({
    color: '#1c2333',
    roughness: 0.35,
    metalness: 0.60,
  });

  // Primary glass — deep tinted, physically based
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: accent,
    transparent: true,
    opacity: glassOpacity + 0.06,
    transmission: 0.55,
    roughness: roughnessVal * 0.7,
    metalness: 0,
    thickness: 0.8,
    ior: 1.45,
    reflectivity: 0.5,
    side: THREE.DoubleSide,
  });

  // Thin outer glass skin — adds layered depth
  const glassOuterMat = new THREE.MeshPhysicalMaterial({
    color: accent,
    transparent: true,
    opacity: 0.07,
    transmission: 0.80,
    roughness: 0.05,
    metalness: 0,
    thickness: 0.1,
    ior: 1.5,
    reflectivity: 0.8,
    side: THREE.FrontSide,
  });

  const glowMat = new THREE.MeshStandardMaterial({
    color: accent,
    emissive: accentColor,
    emissiveIntensity: emissiveInt,
    roughness: 0.15,
    metalness: 0.05,
  });

  // Brighter edge glow for wall ribs
  const edgeGlowMat = new THREE.MeshStandardMaterial({
    color: accent,
    emissive: accentColor,
    emissiveIntensity: emissiveInt * 1.4,
    roughness: 0.1,
    metalness: 0,
  });

  const innerFloorMat = new THREE.MeshStandardMaterial({
    color: floorColor,
    emissive: new THREE.Color(floorEmissive),
    emissiveIntensity: 1.8,   // self-lit so it's always readable
    roughness: 0.50,
    metalness: 0.20,
  });

  // ── label text ─────────────────────────────────────────────────────────────
  const title     = entity.content?.title    ?? '';
  const subtitle  = entity.content?.subtitle ?? '';
  const itemCount = entity.content?.badges?.[0] ?? '';
  const isEmpty   = itemCount === '0' || itemCount === '';

  // corner pillar positions (x, z)
  const hw = w / 2 - 0.12;
  const hd = d / 2 - 0.12;
  const corners: [number, number, number][] = [
    [-hw, baseH + wallH / 2, -hd],
    [ hw, baseH + wallH / 2, -hd],
    [-hw, baseH + wallH / 2,  hd],
    [ hw, baseH + wallH / 2,  hd],
  ];

  return (
    <group
      position={entity.transform.position}
      rotation={entity.transform.rotation}
    >
      {/* ── 0. Contact shadow (soft ground plane) ── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.25, 0]}
        receiveShadow
      >
        <planeGeometry args={[w * 1.1, d * 1.1]} />
        <shadowMaterial opacity={0.38} />
      </mesh>

      {/* ── 0b. Bottom mass — thick dark base giving weight ── */}
      <mesh position={[0, -0.08, 0]} receiveShadow castShadow>
        <boxGeometry args={[w, 0.16, d]} />
        <meshStandardMaterial color="#030712" roughness={0.65} metalness={0.35} />
      </mesh>

      {/* ── 1. Thick base plate ── */}
      <RoundedBox
        args={[w, baseH, d]}
        radius={cr}
        smoothness={4}
        position={[0, baseH / 2, 0]}
        castShadow
        receiveShadow
      >
        <primitive object={frameMat} attach="material" />
      </RoundedBox>

      {/* ── 2. Inner recessed floor — base dark slab ── */}
      <mesh position={[0, innerFloorY, 0]} receiveShadow>
        <boxGeometry args={[w - 0.35, 0.05, d - 0.35]} />
        <primitive object={innerFloorMat} attach="material" />
      </mesh>

      {/* ── 2-tint. Centre glow slab — soft radial tint over base ── */}
      <mesh position={[0, innerFloorY + 0.026, 0]}>
        <boxGeometry args={[w * 0.65, 0.004, d * 0.65]} />
        <meshStandardMaterial
          color={accent}
          emissive={accentColor}
          emissiveIntensity={0.28}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>

      {/* ── 2-ao. Soft AO shadow inset along all 4 inner walls ── */}
      {/* front/back AO strips */}
      {[-1, 1].map((sign) => (
        <mesh key={`ao-fb-${sign}`} position={[0, innerFloorY + 0.022, sign * (d / 2 - 0.42)]}>
          <boxGeometry args={[w - 0.36, 0.003, 0.55]} />
          <meshStandardMaterial color="#000000" transparent opacity={0.38} depthWrite={false} />
        </mesh>
      ))}
      {/* left/right AO strips */}
      {[-1, 1].map((sign) => (
        <mesh key={`ao-lr-${sign}`} position={[sign * (w / 2 - 0.42), innerFloorY + 0.022, 0]}>
          <boxGeometry args={[0.55, 0.003, d - 0.36]} />
          <meshStandardMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      ))}

      {/* ── 2a. Inner floor border glow ring ── */}
      {[-1, 1].map((sign) => (
        <mesh key={`edge-fb-${sign}`} position={[0, innerFloorY + 0.029, sign * (d / 2 - 0.22)]}>
          <boxGeometry args={[w - 0.38, 0.008, 0.018]} />
          <meshStandardMaterial color={accent} emissive={accentColor} emissiveIntensity={1.0} transparent opacity={0.6} />
        </mesh>
      ))}
      {[-1, 1].map((sign) => (
        <mesh key={`edge-lr-${sign}`} position={[sign * (w / 2 - 0.22), innerFloorY + 0.029, 0]}>
          <boxGeometry args={[0.018, 0.008, d - 0.38]} />
          <meshStandardMaterial color={accent} emissive={accentColor} emissiveIntensity={1.0} transparent opacity={0.6} />
        </mesh>
      ))}

      {/* ── 2b. Light strips — 2 parallel beams across floor width ── */}
      {[-d * 0.20, d * 0.20].map((z) => (
        <mesh key={`strip-${z}`} position={[0, innerFloorY + 0.031, z]}>
          <boxGeometry args={[w - 0.55, 0.006, 0.022]} />
          <meshStandardMaterial
            color={accent}
            emissive={accentColor}
            emissiveIntensity={0.70}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* ── 2b2. Cross-axis faint strip — perpendicular centre line ── */}
      <mesh position={[0, innerFloorY + 0.031, 0]}>
        <boxGeometry args={[0.022, 0.006, d - 0.55]} />
        <meshStandardMaterial
          color={accent}
          emissive={accentColor}
          emissiveIntensity={0.35}
          transparent
          opacity={0.30}
          depthWrite={false}
        />
      </mesh>

      {/* ── 2b3. Centre glow dot — focal point ── */}
      <mesh position={[0, innerFloorY + 0.032, 0]}>
        <boxGeometry args={[0.22, 0.007, 0.22]} />
        <meshStandardMaterial
          color={accent}
          emissive={accentColor}
          emissiveIntensity={1.2}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>

      {/* ── 2c. Interior fill lights ── */}
      {/* Upper fill — floods the whole zone with theme colour */}
      <pointLight
        position={[0, baseH + wallH * 0.85, 0]}
        intensity={0.9}
        distance={Math.max(w, d) * 1.4}
        color={accent}
        decay={2}
      />
      {/* Floor grazing light — catches the strips and tint slab */}
      <pointLight
        position={[0, innerFloorY + 0.08, 0]}
        intensity={0.7}
        distance={Math.max(w, d) * 1.1}
        color={accent}
        decay={1.2}
      />

      {/* ── 2d. Empty zone placeholder (ghost slots + badge + floor pattern) ── */}
      {isEmpty && (
        <EmptyZoneContent
          w={w} d={d} baseH={baseH} innerFloorY={innerFloorY}
          accent={accent} accentColor={accentColor} theme={theme}
        />
      )}

      {/* ── 3. Corner pillars — thick outer + inner channel ── */}
      {corners.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Outer structural pillar */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.22, wallH + 0.08, 0.22]} />
            <primitive object={frameMat} attach="material" />
          </mesh>
          {/* Inner channel recess — lighter metal, inset */}
          <mesh>
            <boxGeometry args={[0.10, wallH + 0.02, 0.10]} />
            <primitive object={innerFrameMat} attach="material" />
          </mesh>
          {/* Pillar top cap glow */}
          <mesh position={[0, (wallH + 0.08) / 2, 0]}>
            <boxGeometry args={[0.22, 0.018, 0.22]} />
            <primitive object={edgeGlowMat} attach="material" />
          </mesh>
        </group>
      ))}

      {/* ── 4a. Back glass wall ── */}
      <mesh position={[0, glassY, -d / 2 + wallT / 2 + 0.04]} receiveShadow>
        <boxGeometry args={[w - 0.24, wallH, wallT + 0.04]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      {/* Back outer skin */}
      <mesh position={[0, glassY, -d / 2 + 0.01]}>
        <boxGeometry args={[w - 0.24, wallH, 0.012]} />
        <primitive object={glassOuterMat} attach="material" />
      </mesh>
      {/* Back glass top edge glow */}
      <mesh position={[0, glassY + wallH / 2, -d / 2 + wallT / 2 + 0.04]}>
        <boxGeometry args={[w - 0.24, 0.016, wallT + 0.04]} />
        <primitive object={edgeGlowMat} attach="material" />
      </mesh>
      {/* Back glass bottom edge glow */}
      <mesh position={[0, glassY - wallH / 2, -d / 2 + wallT / 2 + 0.04]}>
        <boxGeometry args={[w - 0.24, 0.012, wallT + 0.04]} />
        <meshStandardMaterial color={accent} emissive={accentColor} emissiveIntensity={emissiveInt * 0.6} transparent opacity={0.5} />
      </mesh>

      {/* ── 4b. Left glass wall ── */}
      <mesh position={[-w / 2 + wallT / 2 + 0.04, glassY, 0]} receiveShadow>
        <boxGeometry args={[wallT + 0.04, wallH, d - 0.24]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      {/* Left outer skin */}
      <mesh position={[-w / 2 + 0.01, glassY, 0]}>
        <boxGeometry args={[0.012, wallH, d - 0.24]} />
        <primitive object={glassOuterMat} attach="material" />
      </mesh>
      {/* Left glass top edge glow */}
      <mesh position={[-w / 2 + wallT / 2 + 0.04, glassY + wallH / 2, 0]}>
        <boxGeometry args={[wallT + 0.04, 0.016, d - 0.24]} />
        <primitive object={edgeGlowMat} attach="material" />
      </mesh>

      {/* ── 4c. Right glass wall ── */}
      <mesh position={[w / 2 - wallT / 2 - 0.04, glassY, 0]} receiveShadow>
        <boxGeometry args={[wallT + 0.04, wallH, d - 0.24]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      {/* Right outer skin */}
      <mesh position={[w / 2 - 0.01, glassY, 0]}>
        <boxGeometry args={[0.012, wallH, d - 0.24]} />
        <primitive object={glassOuterMat} attach="material" />
      </mesh>
      {/* Right glass top edge glow */}
      <mesh position={[w / 2 - wallT / 2 - 0.04, glassY + wallH / 2, 0]}>
        <boxGeometry args={[wallT + 0.04, 0.016, d - 0.24]} />
        <primitive object={edgeGlowMat} attach="material" />
      </mesh>

      {/* ── 5. Front low metal frame bar — thicker, with inner channel ── */}
      <mesh position={[0, baseH + 0.10, d / 2 - 0.10]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.18, 0.20, 0.20]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Inner channel on front bar */}
      <mesh position={[0, baseH + 0.10, d / 2 - 0.06]}>
        <boxGeometry args={[w - 0.50, 0.08, 0.06]} />
        <primitive object={innerFrameMat} attach="material" />
      </mesh>
      {/* Front bar top glow line */}
      <mesh position={[0, baseH + 0.21, d / 2 - 0.10]}>
        <boxGeometry args={[w - 0.18, 0.014, 0.20]} />
        <primitive object={edgeGlowMat} attach="material" />
      </mesh>

      {/* ── 6. Rear cooling block ── */}
      <mesh position={[0, baseH + wallH + 0.11, -d / 2 + 0.27]}>
        <boxGeometry args={[1.2, 0.22, 0.28]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* ── 7a. Front emissive strip ── */}
      <mesh position={[0, 0.07, d / 2 - 0.04]}>
        <boxGeometry args={[w * 0.48, 0.03, 0.03]} />
        <primitive object={glowMat} attach="material" />
      </mesh>

      {/* ── 7b. Left side strip ── */}
      <mesh position={[-w / 2 + 0.04, 0.07, 0]}>
        <boxGeometry args={[0.03, 0.03, d * 0.55]} />
        <primitive object={glowMat} attach="material" />
      </mesh>

      {/* ── 7c. Right side strip ── */}
      <mesh position={[w / 2 - 0.04, 0.07, 0]}>
        <boxGeometry args={[0.03, 0.03, d * 0.55]} />
        <primitive object={glowMat} attach="material" />
      </mesh>

      {/* ── 7d. Top trim emissive line (back) ── */}
      <mesh position={[0, baseH + wallH + 0.01, -d / 2 + 0.06]}>
        <boxGeometry args={[w - 0.3, 0.025, 0.025]} />
        <primitive object={glowMat} attach="material" />
      </mesh>

      {/* ── 8. Front label plaque ── */}
      <group position={[0, baseH + wallH * 0.55, d / 2 + 0.02]}>
        <RoundedBox args={[2.4, 0.66, 0.07]} radius={0.07} smoothness={3}>
          <meshStandardMaterial
            color="#111114"
            emissive={accentColor}
            emissiveIntensity={0.22}
            roughness={0.5}
          />
        </RoundedBox>

        {/* thin accent bar top of plaque */}
        <mesh position={[0, 0.3, 0.04]}>
          <boxGeometry args={[2.1, 0.025, 0.025]} />
          <primitive object={glowMat} attach="material" />
        </mesh>

        <Text
          position={[-0.9, 0.12, 0.05]}
          fontSize={0.13}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
          letterSpacing={0.05}
          font={undefined}
        >
          {title}
        </Text>
        <Text
          position={[-0.9, -0.07, 0.05]}
          fontSize={0.085}
          color="#9ca3af"
          anchorX="left"
          anchorY="middle"
        >
          {subtitle}
        </Text>
        <Text
          position={[0.9, 0.1, 0.05]}
          fontSize={0.24}
          color={accent}
          anchorX="right"
          anchorY="middle"
        >
          {itemCount}
        </Text>
        <Text
          position={[0.92, -0.13, 0.05]}
          fontSize={0.07}
          color="#6b7280"
          anchorX="right"
          anchorY="middle"
        >
          items
        </Text>
      </group>
    </group>
  );
}
