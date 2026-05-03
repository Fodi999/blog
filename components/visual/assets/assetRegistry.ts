/**
 * Asset registry — maps stable asset keys to local paths and fallback
 * metadata. Backend says `assetKey: "egg"`, frontend resolves it here.
 *
 * Why: external image URLs are unreliable (CORS, 403, bandwidth, GDPR).
 * A stable key is what the backend should send; the frontend owns the
 * actual files.
 */

export interface AssetEntry {
  /** Local image path under /public, or absolute R2 URL. */
  icon?: string;
  /** Emoji fallback when icon is missing/failed. */
  fallbackIcon: string;
  /** Default prefab kind hint for unknown items in this category. */
  defaultPrefab?: 'productCard' | 'container' | 'bottle' | 'tray';
}

export const assetRegistry: Record<string, AssetEntry> = {
  egg: { fallbackIcon: '🥚', defaultPrefab: 'productCard' },
  meat: { fallbackIcon: '🍗', defaultPrefab: 'tray' },
  fish: { fallbackIcon: '🐟', defaultPrefab: 'tray' },
  dairy: { fallbackIcon: '🧀', defaultPrefab: 'productCard' },
  vegetable: { fallbackIcon: '🥬', defaultPrefab: 'tray' },
  fruit: { fallbackIcon: '🍎', defaultPrefab: 'tray' },
  grain: { fallbackIcon: '🌾', defaultPrefab: 'container' },
  spice: { fallbackIcon: '🌿', defaultPrefab: 'bottle' },
  oil: { fallbackIcon: '🫙', defaultPrefab: 'bottle' },
  sauce: { fallbackIcon: '🫙', defaultPrefab: 'bottle' },
  frozen: { fallbackIcon: '🧊', defaultPrefab: 'container' },
  drink: { fallbackIcon: '🥤', defaultPrefab: 'bottle' },
  generic: { fallbackIcon: '📦', defaultPrefab: 'productCard' },
};

/** Best-effort key inference from a category string. Used when backend
 *  hasn't yet assigned a stable assetKey to an item. */
export function inferAssetKey(category: string | undefined | null): string {
  if (!category) return 'generic';
  const c = category.toLowerCase();
  if (/(egg|яйц)/.test(c)) return 'egg';
  if (/(meat|chicken|beef|pork|мяс|курин)/.test(c)) return 'meat';
  if (/(fish|рыб|seafood)/.test(c)) return 'fish';
  if (/(dairy|cheese|milk|молоч|сыр)/.test(c)) return 'dairy';
  if (/(veg|tomato|salad|зелен|овощ)/.test(c)) return 'vegetable';
  if (/(fruit|apple|berry|фрукт|ягод)/.test(c)) return 'fruit';
  if (/(grain|rice|pasta|flour|круп|мук)/.test(c)) return 'grain';
  if (/(spice|herb|special|спец)/.test(c)) return 'spice';
  if (/(oil|масл)/.test(c)) return 'oil';
  if (/(sauce|соус)/.test(c)) return 'sauce';
  if (/(frozen|мороз|ice)/.test(c)) return 'frozen';
  if (/(drink|water|juice|напит|сок)/.test(c)) return 'drink';
  return 'generic';
}

export function resolveAsset(assetKey: string | undefined): AssetEntry {
  if (!assetKey) return assetRegistry.generic;
  return assetRegistry[assetKey] ?? assetRegistry.generic;
}
