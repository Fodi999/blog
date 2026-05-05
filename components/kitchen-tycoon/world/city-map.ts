/**
 * world/city-map.ts
 *
 * Карта города — единственный источник правды для всей игровой логики.
 *
 * Город: VERIDIAN CITY  —  сетка 3×3
 *
 *   ┌──────────────┬──────────────┬──────────────┐
 *   │  INDUSTRIAL  │   OLD TOWN   │   SHOPPING   │
 *   │     ZONE     │   (CENTER)   │    CENTER    │
 *   ├──────────────┼──────────────┼──────────────┤
 *   │   STUDENT    │   OFFICE     │  RESIDENTIAL │
 *   │    AREA      │   DISTRICT   │    WEST      │
 *   ├──────────────┼──────────────┼──────────────┤
 *   │    HARBOR    │  TECH PARK   │   LUXURY     │
 *   │   DISTRICT   │              │    HILLS     │
 *   └──────────────┴──────────────┴──────────────┘
 */

// ── Типы ─────────────────────────────────────────────────────────────────────

export type DistrictId =
  | 'old_town'
  | 'office_district'
  | 'student_area'
  | 'residential_west'
  | 'industrial_zone'
  | 'shopping_center'
  | 'harbor_district'
  | 'tech_park'
  | 'luxury_hills';

export type CustomerProfile =
  | 'worker'
  | 'student'
  | 'office'
  | 'tourist'
  | 'resident'
  | 'hipster'
  | 'sailor'
  | 'developer'
  | 'elite';

export interface DistrictDemand {
  peakCustomers: number;
  priceMultiplier: number;
  patience: 'low' | 'medium' | 'high';
  customerMix: Partial<Record<CustomerProfile, number>>;
}

export interface DistrictRent {
  perTilePerDay: number;
  startingTiles: number;
}

export interface District {
  id: DistrictId;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  icon: string;
  gridPos: [number, number];
  neighbors: DistrictId[];
  unlocked: boolean;
  unlockLevel: number;
  demand: DistrictDemand;
  rent: DistrictRent;
  kitchenBonus: Partial<Record<string, number>>;
  flags: {
    hasNightLife: boolean;
    hasMorningRush: boolean;
    hasLunchRush: boolean;
    hasEveningRush: boolean;
    competitionHigh: boolean;
  };
}

// ── Районы города ─────────────────────────────────────────────────────────────

export const DISTRICTS: Record<DistrictId, District> = {

  // Row 0 ──────────────────────────────────────────────────────────────────

  industrial_zone: {
    id: 'industrial_zone',
    name: 'Industrial Zone',
    subtitle: 'Заводской квартал',
    description: 'Бывшие заводы, часть стала арт-пространством. Рабочие в 6 утра, хипстеры в 10. Аренда самая дешёвая.',
    color: '#8a6040',
    icon: '🏭',
    gridPos: [0, 0],
    neighbors: ['old_town', 'student_area'],
    unlocked: true,
    unlockLevel: 1,
    demand: {
      peakCustomers: 60,
      priceMultiplier: 0.85,
      patience: 'medium',
      customerMix: { worker: 6, hipster: 2, student: 2 },
    },
    rent: { perTilePerDay: 40, startingTiles: 30 },
    kitchenBonus: { burger: 1.4, fast_food: 1.3, breakfast: 1.5 },
    flags: { hasNightLife: false, hasMorningRush: true, hasLunchRush: true, hasEveningRush: false, competitionHigh: false },
  },

  old_town: {
    id: 'old_town',
    name: 'Old Town',
    subtitle: 'Исторический центр',
    description: 'Мощёные улочки, туристы с фотоаппаратами, дорогие кафе и ресторан со звездой Мишлен.',
    color: '#c2793a',
    icon: '🏛️',
    gridPos: [1, 0],
    neighbors: ['office_district', 'industrial_zone', 'shopping_center'],
    unlocked: false,
    unlockLevel: 4,
    demand: {
      peakCustomers: 80,
      priceMultiplier: 1.9,
      patience: 'high',
      customerMix: { tourist: 5, resident: 3, hipster: 2 },
    },
    rent: { perTilePerDay: 240, startingTiles: 12 },
    kitchenBonus: { italian: 1.3, french: 1.4, local: 1.5 },
    flags: { hasNightLife: true, hasMorningRush: false, hasLunchRush: true, hasEveningRush: true, competitionHigh: true },
  },

  shopping_center: {
    id: 'shopping_center',
    name: 'Shopping Center',
    subtitle: 'Торговый квартал',
    description: 'Торговые молы, фастфуд-корты, кинотеатры. Семьи и подростки в выходные.',
    color: '#c14a6a',
    icon: '🛍️',
    gridPos: [2, 0],
    neighbors: ['old_town', 'office_district', 'residential_west'],
    unlocked: false,
    unlockLevel: 3,
    demand: {
      peakCustomers: 150,
      priceMultiplier: 1.1,
      patience: 'low',
      customerMix: { resident: 4, student: 3, tourist: 2, worker: 1 },
    },
    rent: { perTilePerDay: 120, startingTiles: 18 },
    kitchenBonus: { fast_food: 1.6, ice_cream: 1.4, american: 1.3 },
    flags: { hasNightLife: true, hasMorningRush: false, hasLunchRush: true, hasEveningRush: true, competitionHigh: true },
  },

  // Row 1 ──────────────────────────────────────────────────────────────────

  student_area: {
    id: 'student_area',
    name: 'Student Area',
    subtitle: 'Студенческий квартал',
    description: 'Университет, общаги, кальянные и пиццерии за 5€. Клиентов много, платят мало, ночью самый живой.',
    color: '#7a5ea8',
    icon: '🎓',
    gridPos: [0, 1],
    neighbors: ['office_district', 'industrial_zone', 'harbor_district'],
    unlocked: true,
    unlockLevel: 1,
    demand: {
      peakCustomers: 100,
      priceMultiplier: 0.75,
      patience: 'medium',
      customerMix: { student: 8, worker: 1, hipster: 1 },
    },
    rent: { perTilePerDay: 60, startingTiles: 20 },
    kitchenBonus: { pizza: 1.5, fast_food: 1.3, asian: 1.2 },
    flags: { hasNightLife: true, hasMorningRush: false, hasLunchRush: true, hasEveningRush: true, competitionHigh: false },
  },

  office_district: {
    id: 'office_district',
    name: 'Office District',
    subtitle: 'Деловой центр',
    description: 'Стеклянные башни, люди в костюмах, 30-минутный перерыв на обед.',
    color: '#4a7fc1',
    icon: '🏢',
    gridPos: [1, 1],
    neighbors: ['old_town', 'student_area', 'residential_west', 'shopping_center', 'tech_park'],
    unlocked: false,
    unlockLevel: 2,
    demand: {
      peakCustomers: 120,
      priceMultiplier: 1.4,
      patience: 'low',
      customerMix: { office: 7, worker: 2, hipster: 1 },
    },
    rent: { perTilePerDay: 160, startingTiles: 16 },
    kitchenBonus: { fast_food: 1.3, japanese: 1.2, healthy: 1.4 },
    flags: { hasNightLife: false, hasMorningRush: true, hasLunchRush: true, hasEveningRush: false, competitionHigh: true },
  },

  residential_west: {
    id: 'residential_west',
    name: 'Residential West',
    subtitle: 'Спальный район',
    description: 'Панельные дома, парки, семьи с колясками. Вечером хороший поток после 18:00.',
    color: '#5a9c6a',
    icon: '🏠',
    gridPos: [2, 1],
    neighbors: ['office_district', 'shopping_center', 'luxury_hills'],
    unlocked: false,
    unlockLevel: 3,
    demand: {
      peakCustomers: 70,
      priceMultiplier: 1.0,
      patience: 'high',
      customerMix: { resident: 7, worker: 2, student: 1 },
    },
    rent: { perTilePerDay: 80, startingTiles: 24 },
    kitchenBonus: { homestyle: 1.5, pizza: 1.2, local: 1.3 },
    flags: { hasNightLife: false, hasMorningRush: true, hasLunchRush: false, hasEveningRush: true, competitionHigh: false },
  },

  // Row 2 ──────────────────────────────────────────────────────────────────

  harbor_district: {
    id: 'harbor_district',
    name: 'Harbor District',
    subtitle: 'Портовый квартал',
    description: 'Старый порт, рыбный рынок, склады. Моряки, рыбаки и туристы с кораблей. Свежие морепродукты — золото.',
    color: '#2a7ea8',
    icon: '⚓',
    gridPos: [0, 2],
    neighbors: ['student_area', 'tech_park'],
    unlocked: false,
    unlockLevel: 3,
    demand: {
      peakCustomers: 85,
      priceMultiplier: 1.2,
      patience: 'medium',
      customerMix: { sailor: 4, worker: 3, tourist: 2, hipster: 1 },
    },
    rent: { perTilePerDay: 90, startingTiles: 22 },
    kitchenBonus: { seafood: 1.8, fish: 1.6, local: 1.3 },
    flags: { hasNightLife: true, hasMorningRush: true, hasLunchRush: true, hasEveningRush: false, competitionHigh: false },
  },

  tech_park: {
    id: 'tech_park',
    name: 'Tech Park',
    subtitle: 'Технологический кластер',
    description: 'Стартапы, дата-центры, коворкинги. Разработчики живут здесь. Средний чек высокий, платят картой.',
    color: '#20c0a0',
    icon: '💻',
    gridPos: [1, 2],
    neighbors: ['office_district', 'harbor_district', 'luxury_hills'],
    unlocked: false,
    unlockLevel: 4,
    demand: {
      peakCustomers: 90,
      priceMultiplier: 1.6,
      patience: 'low',
      customerMix: { developer: 6, office: 2, hipster: 2 },
    },
    rent: { perTilePerDay: 180, startingTiles: 14 },
    kitchenBonus: { healthy: 1.6, asian: 1.4, coffee: 1.5 },
    flags: { hasNightLife: false, hasMorningRush: true, hasLunchRush: true, hasEveningRush: false, competitionHigh: true },
  },

  luxury_hills: {
    id: 'luxury_hills',
    name: 'Luxury Hills',
    subtitle: 'Элитный район',
    description: 'Виллы, частные клубы, ужин при свечах. Клиентов мало, но каждый заказ — как выигрыш в лотерею.',
    color: '#d4af37',
    icon: '👑',
    gridPos: [2, 2],
    neighbors: ['residential_west', 'tech_park'],
    unlocked: false,
    unlockLevel: 5,
    demand: {
      peakCustomers: 35,
      priceMultiplier: 3.0,
      patience: 'high',
      customerMix: { elite: 7, tourist: 2, hipster: 1 },
    },
    rent: { perTilePerDay: 400, startingTiles: 8 },
    kitchenBonus: { french: 1.8, italian: 1.6, sushi: 1.7 },
    flags: { hasNightLife: true, hasMorningRush: false, hasLunchRush: false, hasEveningRush: true, competitionHigh: false },
  },
};

// ── Вспомогательные функции ───────────────────────────────────────────────────

export const DISTRICT_LIST = Object.values(DISTRICTS).sort(
  (a, b) => a.unlockLevel - b.unlockLevel,
);

export const STARTER_DISTRICTS = DISTRICT_LIST.filter((d) => d.unlocked);

/**
 * Map a backend district kind ("player" | "office" | "market" | ...) to a
 * static District definition for the Info panel. Backend ids look like
 * `office_-1_0` (kind_col_row); we fall back to a sensible static district
 * when the exact key is unknown.
 */
const KIND_TO_FALLBACK: Record<string, DistrictId> = {
  player:      'old_town',
  office:      'office_district',
  residential: 'residential_west',
  market:      'shopping_center',
  shops:       'shopping_center',
  competitor:  'luxury_hills',
  park:        'student_area',
  industrial:  'industrial_zone',
};

export function getDistrictById(id: string): District {
  // 1. Direct hit (legacy static ids)
  const direct = (DISTRICTS as Record<string, District | undefined>)[id];
  if (direct) return direct;

  // 2. Backend id format: "kind_col_row" → use kind prefix
  const kind = id.split('_')[0];
  const fallbackId = KIND_TO_FALLBACK[kind];
  if (fallbackId) return DISTRICTS[fallbackId];

  // 3. Last resort — first available district
  return DISTRICT_LIST[0];
}

export function getNeighbors(id: DistrictId): District[] {
  return DISTRICTS[id].neighbors.map((n) => DISTRICTS[n]);
}

export function calcRent(id: DistrictId, tiles: number, days: number): number {
  return DISTRICTS[id].rent.perTilePerDay * tiles * days;
}

export function baseRevenuePerCustomer(id: DistrictId, basePrice: number): number {
  return basePrice * DISTRICTS[id].demand.priceMultiplier;
}
