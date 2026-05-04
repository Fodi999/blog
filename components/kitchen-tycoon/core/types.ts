/**
 * kitchen-tycoon/core/types.ts
 * Core domain types for the food-business simulation.
 */

export type KitchenAssetType =
  | 'prep_table'
  | 'fridge'
  | 'freezer'
  | 'oven'
  | 'stove'
  | 'sink'
  | 'shelf'
  | 'packing_station'
  | 'delivery_counter'
  | 'sauce_machine'
  | 'vacuum_machine'
  | 'blast_chiller';

/** Specs of a buyable asset (catalog entry). */
export interface KitchenAssetSpec {
  type: KitchenAssetType;
  name: string;
  price: number;
  maintenancePerDay: number;
  powerKw: number;
  /** dishes/hour throughput when used as a station */
  capacityPerHour: number;
  speedMultiplier: number;
  qualityBonus: number;
  /** grid footprint in tiles */
  size: { w: number; h: number };
  /** UI accent color */
  color: string;
  /** single emoji glyph for the iso tile */
  glyph: string;
}

/** A placed instance of a KitchenAssetSpec on the grid. */
export interface KitchenAsset {
  id: string;
  type: KitchenAssetType;
  /** tile position (col, row) of upper-left corner */
  pos: { x: number; y: number };
  /** 0 / 90 / 180 / 270 */
  rotation: 0 | 90 | 180 | 270;
  level: 1 | 2 | 3;
}

export type IngredientId = 'tomato' | 'pasta' | 'oil' | 'cheese' | 'flour' | 'water';

export interface Ingredient {
  id: IngredientId;
  name: string;
  unit: 'g' | 'ml' | 'pcs';
  costPerUnit: number; // zł per unit
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: Array<{ id: IngredientId; qty: number }>;
  packagingCost: number;
  laborMinutes: number;
  /** required asset types to cook */
  requires: KitchenAssetType[];
  basePrice: number; // sale price zł
}

export interface Order {
  id: string;
  recipeId: string;
  qty: number;
  /** game-day deadline */
  dueDay: number;
  /** total payout */
  payout: number;
  status: 'pending' | 'in_progress' | 'done' | 'failed';
}

/** Player-side finance snapshot. */
export interface FinanceState {
  cash: number;
  revenueToday: number;
  costToday: number;
  /** rolling: foodCost / revenue last day */
  foodCostRatio: number;
  rating: number; // 0..5
  wastePct: number; // 0..1
}

export interface GameState {
  /** wall-clock days elapsed */
  day: number;
  /** in-game hour of day 0..23 */
  hour: number;
  paused: boolean;
  speed: 1 | 2 | 4;
  stage: 1 | 2 | 3 | 4 | 5;
}

export type ToolMode = 'select' | 'build' | 'move' | 'rotate' | 'delete';
