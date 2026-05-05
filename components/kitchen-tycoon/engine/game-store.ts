/**
 * kitchen-tycoon/engine/game-store.ts
 * Zustand + immer store for the food-business simulation.
 *
 * Pure logic — no React. Drives BuildPanel, Grid, OrdersPanel.
 */
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  FinanceState,
  GameState,
  KitchenAsset,
  KitchenAssetType,
  Order,
  ToolMode,
} from '../core/types';
import { ASSET_CATALOG, RECIPES, recipeFoodCost } from '../core/catalog';
import { DISTRICTS, type DistrictId } from '../world/city-map';

// ── City UI state ──────────────────────────────────────────────────────────────
export type CityToolMode = 'select' | 'build' | 'move' | 'rotate' | 'demolish';
export type CityCameraDirection = 0 | 90 | 180 | 270;

export interface CityUiState {
  toolMode: CityToolMode;
  selectedBuildItemId: string | null;
  selectedEntityId: string | null;
  selectedDistrictId: DistrictId | null;
  cameraDirection: CityCameraDirection;
  zoom: number;
  showGrid: boolean;
  showDistrictOverlay: boolean;
}

export interface KitchenState {
  // ── World ──
  game: GameState;
  finance: FinanceState;
  assets: KitchenAsset[];
  orders: Order[];
  /** ingredient stock in base unit (g/ml/pcs) */
  stock: Record<string, number>;

  // ── District ──
  selectedDistrictId: DistrictId;
  setSelectedDistrict: (id: DistrictId) => void;

  // ── City RTS UI ──
  cityUi: CityUiState;
  setCityTool: (mode: CityToolMode) => void;
  selectCityBuildItem: (id: string | null) => void;
  selectCityEntity: (id: string | null) => void;
  selectCityDistrict: (id: DistrictId | null) => void;
  rotateCameraLeft: () => void;
  rotateCameraRight: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  toggleGrid: () => void;
  toggleDistrictOverlay: () => void;

  // ── UI ──
  tool: ToolMode;
  /** when tool === 'build' — the picked asset type to place */
  buildType: KitchenAssetType | null;
  selectedAssetId: string | null;

  // ── Grid ──
  gridW: number;
  gridH: number;

  // ── Actions ──
  setTool: (t: ToolMode) => void;
  setBuildType: (t: KitchenAssetType | null) => void;
  selectAsset: (id: string | null) => void;

  /** Try to buy + place an asset at (x,y). No-op if blocked or broke. */
  placeAsset: (type: KitchenAssetType, x: number, y: number) => boolean;
  removeAsset: (id: string) => void;
  rotateAsset: (id: string) => void;
  upgradeAsset: (id: string) => void;

  buyIngredient: (id: string, qty: number) => boolean;
  acceptOrder: (orderId: string) => void;
  /** Spawn a randomized order (called by tick engine). */
  spawnOrder: () => void;
  /** Advance one in-game hour. */
  tick: () => void;
  togglePause: () => void;
  setSpeed: (s: 1 | 2 | 4) => void;
  /**
   * Hydrate game stock from backend inventory.
   * Merges real quantities with defaults — only overwrites if backend has data.
   */
  hydrateStock: (stockMap: Record<string, number>) => void;
  /**
   * Set restaurant name from backend (shown in game UI).
   */
  restaurantName: string;
  setRestaurantName: (name: string) => void;
}

const STARTING_CASH = 1000;
const GRID_W = 8;
const GRID_H = 6;

let _id = 0;
const uid = (p: string) => `${p}_${++_id}_${Math.random().toString(36).slice(2, 6)}`;

function tilesOccupied(a: KitchenAsset): Array<[number, number]> {
  const spec = ASSET_CATALOG[a.type];
  const rotated = a.rotation === 90 || a.rotation === 270;
  const w = rotated ? spec.size.h : spec.size.w;
  const h = rotated ? spec.size.w : spec.size.h;
  const out: Array<[number, number]> = [];
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) out.push([a.pos.x + dx, a.pos.y + dy]);
  }
  return out;
}

function canPlace(
  type: KitchenAssetType,
  x: number,
  y: number,
  rotation: 0 | 90 | 180 | 270,
  existing: KitchenAsset[],
  gridW: number,
  gridH: number,
): boolean {
  const spec = ASSET_CATALOG[type];
  const rotated = rotation === 90 || rotation === 270;
  const w = rotated ? spec.size.h : spec.size.w;
  const h = rotated ? spec.size.w : spec.size.h;
  if (x < 0 || y < 0 || x + w > gridW || y + h > gridH) return false;
  const occ = new Set<string>();
  for (const a of existing) {
    for (const [tx, ty] of tilesOccupied(a)) occ.add(`${tx},${ty}`);
  }
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (occ.has(`${x + dx},${y + dy}`)) return false;
    }
  }
  return true;
}

export type KitchenStoreApi = ReturnType<typeof createKitchenStore>;

export function createKitchenStore() {
  return createStore<KitchenState>()(
    immer((set, get) => ({
      game: { day: 1, hour: 8, paused: false, speed: 1, stage: 1 },
      finance: {
        cash: STARTING_CASH,
        revenueToday: 0,
        costToday: 0,
        foodCostRatio: 0,
        rating: 5.0,
        wastePct: 0,
      },
      assets: [],
      orders: [],
      stock: { tomato: 1000, pasta: 800, oil: 500, cheese: 300, flour: 600, water: 2000 },

      tool: 'select',
      buildType: null,
      selectedAssetId: null,
      gridW: GRID_W,
      gridH: GRID_H,
      restaurantName: 'Food Empire',

      selectedDistrictId: 'industrial_zone' as DistrictId,
      setSelectedDistrict(id) {
        set((s) => { s.selectedDistrictId = id; });
      },

      cityUi: {
        toolMode: 'select',
        selectedBuildItemId: null,
        selectedEntityId: null,
        selectedDistrictId: null,
        cameraDirection: 0,
        zoom: 70,
        showGrid: true,
        showDistrictOverlay: true,
      } as CityUiState,
      setCityTool(mode) {
        set((s) => { s.cityUi.toolMode = mode; });
      },
      selectCityBuildItem(id) {
        set((s) => { s.cityUi.selectedBuildItemId = id; });
      },
      selectCityEntity(id) {
        set((s) => { s.cityUi.selectedEntityId = id; });
      },
      selectCityDistrict(id) {
        set((s) => { s.cityUi.selectedDistrictId = id; });
      },
      rotateCameraLeft() {
        set((s) => {
          s.cityUi.cameraDirection = ((s.cityUi.cameraDirection - 90 + 360) % 360) as CityCameraDirection;
        });
      },
      rotateCameraRight() {
        set((s) => {
          s.cityUi.cameraDirection = ((s.cityUi.cameraDirection + 90) % 360) as CityCameraDirection;
        });
      },
      zoomIn() {
        set((s) => { s.cityUi.zoom = Math.max(10, s.cityUi.zoom - 6); });
      },
      zoomOut() {
        set((s) => { s.cityUi.zoom = Math.min(160, s.cityUi.zoom + 6); });
      },
      toggleGrid() {
        set((s) => { s.cityUi.showGrid = !s.cityUi.showGrid; });
      },
      toggleDistrictOverlay() {
        set((s) => { s.cityUi.showDistrictOverlay = !s.cityUi.showDistrictOverlay; });
      },

      setTool(t) {
        set((s) => {
          s.tool = t;
          if (t !== 'build') s.buildType = null;
          if (t !== 'select') s.selectedAssetId = null;
        });
      },
      setBuildType(t) {
        set((s) => {
          s.buildType = t;
          s.tool = t ? 'build' : 'select';
        });
      },
      selectAsset(id) {
        set((s) => { s.selectedAssetId = id; });
      },

      placeAsset(type, x, y) {
        const state = get();
        const spec = ASSET_CATALOG[type];
        if (state.finance.cash < spec.price) return false;
        if (!canPlace(type, x, y, 0, state.assets, state.gridW, state.gridH)) return false;
        set((s) => {
          s.assets.push({ id: uid(type), type, pos: { x, y }, rotation: 0, level: 1 });
          s.finance.cash -= spec.price;
        });
        return true;
      },

      removeAsset(id) {
        set((s) => {
          const a = s.assets.find((x) => x.id === id);
          if (!a) return;
          // 50% refund
          const refund = Math.round(ASSET_CATALOG[a.type].price * 0.5);
          s.finance.cash += refund;
          s.assets = s.assets.filter((x) => x.id !== id);
          if (s.selectedAssetId === id) s.selectedAssetId = null;
        });
      },

      rotateAsset(id) {
        set((s) => {
          const a = s.assets.find((x) => x.id === id);
          if (!a) return;
          const next = ((a.rotation + 90) % 360) as 0 | 90 | 180 | 270;
          // Validate rotation against grid+others
          const others = s.assets.filter((x) => x.id !== id);
          if (canPlace(a.type, a.pos.x, a.pos.y, next, others, s.gridW, s.gridH)) {
            a.rotation = next;
          }
        });
      },

      upgradeAsset(id) {
        set((s) => {
          const a = s.assets.find((x) => x.id === id);
          if (!a || a.level >= 3) return;
          const cost = ASSET_CATALOG[a.type].price * (a.level === 1 ? 0.6 : 1.0);
          if (s.finance.cash < cost) return;
          s.finance.cash -= cost;
          a.level = (a.level + 1) as 1 | 2 | 3;
        });
      },

      buyIngredient(id, qty) {
        const state = get();
        const cost = qty * 0.01; // simplified
        if (state.finance.cash < cost) return false;
        set((s) => {
          s.finance.cash -= cost;
          s.stock[id] = (s.stock[id] ?? 0) + qty;
        });
        return true;
      },

      acceptOrder(orderId) {
        set((s) => {
          const o = s.orders.find((x) => x.id === orderId);
          if (!o || o.status !== 'pending') return;
          const recipe = RECIPES.find((r) => r.id === o.recipeId);
          if (!recipe) return;
          // Check stock
          for (const ing of recipe.ingredients) {
            if ((s.stock[ing.id] ?? 0) < ing.qty * o.qty) return;
          }
          // Check required equipment present
          for (const req of recipe.requires) {
            if (!s.assets.some((a) => a.type === req)) return;
          }
          // Consume stock
          for (const ing of recipe.ingredients) {
            s.stock[ing.id] -= ing.qty * o.qty;
          }
          // Costs + revenue
          const food = recipeFoodCost(recipe) * o.qty;
          const labor = (recipe.laborMinutes / 60) * 25 * o.qty;
          const pack = recipe.packagingCost * o.qty;
          const totalCost = food + labor + pack;
          s.finance.cash += o.payout - totalCost;
          s.finance.revenueToday += o.payout;
          s.finance.costToday += totalCost;
          o.status = 'done';
        });
      },

      spawnOrder() {
        set((s) => {
          const district = DISTRICTS[s.selectedDistrictId];
          const r = RECIPES[Math.floor(Math.random() * RECIPES.length)];
          const qty = 1 + Math.floor(Math.random() * 4);
          // payout scaled by district price multiplier
          const payout = Math.round(
            r.basePrice * qty * (0.95 + Math.random() * 0.15) * district.demand.priceMultiplier,
          );
          s.orders.push({
            id: uid('ord'),
            recipeId: r.id,
            qty,
            dueDay: s.game.day + 1,
            payout,
            status: 'pending',
          });
        });
      },

      tick() {
        set((s) => {
          if (s.game.paused) return;
          s.game.hour += 1;
          if (s.game.hour >= 24) {
            s.game.hour = 0;
            // End-of-day settlement
            const maintenance = s.assets.reduce(
              (sum, a) => sum + ASSET_CATALOG[a.type].maintenancePerDay,
              0,
            );
            // District rent: tiles used × rent per tile per day
            const usedTiles = s.assets.reduce((sum, a) => {
              const spec = ASSET_CATALOG[a.type];
              return sum + spec.size.w * spec.size.h;
            }, 0);
            const districtRent = usedTiles * DISTRICTS[s.selectedDistrictId].rent.perTilePerDay;
            s.finance.cash -= maintenance + districtRent;
            s.finance.costToday += maintenance + districtRent;
            const rev = s.finance.revenueToday || 1;
            s.finance.foodCostRatio = s.finance.costToday / rev;
            // Expire pending orders past due
            for (const o of s.orders) {
              if (o.status === 'pending' && o.dueDay <= s.game.day) {
                o.status = 'failed';
                s.finance.rating = Math.max(0, s.finance.rating - 0.1);
              }
            }
            s.finance.revenueToday = 0;
            s.finance.costToday = 0;
            s.game.day += 1;
          }
        });
      },

      togglePause() {
        set((s) => { s.game.paused = !s.game.paused; });
      },
      setSpeed(speed) {
        set((s) => { s.game.speed = speed; });
      },

      setRestaurantName(name) {
        set((s) => { s.restaurantName = name; });
      },
      hydrateStock(stockMap) {
        set((s) => {
          // Merge backend quantities into existing stock keys
          for (const [key, qty] of Object.entries(stockMap)) {
            if (qty > 0) {
              // Map to existing game stock keys by substring match
              const gameKey = Object.keys(s.stock).find(
                (k) => key.includes(k) || k.includes(key)
              );
              if (gameKey) {
                s.stock[gameKey] = qty;
              } else {
                // Add new key from backend
                s.stock[key] = qty;
              }
            }
          }
        });
      },
    })),
  );
}
