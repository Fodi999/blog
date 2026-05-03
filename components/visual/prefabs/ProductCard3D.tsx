'use client';

/**
 * ProductCard3D — game-like prefab for an inventory product.
 *
 * Pure rendering: receives a `SceneEntity`, never reads domain data.
 * Click → emits `onSelect(entity.id)`. Hover/select visuals are local.
 *
 * Perf notes:
 *  - Global texture cache: same URL → same THREE.Texture instance (no re-upload)
 *  - isRisk pulse throttled to 500ms to avoid `invalidate()` every frame
 *  - RoundedBox smoothness reduced to 1 (still looks fine, ~50% fewer verts)
 *  - React.memo on export to skip re-renders when entity ref is stable
 */

import { Billboard, RoundedBox, Text } from '@react-three/drei';
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

// ── Global texture cache — same URL reuses the same GPU texture ──────────────
const _texCache = new Map<string, THREE.Texture>();
const _loader = new THREE.TextureLoader();

function loadCachedTexture(
  url: string,
  onLoad: (t: THREE.Texture) => void,
): () => void {
  if (_texCache.has(url)) {
    onLoad(_texCache.get(url)!);
    return () => {};
  }
  let cancelled = false;
  _loader.load(
    url,
    (t) => {
      if (cancelled) return;
      _texCache.set(url, t);
      onLoad(t);
    },
    undefined,
    () => {},
  );
  return () => { cancelled = true; };
}

function ProductMedia({
  imageUrl,
  fallbackIcon,
}: {
  imageUrl?: string | null;
  fallbackIcon: string;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(() => {
    const resolved = resolveGpuImageUrl(imageUrl);
    return resolved ? (_texCache.get(resolved) ?? null) : null;
  });

  useEffect(() => {
    const resolved = resolveGpuImageUrl(imageUrl);
    if (!resolved) { setTexture(null); return; }
    if (_texCache.has(resolved)) { setTexture(_texCache.get(resolved)!); return; }
    return loadCachedTexture(resolved, setTexture);
  }, [imageUrl]);

  if (texture) {
    return (
      <mesh position={[-0.57, 0.08, 0.032]}>
        <planeGeometry args={[0.48, 0.48]} />
        <meshBasicMaterial map={texture} transparent />
      </mesh>
    );
  }
  return (
    <Text
      position={[-0.57, 0.08, 0.032]}
      fontSize={0.28}
      color="#ffffff"
      anchorX="center"
      anchorY="middle"
    >
      {fallbackIcon}
    </Text>
  );
}

export const ProductCard3D = memo(function ProductCard3D({ entity, selected, onSelect }: Props) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.MeshStandardMaterial>(null);
  const { invalidate } = useThree();

  const color = themeColor(entity.material.theme, entity.material.color);
  const baseEmissive = entity.material.emissive;
  const isRisk =
    entity.material.theme === 'expired' || entity.material.theme === 'critical';

  // Animation refs
  const liftRef = useRef(0);
  const scaleRef = useRef(1);
  const glowIntRef = useRef(baseEmissive);
  // Throttle: only update glow every ~500ms for risk pulse (avoids every-frame invalidate)
  const lastPulseRef = useRef(0);

  useFrame(({ clock }) => {
    const needsAnimation = selected || hovered;
    const t = clock.getElapsedTime();

    // Risk pulse: only run at ~2fps to spare the GPU when not interacting
    if (isRisk && !selected && !hovered) {
      if (t - lastPulseRef.current > 0.5) {
        lastPulseRef.current = t;
        const targetGlow = baseEmissive + Math.sin(t * 2.6) * 0.15;
        if (glowRef.current) {
          glowRef.current.emissiveIntensity = targetGlow;
        }
        invalidate();
      }
      return;
    }

    if (!needsAnimation) return;
    invalidate();

    const targetLift = selected ? 0.55 : hovered ? 0.3 : 0;
    const targetScale = selected ? 1.12 : hovered ? 1.06 : 1.0;
    const targetGlow = selected ? 0.9 : hovered ? 0.6 : baseEmissive;

    const lerp = 0.1;
    liftRef.current += (targetLift - liftRef.current) * lerp;
    scaleRef.current += (targetScale - scaleRef.current) * lerp;
    glowIntRef.current += (targetGlow - glowIntRef.current) * lerp;

    if (groupRef.current) {
      groupRef.current.position.y = liftRef.current;
      groupRef.current.scale.setScalar(scaleRef.current);
    }
    if (glowRef.current) {
      glowRef.current.emissiveIntensity = glowIntRef.current;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!entity.gameplay?.selectable) return;
    e.stopPropagation();
    onSelect(entity.id);
    invalidate();
  };


  const asset = resolveAsset(entity.content?.assetKey);
  const fallbackIcon = entity.content?.fallbackIcon ?? asset.fallbackIcon;
  const title = entity.content?.title ?? '';
  const subtitle = entity.content?.subtitle ?? '';
  const category = entity.content?.badges?.[0] ?? '';

  return (
    <group
      position={entity.transform.position}
      rotation={entity.transform.rotation}
      onClick={handleClick}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
        invalidate();
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'auto';
        invalidate();
      }}
    >
      <group ref={groupRef}>
        {/* Pedestal */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.7, 0.16, 0.7]} />
          <meshStandardMaterial
            color="#141416"
            emissive={new THREE.Color(color)}
            emissiveIntensity={0.18}
            roughness={0.5}
            metalness={0.25}
          />
        </mesh>

        <Billboard position={[0, 0.78, 0]} follow lockX={false} lockY={false} lockZ={false}>
          {/* Glow ring */}
          <RoundedBox args={[1.92, 0.88, 0.04]} radius={0.06} smoothness={1} position={[0, 0, -0.005]}>
            <meshStandardMaterial
              ref={glowRef}
              color="#000000"
              emissive={new THREE.Color(color)}
              emissiveIntensity={baseEmissive}
              roughness={0.4}
            />
          </RoundedBox>

          {/* Card body */}
          <RoundedBox args={[1.82, 0.82, 0.052]} radius={0.055} smoothness={1}>
            <meshStandardMaterial
              color={hovered ? '#14141a' : '#0e0e10'}
              roughness={0.55}
              metalness={0.1}
            />
          </RoundedBox>

          {/* Status dot */}
          <mesh position={[0.82, 0.33, 0.033]}>
            <circleGeometry args={[0.038, 12]} />
            <meshBasicMaterial color={color} />
          </mesh>

          {/* Photo / emoji */}
          <ProductMedia imageUrl={entity.content?.imageUrl} fallbackIcon={fallbackIcon} />

          {/* Divider */}
          <mesh position={[-0.27, 0.04, 0.029]}>
            <planeGeometry args={[0.007, 0.6]} />
            <meshBasicMaterial color={color} transparent opacity={0.18} />
          </mesh>

          {/* Category */}
          {category && (
            <Text
              position={[-0.18, 0.29, 0.033]}
              fontSize={0.052}
              color="#9ca3af"
              anchorX="left"
              anchorY="middle"
              maxWidth={0.98}
              letterSpacing={0.05}
            >
              {category.toUpperCase()}
            </Text>
          )}

          {/* Title */}
          <Text
            position={[-0.18, 0.12, 0.033]}
            fontSize={0.115}
            color="#ffffff"
            anchorX="left"
            anchorY="middle"
            maxWidth={0.96}
            textAlign="left"
          >
            {title}
          </Text>

          {/* Subtitle */}
          <Text
            position={[-0.18, -0.06, 0.033]}
            fontSize={0.088}
            color="#d4d4d8"
            anchorX="left"
            anchorY="middle"
            maxWidth={0.96}
          >
            {subtitle}
          </Text>

          {/* Bottom line */}
          <mesh position={[0, -0.3, 0.027]}>
            <planeGeometry args={[1.65, 0.018]} />
            <meshBasicMaterial color={color} transparent opacity={0.55} />
          </mesh>

          {/* Status badge */}
          <Text
            position={[-0.82, -0.3, 0.033]}
            fontSize={0.062}
            color={color}
            anchorX="left"
            anchorY="middle"
            letterSpacing={0.08}
          >
            {`[ ${entity.material.theme.toUpperCase()} ]`}
          </Text>
        </Billboard>
      </group>
    </group>
  );
});
