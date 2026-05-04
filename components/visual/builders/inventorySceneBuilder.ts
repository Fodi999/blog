/**
 * inventorySceneBuilder — TEMPORARY frontend implementation of the
 * backend SceneState builder. Will be removed when
 * `GET /api/scenes/inventory` lands on Koyeb.
 *
 * Logic that lives here today and MUST move to Rust:
 *   • severity → theme mapping
 *   • storage zone derivation
 *   • product layout (positions per zone)
 *   • KPI aggregations / HUD strings
 *   • glbUrl resolution (currently always null — backend sets it after
 *     POST /laboratory/generate completes and stores model_url in DB)
 *
 * Frontend contract:
 *   entity.content.glbUrl = string  → render useGLTF(glbUrl)
 *   entity.content.glbUrl = null    → no GLB, render R3F fallback
 *   entity.content.glbUrl = undefined → not yet resolved (loading)
 *
 * Keep this file pure — no React, no Three.js, no SSR globals.
 */

import type { InventoryItem } from '@/lib/chefos-types';
import { inferAssetKey } from '../assets/assetRegistry';
import type {
  EntityAction,
  MaterialTheme,
  SceneEntity,
  SceneState,
  Vec3Tuple,
} from '../sceneTypes';

// ── Domain → theme ───────────────────────────────────────────────────────────

function severityToTheme(s: InventoryItem['severity']): MaterialTheme {
  switch (s) {
    case 'expired':
      return 'expired';
    case 'critical':
      return 'critical';
    case 'warning':
      return 'warning';
    case 'ok':
    case 'noexpiration':
    default:
      return 'ok';
  }
}

type ZoneKey = 'cold' | 'dry' | 'freezer' | 'risk';

function inferZone(item: InventoryItem, theme: MaterialTheme): ZoneKey {
  if (theme === 'expired' || theme === 'critical') return 'risk';
  const c = item.product.category.toLowerCase();
  if (/(frozen|мороз|ice)/.test(c)) return 'freezer';
  if (/(meat|fish|dairy|cheese|мяс|рыб|молоч|сыр|яйц|egg)/.test(c)) return 'cold';
  return 'dry';
}

const ZONE_META: Record<
  ZoneKey,
  { label: string; subtitle: string; theme: MaterialTheme; pos: Vec3Tuple }
> = {
  cold: { label: 'Cold Storage', subtitle: '0–4°C', theme: 'cold', pos: [-4.6, 0, 2.4] },
  dry: { label: 'Dry Storage', subtitle: '15–20°C', theme: 'dry', pos: [4.6, 0, 2.4] },
  freezer: { label: 'Freezer', subtitle: '-18°C', theme: 'freezer', pos: [-4.6, 0, -2.8] },
  risk: { label: 'Risk Zone', subtitle: 'Attention required', theme: 'risk', pos: [4.6, 0, -2.8] },
};

const ZONE_ORDER: ZoneKey[] = ['cold', 'dry', 'freezer', 'risk'];

// ── Layout ───────────────────────────────────────────────────────────────────

function productPositionInZone(zone: ZoneKey, indexInZone: number): Vec3_tuple {
  const COLS = 4;
  const STEP_X = 1.35;
  const STEP_Z = 1.0;
  const base = ZONE_META[zone].pos;
  const col = indexInZone % COLS;
  const row = Math.floor(indexInZone / COLS);
  return [
    base[0] + (col - (COLS - 1) / 2) * STEP_X,
    base[1],
    base[2] + (row - 1) * STEP_Z,
  ];
}

// glam-style alias for clarity
type Vec3_tuple = Vec3Tuple;

// ── Allowed actions per severity ─────────────────────────────────────────────

function actionsForTheme(theme: MaterialTheme): EntityAction[] {
  if (theme === 'expired' || theme === 'critical') {
    return ['writeOff', 'openDetails'];
  }
  if (theme === 'warning') {
    return ['useToday', 'writeOff', 'openDetails'];
  }
  return ['useToday', 'openDetails', 'writeOff'];
}

function emissiveForTheme(theme: MaterialTheme): number {
  return { ok: 0.08, warning: 0.16, critical: 0.22, expired: 0.28 }[theme as 'ok' | 'warning' | 'critical' | 'expired']
    ?? 0.1;
}

// ── Dev GLB override ─────────────────────────────────────────────────────────
// When running locally against the Rust backend on :8000, inject sci_fi_card.glb
// so every product card renders as the Plasticity-style hard-surface card.
// In production this is null and the backend supplies the real model_url.
const DEV_GLB_URL: string | null =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api/laboratory/debug-glb/sci_fi_card'
    : null;

// ── Public API ───────────────────────────────────────────────────────────────

export function buildInventoryScene(
  items: InventoryItem[],
  options: { selectedEntityId?: string | null } = {},
): SceneState {
  // Bucket items by zone so we can compute per-zone positions.
  const buckets: Record<ZoneKey, InventoryItem[]> = {
    cold: [],
    dry: [],
    freezer: [],
    risk: [],
  };

  const enriched = items.map((item) => {
    const theme = severityToTheme(item.severity);
    const zone = inferZone(item, theme);
    buckets[zone].push(item);
    return { item, theme, zone };
  });

  const indexInZone = new Map<string, number>();
  ZONE_ORDER.forEach((z) =>
    buckets[z].forEach((it, idx) => indexInZone.set(it.id, idx)),
  );

  // ── Zone entities ──────────────────────────────────────────────────────────
  const zoneEntities: SceneEntity[] = ZONE_ORDER.map((zoneKey) => {
    const meta = ZONE_META[zoneKey];
    const count = buckets[zoneKey].length;
    return {
      id: `zone_${zoneKey}`,
      entityType: 'storageZone',
      transform: {
        position: meta.pos,
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      geometry: { kind: 'storageRoom' },
      material: { theme: meta.theme, emissive: 0.18, opacity: 1 },
      content: {
        title: meta.label,
        subtitle: meta.subtitle,
        badges: [String(count)],
      },
      gameplay: { selectable: false, hoverable: false, actions: [] },
    };
  });

  // ── Product entities ───────────────────────────────────────────────────────
  const productEntities: SceneEntity[] = enriched.map(({ item, theme, zone }) => {
    const idx = indexInZone.get(item.id) ?? 0;
    const position = productPositionInZone(zone, idx);
    const assetKey = inferAssetKey(item.product.category);
    const shortQty = `${item.remaining_quantity} ${item.product.base_unit}`;

    return {
      id: `product_${item.id}`,
      entityType: 'inventoryProduct',
      transform: {
        position,
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      geometry: { kind: 'productCard' },
      material: { theme, emissive: emissiveForTheme(theme), opacity: 1 },
      content: {
        title: item.product.name,
        subtitle: shortQty,
        assetKey,
        imageUrl: item.product.image_url,
        fallbackIcon: undefined,
        badges: [item.product.category],
        // DEV: use sci_fi_card.glb from local Rust backend to preview shape.
        // PROD: backend supplies real model_url via laboratory/generate.
        glbUrl: (item as unknown as { glb_url?: string | null }).glb_url ?? DEV_GLB_URL,
      },
      gameplay: {
        selectable: true,
        hoverable: true,
        actions: actionsForTheme(theme),
        linkedEntityId: item.id,
      },
      data: { domain: 'inventory', entityId: item.id },
    };
  });

  // ── HUD ────────────────────────────────────────────────────────────────────
  const expiringCount = enriched.filter((e) => e.theme === 'warning').length;
  const lowStockCount = enriched.filter((e) => {
    const min = e.item.product.min_stock_threshold;
    return min > 0 && e.item.remaining_quantity <= min;
  }).length;
  const totalValueCents = items.reduce(
    (sum, it) => sum + it.remaining_quantity * it.price_per_unit_cents,
    0,
  );

  return {
    sceneId: 'inventory-main',
    mode: 'inventory',
    tick: Date.now(),
    generatedAt: new Date().toISOString(),
    camera: {
      preset: 'overview',
      position: [0, 8, 13],
      target: [0, 1.5, 0],
      fov: 58,
    },
    hud: {
      totalValueLabel: `${(totalValueCents / 100).toFixed(2)} PLN`,
      itemsLabel: String(items.length),
      expiringLabel: String(expiringCount),
      lowStockLabel: String(lowStockCount),
    },
    entities: [...zoneEntities, ...productEntities],
    selectedEntityId: options.selectedEntityId ?? null,
  };
}
