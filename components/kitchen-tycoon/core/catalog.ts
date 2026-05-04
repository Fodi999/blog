/**
 * kitchen-tycoon/core/catalog.ts
 * Buyable equipment + ingredient + recipe catalog for Stage 1.
 */
import type { Ingredient, KitchenAssetSpec, KitchenAssetType, Recipe } from './types';

export const ASSET_CATALOG: Record<KitchenAssetType, KitchenAssetSpec> = {
  prep_table: {
    type: 'prep_table',
    name: 'Prep Table',
    price: 250,
    maintenancePerDay: 1,
    powerKw: 0,
    capacityPerHour: 12,
    speedMultiplier: 1.0,
    qualityBonus: 0,
    size: { w: 2, h: 1 },
    color: '#a3a3a3',
    glyph: '🪵',
  },
  stove: {
    type: 'stove',
    name: 'Gas Stove',
    price: 600,
    maintenancePerDay: 4,
    powerKw: 5,
    capacityPerHour: 10,
    speedMultiplier: 1.0,
    qualityBonus: 0,
    size: { w: 1, h: 1 },
    color: '#ef4444',
    glyph: '🔥',
  },
  oven: {
    type: 'oven',
    name: 'Oven',
    price: 1200,
    maintenancePerDay: 6,
    powerKw: 7,
    capacityPerHour: 14,
    speedMultiplier: 1.1,
    qualityBonus: 0.05,
    size: { w: 2, h: 1 },
    color: '#f97316',
    glyph: '♨️',
  },
  fridge: {
    type: 'fridge',
    name: 'Fridge',
    price: 800,
    maintenancePerDay: 3,
    powerKw: 2,
    capacityPerHour: 0,
    speedMultiplier: 1.0,
    qualityBonus: 0,
    size: { w: 1, h: 1 },
    color: '#38bdf8',
    glyph: '🧊',
  },
  freezer: {
    type: 'freezer',
    name: 'Freezer',
    price: 1100,
    maintenancePerDay: 4,
    powerKw: 3,
    capacityPerHour: 0,
    speedMultiplier: 1.0,
    qualityBonus: 0,
    size: { w: 1, h: 1 },
    color: '#0ea5e9',
    glyph: '❄️',
  },
  sink: {
    type: 'sink',
    name: 'Sink',
    price: 180,
    maintenancePerDay: 1,
    powerKw: 0,
    capacityPerHour: 0,
    speedMultiplier: 1.0,
    qualityBonus: 0,
    size: { w: 1, h: 1 },
    color: '#94a3b8',
    glyph: '🚰',
  },
  shelf: {
    type: 'shelf',
    name: 'Shelf',
    price: 120,
    maintenancePerDay: 0,
    powerKw: 0,
    capacityPerHour: 0,
    speedMultiplier: 1.0,
    qualityBonus: 0,
    size: { w: 2, h: 1 },
    color: '#a16207',
    glyph: '📦',
  },
  packing_station: {
    type: 'packing_station',
    name: 'Packing Station',
    price: 450,
    maintenancePerDay: 2,
    powerKw: 1,
    capacityPerHour: 20,
    speedMultiplier: 1.0,
    qualityBonus: 0,
    size: { w: 2, h: 1 },
    color: '#facc15',
    glyph: '📦',
  },
  delivery_counter: {
    type: 'delivery_counter',
    name: 'Delivery Counter',
    price: 300,
    maintenancePerDay: 1,
    powerKw: 0,
    capacityPerHour: 30,
    speedMultiplier: 1.0,
    qualityBonus: 0,
    size: { w: 2, h: 1 },
    color: '#22c55e',
    glyph: '🛵',
  },
  sauce_machine: {
    type: 'sauce_machine',
    name: 'Sauce Machine',
    price: 2400,
    maintenancePerDay: 8,
    powerKw: 4,
    capacityPerHour: 40,
    speedMultiplier: 1.4,
    qualityBonus: 0.1,
    size: { w: 2, h: 1 },
    color: '#dc2626',
    glyph: '🥫',
  },
  vacuum_machine: {
    type: 'vacuum_machine',
    name: 'Vacuum Machine',
    price: 3200,
    maintenancePerDay: 6,
    powerKw: 3,
    capacityPerHour: 30,
    speedMultiplier: 1.0,
    qualityBonus: 0.15,
    size: { w: 1, h: 1 },
    color: '#7c3aed',
    glyph: '🟪',
  },
  blast_chiller: {
    type: 'blast_chiller',
    name: 'Blast Chiller',
    price: 4500,
    maintenancePerDay: 9,
    powerKw: 8,
    capacityPerHour: 25,
    speedMultiplier: 1.0,
    qualityBonus: 0.2,
    size: { w: 2, h: 1 },
    color: '#1e40af',
    glyph: '🥶',
  },
};

export const INGREDIENTS: Record<string, Ingredient> = {
  tomato: { id: 'tomato', name: 'Tomato', unit: 'g',  costPerUnit: 0.008 },
  pasta:  { id: 'pasta',  name: 'Pasta',  unit: 'g',  costPerUnit: 0.012 },
  oil:    { id: 'oil',    name: 'Oil',    unit: 'ml', costPerUnit: 0.015 },
  cheese: { id: 'cheese', name: 'Cheese', unit: 'g',  costPerUnit: 0.04  },
  flour:  { id: 'flour',  name: 'Flour',  unit: 'g',  costPerUnit: 0.005 },
  water:  { id: 'water',  name: 'Water',  unit: 'ml', costPerUnit: 0.001 },
};

export const RECIPES: Recipe[] = [
  {
    id: 'tomato_pasta',
    name: 'Tomato Pasta',
    ingredients: [
      { id: 'pasta',  qty: 120 },
      { id: 'tomato', qty: 200 },
      { id: 'oil',    qty: 15  },
      { id: 'cheese', qty: 25  },
    ],
    packagingCost: 1.1,
    laborMinutes: 8,
    requires: ['stove', 'prep_table'],
    basePrice: 22,
  },
  {
    id: 'tomato_sauce',
    name: 'Tomato Sauce (jar)',
    ingredients: [
      { id: 'tomato', qty: 400 },
      { id: 'oil',    qty: 25  },
    ],
    packagingCost: 1.4,
    laborMinutes: 5,
    requires: ['stove'],
    basePrice: 18,
  },
  {
    id: 'flatbread',
    name: 'Flatbread',
    ingredients: [
      { id: 'flour', qty: 200 },
      { id: 'water', qty: 100 },
      { id: 'oil',   qty: 10  },
    ],
    packagingCost: 0.5,
    laborMinutes: 6,
    requires: ['oven', 'prep_table'],
    basePrice: 12,
  },
];

/** Compute food cost (ingredients only) for one portion. */
export function recipeFoodCost(r: Recipe): number {
  return r.ingredients.reduce(
    (sum, x) => sum + x.qty * (INGREDIENTS[x.id]?.costPerUnit ?? 0),
    0,
  );
}

/** Compute total cost (food + packaging + a flat labor estimate). */
export function recipeTotalCost(r: Recipe, hourlyLabor = 25): number {
  const labor = (r.laborMinutes / 60) * hourlyLabor;
  return recipeFoodCost(r) + r.packagingCost + labor;
}

export function recipeMargin(r: Recipe): { profit: number; marginPct: number } {
  const cost = recipeTotalCost(r);
  const profit = r.basePrice - cost;
  return { profit, marginPct: (profit / r.basePrice) * 100 };
}
