'use client';
/**
 * studio/objects/StudioObjectRenderer.tsx
 *
 * Renders ALL objects in the scene store.
 * Dispatches each SceneObject to either:
 *   - GlbObject   — when the backend has a GLB for this shape kind
 *   - PrimitiveObject — instant Three.js fallback
 *
 * Selection / hover state is read from the store and passed down.
 * Click → selectObject(id) → store. No direct backend calls here.
 */

import { Suspense, useState } from 'react';
import type { SceneObject } from '../core/types';
import { GlbObject } from './GlbObject';
import { PrimitiveObject } from './PrimitiveObject';

// Shapes that have a Rust generator on the backend
const GLB_SHAPES = new Set([
  'cube', 'sphere', 'cylinder', 'cone', 'torus',
  'square', 'rectangle', 'circle', 'triangle',
]);

export interface StudioObjectRendererProps {
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function ObjectSwitch({
  obj,
  selected,
  onSelect,
}: {
  obj: SceneObject;
  selected: boolean;
  onSelect: (id: string | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const shared = {
    obj,
    selected,
    hovered,
    onClick: () => onSelect(selected ? null : obj.id),
    onPointerOver: () => setHovered(true),
    onPointerOut: () => setHovered(false),
  };

  if (GLB_SHAPES.has(obj.kind)) {
    return (
      // Suspense: show PrimitiveObject while GLB loads from backend
      <Suspense fallback={<PrimitiveObject {...shared} />}>
        <GlbObject {...shared} />
      </Suspense>
    );
  }

  return <PrimitiveObject {...shared} />;
}

export function StudioObjectRenderer({
  objects,
  selectedId,
  onSelect,
}: StudioObjectRendererProps) {
  return (
    <>
      {objects
        .filter((o) => o.visible)
        .map((obj) => (
          <ObjectSwitch
            key={obj.id}
            obj={obj}
            selected={obj.id === selectedId}
            onSelect={onSelect}
          />
        ))}
    </>
  );
}
