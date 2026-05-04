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

export interface KitchenState {
  // ── World ──
  game: GameState;
  finance: FinanceState;
  assets: KitchenAsset[];
  orders: Order[];
  /** ingredient stock in base unit (g/ml/pcs) */
  stock: Record<string, number>;

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
          const r = RECIPES[Math.floor(Math.random() * RECIPES.length)];
          const qty = 1 + Math.floor(Math.random() * 4);
          const payout = Math.round(r.basePrice * qty * (0.95 + Math.random() * 0.15));
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
            s.finance.cash -= maintenance;
            s.finance.costToday += maintenance;
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
    })),
  );
}
