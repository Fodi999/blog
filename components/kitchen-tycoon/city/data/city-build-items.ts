/**
 * city/data/city-build-items.ts
 * Каталог построек для City Mode.
 */

export type CityBuildCategory = 'Food' | 'Infrastructure' | 'Marketing';

export interface CityBuildItem {
  id: string;
  name: string;
  category: CityBuildCategory;
  price: number;
  size: [number, number]; // [w, h] in tiles
  requiredLevel: number;
  icon: string;
  description: string;
  revenuePerDay: number;
  maintenancePerDay: number;
}

export const CITY_BUILD_ITEMS: CityBuildItem[] = [
  // ── Food ──────────────────────────────────────────────────────────────────
  {
    id: 'small_kitchen',
    name: 'Small Kitchen',
    category: 'Food',
    price: 1000,
    size: [2, 2],
    requiredLevel: 1,
    icon: '🍳',
    description: 'Basic kitchen. Low cost, low revenue.',
    revenuePerDay: 120,
    maintenancePerDay: 20,
  },
  {
    id: 'coffee_point',
    name: 'Coffee Point',
    category: 'Food',
    price: 1800,
    size: [2, 1],
    requiredLevel: 1,
    icon: '☕',
    description: 'High traffic, fast service. Great for office districts.',
    revenuePerDay: 200,
    maintenancePerDay: 30,
  },
  {
    id: 'dark_kitchen',
    name: 'Dark Kitchen',
    category: 'Food',
    price: 3500,
    size: [3, 2],
    requiredLevel: 2,
    icon: '🥡',
    description: 'Delivery-only operation. No walk-in customers.',
    revenuePerDay: 380,
    maintenancePerDay: 55,
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    category: 'Food',
    price: 8000,
    size: [3, 3],
    requiredLevel: 3,
    icon: '🍽️',
    description: 'Full-service restaurant. High revenue, high cost.',
    revenuePerDay: 900,
    maintenancePerDay: 140,
  },
  {
    id: 'food_truck',
    name: 'Food Truck',
    category: 'Food',
    price: 2200,
    size: [1, 2],
    requiredLevel: 1,
    icon: '🚚',
    description: 'Mobile. Can be placed on roads.',
    revenuePerDay: 180,
    maintenancePerDay: 35,
  },

  // ── Infrastructure ────────────────────────────────────────────────────────
  {
    id: 'delivery_hub',
    name: 'Delivery Hub',
    category: 'Infrastructure',
    price: 4000,
    size: [3, 3],
    requiredLevel: 2,
    icon: '🏪',
    description: 'Boosts delivery radius for nearby kitchens.',
    revenuePerDay: 0,
    maintenancePerDay: 60,
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    category: 'Infrastructure',
    price: 2500,
    size: [4, 2],
    requiredLevel: 2,
    icon: '🏭',
    description: 'Reduces ingredient costs by 15%.',
    revenuePerDay: 0,
    maintenancePerDay: 40,
  },
  {
    id: 'cold_storage',
    name: 'Cold Storage',
    category: 'Infrastructure',
    price: 1500,
    size: [2, 2],
    requiredLevel: 1,
    icon: '❄️',
    description: 'Reduces food waste by 20%.',
    revenuePerDay: 0,
    maintenancePerDay: 25,
  },

  // ── Marketing ─────────────────────────────────────────────────────────────
  {
    id: 'billboard',
    name: 'Billboard',
    category: 'Marketing',
    price: 800,
    size: [1, 1],
    requiredLevel: 1,
    icon: '📣',
    description: '+10% customers in district.',
    revenuePerDay: 0,
    maintenancePerDay: 15,
  },
  {
    id: 'promo_stand',
    name: 'Promo Stand',
    category: 'Marketing',
    price: 400,
    size: [1, 1],
    requiredLevel: 1,
    icon: '🎪',
    description: '+5% customers, temporary.',
    revenuePerDay: 0,
    maintenancePerDay: 8,
  },
];

export const CITY_BUILD_CATEGORIES: CityBuildCategory[] = ['Food', 'Infrastructure', 'Marketing'];
