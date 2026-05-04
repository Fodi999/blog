'use client';

/**
 * ProductCard3D — cartridge-in-slot style inventory card.
 *
 * Visual anatomy (bottom → top):
 *   0. Slot socket   — recessed floor marker, emissive ring
 *   1. Connector     — metal pins at bottom of cartridge
 *   2. Body          — thick physical cartridge standing upright
 *   3. Front face    — info display panel (image + text)
 *   4. Top cap       — metallic cap with status dot
 *   5. Glow ring     — outline emissive that pulses on risk
 *
 * Interaction:
 *   hover  → cartridge rises 0.30 out of slot, slight scale
 *   select → rises 0.60, scale 1.12, glow max
 *
 * Perf: texture cache, risk pulse throttled to 500ms.
 */

import { RoundedBox, Text } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { memo, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { resolveAsset } from '../assets/assetRegistry';
import type { SceneEntity } from '../sceneTypes';
import { themeColor } from '../theme';

interface Props {
  entity: SceneEntity;
  selected: boolean;
  onSelect: (id: string) => void;
}

const TRUSTED_HOSTS = ['pub-aca11a32217e46129dd78b17f017d0a1.r2.dev'];

function resolveGpuImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const { hostname, origin } = new URL(raw);
    if (typeof window !== 'undefined' && origin === window.location.origin) return raw;
    if (TRUSTED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
      return `/api/img?url=${encodeURIComponent(raw)}`;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Global texture cache ─────────────────────────────────────────────────────
const _texCache = new Map<string, THREE.Texture>();
const _loader = new THREE.TextureLoader();

function loadCachedTexture(url: string, onLoad: (t: THREE.Texture) => void): () => void {
  if (_texCache.has(url)) { onLoad(_texCache.get(url)!); return () => {}; }
  let cancelled = false;
  _loader.load(url, (t) => { if (!cancelled) { _texCache.set(url, t); onLoad(t); } }, undefined, () => {});
  return () => { cancelled = true; };
}

// Card dimensions
const CW = 1.20;  // card width  — чуть шире для читаемости
const CH = 1.65;  // card height — выше для большего поля
const CD = 0.20;  // card depth

// ── Docking podium under each card ───────────────────────────────────────────
function CardDock({ color, active, hovered }: { color: string; active: boolean; hovered: boolean }) {
  const c = new THREE.Color(color);

  // Podium dimensions — slightly wider/deeper than the card
  const DW = CW + 0.10;   // dock width
  const DD = CD + 0.44;   // dock depth (front-to-back, deeper than card for stability)
  const DH = 0.10;        // base podium height

  // Glow intensities
  const glowInt  = active ? 2.0  : hovered ? 1.1  : 0.40;
  const glowOp   = active ? 0.90 : hovered ? 0.60 : 0.28;
  const railInt  = active ? 1.6  : hovered ? 0.85 : 0.30;
  const pinInt   = active ? 2.2  : hovered ? 1.2  : 0.50;
  const floorOp  = active ? 0.55 : hovered ? 0.32 : 0.14;

  // Rear stop dimensions
  const RS_H = 0.18;  // rear stop height (sticks up behind card bottom)
  const RS_T = 0.045; // rear stop thickness

  // Guide rail dimensions
  const GR_H = 0.14;  // rail height above platform top
  const GR_T = 0.032; // rail thickness
  const GR_W = DD * 0.78; // rail length (front-back)

  const platformY = DH; // top surface of podium

  return (
    <group position={[0, 0, 0]}>

      {/* ── 1. Base podium — dark anodised metal body ── */}
      <RoundedBox
        args={[DW, DH, DD]}
        radius={0.04}
        smoothness={3}
        position={[0, DH / 2, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#0c1018" roughness={0.45} metalness={0.80} />
      </RoundedBox>

      {/* Podium side chamfer glow lines (left / right) */}
      <mesh position={[-DW / 2 + 0.006, DH / 2, 0]}>
        <boxGeometry args={[0.010, DH * 0.70, DD * 0.85]} />
        <meshStandardMaterial color={color} emissive={c} emissiveIntensity={railInt * 0.5} transparent opacity={0.55} />
      </mesh>
      <mesh position={[DW / 2 - 0.006, DH / 2, 0]}>
        <boxGeometry args={[0.010, DH * 0.70, DD * 0.85]} />
        <meshStandardMaterial color={color} emissive={c} emissiveIntensity={railInt * 0.5} transparent opacity={0.55} />
      </mesh>

      {/* ── 2. Top platform — thin bright cap ── */}
      <mesh position={[0, platformY + 0.005, 0]}>
        <boxGeometry args={[DW, 0.010, DD]} />
        <meshStandardMaterial color="#161d2c" roughness={0.30} metalness={0.90} />
      </mesh>

      {/* Top platform inner glow panel */}
      <mesh position={[0, platformY + 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DW - 0.10, DD - 0.10]} />
        <meshStandardMaterial
          color="#030508"
          emissive={c}
          emissiveIntensity={glowInt * 0.35}
          transparent opacity={glowOp * 0.55}
          roughness={0.9}
          depthWrite={false}
        />
      </mesh>

      {/* ── 3. Rear stop — backstop that card bottom leans against ── */}
      <mesh position={[0, platformY + RS_H / 2, -DD / 2 + RS_T / 2]}>
        <boxGeometry args={[DW - 0.06, RS_H, RS_T]} />
        <meshStandardMaterial color="#101520" roughness={0.40} metalness={0.75} />
      </mesh>
      {/* Rear stop inner glow face */}
      <mesh position={[0, platformY + RS_H / 2, -DD / 2 + RS_T + 0.001]}>
        <boxGeometry args={[DW - 0.12, RS_H - 0.04, 0.006]} />
        <meshStandardMaterial color={color} emissive={c} emissiveIntensity={glowInt * 0.60} transparent opacity={glowOp * 0.50} depthWrite={false} />
      </mesh>
      {/* Rear stop top edge glow */}
      <mesh position={[0, platformY + RS_H + 0.003, -DD / 2 + RS_T / 2]}>
        <boxGeometry args={[DW - 0.04, 0.008, RS_T + 0.004]} />
        <meshBasicMaterial color={c} transparent opacity={glowOp * 0.80} />
      </mesh>

      {/* ── 4. Left & right guide rails ── */}
      {([-1, 1] as (-1|1)[]).map((side) => (
        <group key={side} position={[side * (DW / 2 - GR_T / 2 - 0.005), platformY + GR_H / 2, (DD * 0.10)]}>
          {/* Rail body */}
          <mesh>
            <boxGeometry args={[GR_T, GR_H, GR_W]} />
            <meshStandardMaterial color="#0e1421" roughness={0.38} metalness={0.82} />
          </mesh>
          {/* Rail inner groove — recessed channel facing inward */}
          <mesh position={[side * (-GR_T / 2 + 0.008), 0, 0]}>
            <boxGeometry args={[0.010, GR_H * 0.60, GR_W - 0.06]} />
            <meshStandardMaterial color="#020306" roughness={0.9} metalness={0.3} />
          </mesh>
          {/* Rail top cap glow */}
          <mesh position={[0, GR_H / 2 + 0.004, 0]}>
            <boxGeometry args={[GR_T + 0.004, 0.008, GR_W + 0.010]} />
            <meshBasicMaterial color={c} transparent opacity={railInt * 0.55} />
          </mesh>
          {/* Rail inward face emissive strip */}
          <mesh position={[side * (-GR_T / 2 - 0.001), 0, 0]}>
            <boxGeometry args={[0.006, GR_H * 0.50, GR_W * 0.70]} />
            <meshStandardMaterial color={color} emissive={c} emissiveIntensity={railInt} transparent opacity={0.55} depthWrite={false} />
          </mesh>
        </group>
      ))}

      {/* ── 5. Front indicator strip ── */}
      <mesh position={[0, platformY + 0.014, DD / 2 - 0.018]}>
        <boxGeometry args={[DW * 0.50, 0.009, 0.014]} />
        <meshStandardMaterial
          color={color}
          emissive={c}
          emissiveIntensity={active ? 2.8 : hovered ? 1.6 : 0.7}
          transparent opacity={0.92}
        />
      </mesh>
      {/* Front full-width base line */}
      <mesh position={[0, platformY + 0.008, DD / 2 - 0.006]}>
        <boxGeometry args={[DW, 0.006, 0.010]} />
        <meshBasicMaterial color={c} transparent opacity={glowOp * 0.70} />
      </mesh>

      {/* ── 6. Contact pins — 5 pins along rear-centre ── */}
      {([-0.36, -0.18, 0, 0.18, 0.36] as number[]).map((x, i) => (
        <group key={i} position={[x, platformY + 0.012, -DD / 2 + DD * 0.25]}>
          {/* Pin shaft */}
          <mesh>
            <cylinderGeometry args={[0.013, 0.013, 0.024, 6]} />
            <meshStandardMaterial color={color} emissive={c} emissiveIntensity={pinInt} metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Pin glow halo */}
          <mesh position={[0, 0.013, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.028, 8]} />
            <meshBasicMaterial color={c} transparent opacity={pinInt * 0.22} depthWrite={false} />
          </mesh>
        </group>
      ))}

      {/* ── 7. Floor glow plane beneath the dock ── */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DW + 0.30, DD + 0.30]} />
        <meshBasicMaterial color={c} transparent opacity={floorOp} depthWrite={false} />
      </mesh>
      {/* Outer soft halo */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DW + 0.70, DD + 0.70]} />
        <meshBasicMaterial color={c} transparent opacity={floorOp * 0.35} depthWrite={false} />
      </mesh>

    </group>
  );
}

// ── Image / emoji face ───────────────────────────────────────────────────────
function CartridgeFace({ imageUrl, fallbackIcon }: { imageUrl?: string | null; fallbackIcon: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(() => {
    const r = resolveGpuImageUrl(imageUrl);
    return r ? (_texCache.get(r) ?? null) : null;
  });
  useEffect(() => {
    const r = resolveGpuImageUrl(imageUrl);
    if (!r) { setTexture(null); return; }
    if (_texCache.has(r)) { setTexture(_texCache.get(r)!); return; }
    return loadCachedTexture(r, setTexture);
  }, [imageUrl]);

  if (texture) {
    return (
      <group position={[0, 0.24, CD / 2 + 0.001]}>
        {/* subtle background plate for the image */}
        <mesh position={[0, 0, -0.002]}>
          <planeGeometry args={[0.76, 0.76]} />
          <meshStandardMaterial color="#0a0d18" roughness={0.6} />
        </mesh>
        <mesh>
          <planeGeometry args={[0.70, 0.70]} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>
        {/* thin border around image */}
        {[[-0.35,0,'h'],[0.35,0,'h'],[0,-0.35,'v'],[0,0.35,'v']].map(([x,y,dir],i) => (
          <mesh key={i} position={[x as number, y as number, -0.001]}>
            <planeGeometry args={dir === 'h' ? [0.012, 0.70] : [0.70, 0.012]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
          </mesh>
        ))}
      </group>
    );
  }
  return (
    <Text position={[0, 0.24, CD / 2 + 0.002]} fontSize={0.42} color="#ffffff" anchorX="center" anchorY="middle">
      {fallbackIcon}
    </Text>
  );
}

// ── Main cartridge component ─────────────────────────────────────────────────
export const ProductCard3D = memo(function ProductCard3D({ entity, selected, onSelect }: Props) {
  // ── Procedural R3F fallback ────────────────────────────────────────────────
  // ProductCard3D is a pure fallback renderer. It does NOT decide whether to
  // show a GLB. That decision is made by ProductVisual3D (the wrapper).
  // This component only renders the R3F procedural card shape.
  const [hovered, setHovered] = useState(false);
  const cartRef  = useRef<THREE.Group>(null);
  const glowRef  = useRef<THREE.MeshStandardMaterial>(null);
  const { invalidate } = useThree();

  const color       = themeColor(entity.material.theme, entity.material.color);
  const accentColor = new THREE.Color(color);
  const baseEmissive = entity.material.emissive;
  const isRisk = entity.material.theme === 'expired' || entity.material.theme === 'critical';

  const liftRef        = useRef(0);
  const scaleRef       = useRef(1);
  const glowIntRef     = useRef(baseEmissive);
  const lastPulseRef   = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (isRisk && !selected && !hovered) {
      if (t - lastPulseRef.current > 0.5) {
        lastPulseRef.current = t;
        if (glowRef.current) glowRef.current.emissiveIntensity = baseEmissive + Math.sin(t * 2.6) * 0.2;
        invalidate();
      }
      return;
    }

    const needsAnim = selected || hovered;
    if (!needsAnim) return;
    invalidate();

    const targetLift  = selected ? 0.60 : hovered ? 0.30 : 0;
    const targetScale = selected ? 1.10 : hovered ? 1.05 : 1.0;
    const targetGlow  = selected ? 1.0  : hovered ? 0.65 : baseEmissive;
    const lerp = 0.1;

    liftRef.current      += (targetLift  - liftRef.current)      * lerp;
    scaleRef.current     += (targetScale - scaleRef.current)      * lerp;
    glowIntRef.current   += (targetGlow  - glowIntRef.current)    * lerp;

    if (cartRef.current) {
      cartRef.current.position.y = liftRef.current;
      cartRef.current.scale.setScalar(scaleRef.current);
    }
    if (glowRef.current) glowRef.current.emissiveIntensity = glowIntRef.current;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!entity.gameplay?.selectable) return;
    e.stopPropagation();
    onSelect(entity.id);
    invalidate();
  };

  const asset        = resolveAsset(entity.content?.assetKey);
  const fallbackIcon = entity.content?.fallbackIcon ?? asset.fallbackIcon;

  // Truncate helpers — prevent text overflow out of card bounds
  // Card usable width ~1.06 units; rough chars-per-line by fontSize:
  //   title    0.128 → ~13 ch/line, max 2 lines → 26 total but wrap causes Y overflow → limit 1 line
  //   subtitle 0.090 → ~18 ch/line, 1 line
  //   category 0.052 → ~20 ch/line, 1 line
  const trunc = (s: string, max: number) =>
    s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s;

  const rawTitle    = entity.content?.title    ?? '';
  const rawSubtitle = entity.content?.subtitle ?? '';
  const rawCategory = entity.content?.badges?.[0] ?? '';

  const title    = trunc(rawTitle,    16);
  const subtitle = trunc(rawSubtitle, 22);
  const category = trunc(rawCategory, 18);

  return (
    <group
      position={entity.transform.position}
      rotation={entity.transform.rotation}
      onClick={handleClick}
      onPointerEnter={(e) => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = 'pointer'; invalidate(); }}
      onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto';    invalidate(); }}
    >
      {/* ── 0. Slot socket (stays on floor) ── */}
      <CardDock color={color} active={selected} hovered={hovered} />

      {/* ── cartridge (rises on hover/select) — sits on top of dock platform (DH=0.10) ── */}
      <group ref={cartRef} position={[0, 0.10, 0]}>

        {/* ── 1. Connector block — sits inside the slot recess ── */}
        <mesh position={[0, -0.01, 0]} castShadow>
          <boxGeometry args={[CW - 0.08, 0.10, CD - 0.04]} />
          <meshStandardMaterial color="#1a1f2e" roughness={0.35} metalness={0.75} />
        </mesh>
        {/* connector pin lines */}
        {[-0.32, -0.16, 0, 0.16, 0.32].map((x) => (
          <mesh key={x} position={[x, -0.01, CD / 2 + 0.001]}>
            <boxGeometry args={[0.04, 0.07, 0.004]} />
            <meshStandardMaterial color={color} emissive={accentColor} emissiveIntensity={0.6} metalness={0.9} roughness={0.1} />
          </mesh>
        ))}

        {/* ── 2. Main cartridge body ── */}
        <RoundedBox args={[CW, CH, CD]} radius={0.06} smoothness={2} position={[0, 0.06 + CH / 2, 0]} castShadow receiveShadow>
          <meshStandardMaterial
            color={hovered || selected ? '#141622' : '#0c0e18'}
            roughness={0.45}
            metalness={0.20}
          />
        </RoundedBox>

        {/* ── Glow outline (behind body) ── */}
        <RoundedBox args={[CW + 0.04, CH + 0.04, CD - 0.04]} radius={0.07} smoothness={2} position={[0, 0.06 + CH / 2, -0.01]}>
          <meshStandardMaterial
            ref={glowRef}
            color="#000000"
            emissive={accentColor}
            emissiveIntensity={baseEmissive}
            roughness={0.4}
          />
        </RoundedBox>

        {/* ── 3. Front face panel ── */}
        <group position={[0, 0.06 + CH / 2, CD / 2 + 0.001]}>

          {/* dark panel background */}
          <mesh position={[0, 0, -0.002]}>
            <planeGeometry args={[CW - 0.04, CH - 0.04]} />
            <meshStandardMaterial color="#070a14" roughness={0.7} metalness={0.1} />
          </mesh>

          {/* image / emoji — центр, верхняя половина */}
          <CartridgeFace imageUrl={entity.content?.imageUrl} fallbackIcon={fallbackIcon} />

          {/* thin separator under image */}
          <mesh position={[0, -0.14, 0.001]}>
            <planeGeometry args={[CW - 0.20, 0.008]} />
            <meshBasicMaterial color={color} transparent opacity={0.35} />
          </mesh>

          {/* category badge — мелкий, трекинг */}
          {category && (
            <Text
              position={[-(CW / 2 - 0.08), -0.22, 0.001]}
              fontSize={0.052}
              color={color}
              anchorX="left"
              anchorY="middle"
              letterSpacing={0.10}
              maxWidth={CW - 0.14}
            >
              {category.toUpperCase()}
            </Text>
          )}

          {/* title — крупный, жирный */}
          <Text
            position={[-(CW / 2 - 0.08), -0.36, 0.001]}
            fontSize={0.128}
            color="#f0f4ff"
            anchorX="left"
            anchorY="top"
            maxWidth={CW - 0.14}
            textAlign="left"
            lineHeight={1.15}
            overflowWrap="break-word"
          >
            {title}
          </Text>

          {/* subtitle — qty + unit */}
          <Text
            position={[-(CW / 2 - 0.08), -0.62, 0.001]}
            fontSize={0.086}
            color="#94a3b8"
            anchorX="left"
            anchorY="middle"
            maxWidth={CW - 0.14}
            overflowWrap="break-word"
          >
            {subtitle}
          </Text>

          {/* status badge — цветная плашка внизу */}
          <group position={[0, -0.70, 0.001]}>
            <mesh>
              <planeGeometry args={[CW - 0.20, 0.148]} />
              <meshStandardMaterial
                color={color}
                emissive={accentColor}
                emissiveIntensity={0.18}
                transparent opacity={0.18}
                roughness={0.5}
              />
            </mesh>
            <Text
              position={[0, 0, 0.002]}
              fontSize={0.068}
              color={color}
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.08}
            >
              {entity.material.theme.toUpperCase()}
            </Text>
          </group>

          {/* status dot top-right */}
          <mesh position={[CW / 2 - 0.10, CH / 2 - 0.10, 0]}>
            <circleGeometry args={[0.042, 12]} />
            <meshBasicMaterial color={color} />
          </mesh>

          {/* top-right dot glow ring */}
          <mesh position={[CW / 2 - 0.10, CH / 2 - 0.10, -0.001]}>
            <circleGeometry args={[0.066, 12]} />
            <meshBasicMaterial color={color} transparent opacity={0.22} />
          </mesh>
        </group>

        {/* ── 3b. Side glow strips on body edges ── */}
        {/* Left edge */}
        <mesh position={[-CW / 2 - 0.002, 0.06 + CH / 2, 0]}>
          <boxGeometry args={[0.012, CH * 0.75, CD * 0.6]} />
          <meshStandardMaterial color={color} emissive={accentColor} emissiveIntensity={baseEmissive * 0.6} transparent opacity={0.7} />
        </mesh>
        {/* Right edge */}
        <mesh position={[CW / 2 + 0.002, 0.06 + CH / 2, 0]}>
          <boxGeometry args={[0.012, CH * 0.75, CD * 0.6]} />
          <meshStandardMaterial color={color} emissive={accentColor} emissiveIntensity={baseEmissive * 0.6} transparent opacity={0.7} />
        </mesh>

        {/* ── 4. Top cap ── */}
        <RoundedBox args={[CW, 0.10, CD]} radius={0.04} smoothness={2} position={[0, 0.06 + CH + 0.05, 0]} castShadow>
          <meshStandardMaterial color="#1c2030" roughness={0.3} metalness={0.6} />
        </RoundedBox>
        {/* top emissive strip */}
        <mesh position={[0, 0.06 + CH + 0.105, 0]}>
          <boxGeometry args={[CW * 0.55, 0.012, 0.018]} />
          <meshStandardMaterial color={color} emissive={accentColor} emissiveIntensity={1.2} />
        </mesh>

      </group>
    </group>
  );
});
