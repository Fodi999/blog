'use client';

/**
 * ProductVisual3D — decides how to render a product entity.
 *
 * Decision logic:
 *   entity.content.glbUrl = string  → Suspense(<GlbPrefab url={…} />, fallback=<ProductCard3D>)
 *   entity.content.glbUrl = null    → no GLB available → <ProductCard3D> (R3F fallback)
 *   entity.content.glbUrl = undefined → not yet resolved → <ProductCard3D> (loading state)
 *
 * ProductCard3D is never touched by this file except as import.
 * It stays a pure fallback renderer.
 *
 * Future: when the backend returns a real GLB URL from laboratory/generate,
 * the only change needed is setting entity.content.glbUrl in the scene builder.
 * This component needs no modification.
 */

import { Suspense } from 'react';

import type { PrefabProps } from './registry';
import { GlbPrefab } from './GlbPrefab';
import { ProductCard3D } from './ProductCard3D';

export function ProductVisual3D({ entity, selected, onSelect }: PrefabProps) {
  const glbUrl = entity.content?.glbUrl;
  const [px, py, pz] = entity.transform.position;
  const [rx, ry, rz] = entity.transform.rotation;
  const [sx, sy, sz] = entity.transform.scale;

  if (typeof glbUrl === 'string') {
    return (
      <Suspense
        fallback={
          <ProductCard3D entity={entity} selected={selected} onSelect={onSelect} />
        }
      >
        <GlbPrefab
          url={glbUrl}
          position={[px, py, pz]}
          rotation={[rx, ry, rz]}
          scale={[sx, sy, sz]}
        />
      </Suspense>
    );
  }

  // null or undefined — render procedural R3F card
  return <ProductCard3D entity={entity} selected={selected} onSelect={onSelect} />;
}
