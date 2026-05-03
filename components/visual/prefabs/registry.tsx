'use client';

/**
 * Prefab registry — single source of truth for `entity.prefab` →
 * React component mapping. Backend declares a stable `PrefabKey`; the
 * renderer dispatches here.
 *
 * Migration:
 *   1. New entities arrive with `entity.prefab` (PrefabKey). We dispatch on it.
 *   2. Old / fallback entities only have `geometry.kind` — we map kind → prefab.
 *   3. Unknown prefabs render nothing (silent skip; safe forwards-compat).
 */

import type { ReactElement } from 'react';
import type { GeometryKind, PrefabKey, SceneEntity } from '../sceneTypes';

import { ProductCard3D } from './ProductCard3D';
import { StorageRoom3D } from './StorageRoom3D';

export interface PrefabProps {
  entity: SceneEntity;
  selected: boolean;
  onSelect: (id: string) => void;
}

type PrefabComponent = (props: PrefabProps) => ReactElement | null;

// Wrappers normalise prop signatures (some prefabs ignore selected/onSelect).
const StorageRoomPrefab: PrefabComponent = ({ entity }) => <StorageRoom3D entity={entity} />;

const ProductCardPrefab: PrefabComponent = ({ entity, selected, onSelect }) => (
  <ProductCard3D entity={entity} selected={selected} onSelect={onSelect} />
);

const NotImplemented: PrefabComponent = () => null;

/** Stable prefab keys → components. Keep in sync with Rust `PrefabKey`. */
export const prefabRegistry: Record<PrefabKey, PrefabComponent> = {
  // storage rooms — same component, different theme via material.theme
  glassFridgeRoom: StorageRoomPrefab,
  dryStorageRoom: StorageRoomPrefab,
  freezerRoom: StorageRoomPrefab,
  riskRoom: StorageRoomPrefab,
  // cards
  glassProductCard: ProductCardPrefab,
  // misc
  zoneLabel: NotImplemented, // baked into StorageRoom3D for now
  riskMarker: NotImplemented,
  placeholder: NotImplemented,
};

/** Legacy fallback — used when an entity has no `prefab` field yet. */
const kindToPrefab: Record<GeometryKind, PrefabComponent> = {
  storageRoom: StorageRoomPrefab,
  productCard: ProductCardPrefab,
  zoneLabel: NotImplemented,
  riskMarker: NotImplemented,
  container: ProductCardPrefab,
  tray: ProductCardPrefab,
  bottle: ProductCardPrefab,
};

/** Resolve an entity to its renderer component. Prefers `prefab`, falls
 *  back to `geometry.kind`. */
export function resolveEntityPrefab(entity: SceneEntity): PrefabComponent {
  if (entity.prefab && prefabRegistry[entity.prefab]) {
    return prefabRegistry[entity.prefab];
  }
  return kindToPrefab[entity.geometry.kind] ?? NotImplemented;
}

/** @deprecated use `resolveEntityPrefab(entity)` instead. */
export function resolvePrefab(kind: GeometryKind): PrefabComponent {
  return kindToPrefab[kind] ?? NotImplemented;
}

