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
import { ProductVisual3D } from './ProductVisual3D';
import { CardDockPrefab } from './CardDockPrefab';
import { StorageRoom3D } from './StorageRoom3D';

export interface PrefabProps {
  entity: SceneEntity;
  selected: boolean;
  onSelect: (id: string) => void;
}

type PrefabComponent = (props: PrefabProps) => ReactElement | null;

// ── Prefab adapters ───────────────────────────────────────────────────────────

const StorageRoomPrefab: PrefabComponent = ({ entity }) =>
  <StorageRoom3D entity={entity} />;

// ProductVisual3D decides GLB vs fallback ProductCard3D.
const ProductVisualPrefab: PrefabComponent = ({ entity, selected, onSelect }) =>
  <ProductVisual3D entity={entity} selected={selected} onSelect={onSelect} />;

// ProductCard3D directly — pure R3F fallback, no GLB check.
const ProductCardFallbackPrefab: PrefabComponent = ({ entity, selected, onSelect }) =>
  <ProductCard3D entity={entity} selected={selected} onSelect={onSelect} />;

// CardDockPrefab — dock adapter (GLB + future hover/insert state).
const CardDockAdapter: PrefabComponent = ({ entity, selected, onSelect }) =>
  <CardDockPrefab entity={entity} selected={selected} onSelect={onSelect} />;

const NotImplemented: PrefabComponent = () => null;

// ── Stable prefab registry ────────────────────────────────────────────────────
/** Keep in sync with Rust `PrefabKey` enum. */
export const prefabRegistry: Record<PrefabKey, PrefabComponent> = {
  // storage rooms
  glassFridgeRoom: StorageRoomPrefab,
  dryStorageRoom:  StorageRoomPrefab,
  freezerRoom:     StorageRoomPrefab,
  riskRoom:        StorageRoomPrefab,
  // product cards — ProductVisual3D handles GLB vs R3F decision
  glassProductCard: ProductVisualPrefab,
  // hard-surface objects — always GLB from backend
  cardDock:  CardDockAdapter,
  glbModel:  CardDockAdapter, // generic GLB entity — reuses same adapter pattern
  // misc
  zoneLabel:   NotImplemented,
  riskMarker:  NotImplemented,
  placeholder: NotImplemented,
};

// ── Legacy kind-based fallback ────────────────────────────────────────────────
/** Used when an entity has no `prefab` field yet. */
const kindToPrefab: Record<GeometryKind, PrefabComponent> = {
  storageRoom:  StorageRoomPrefab,
  productCard:  ProductVisualPrefab,   // GLB or fallback
  zoneLabel:    NotImplemented,
  riskMarker:   NotImplemented,
  container:    ProductCardFallbackPrefab,
  tray:         ProductCardFallbackPrefab,
  bottle:       ProductCardFallbackPrefab,
  cardDock:     CardDockAdapter,
  glbModel:     CardDockAdapter,
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

