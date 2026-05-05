/**
 * world/city-map.ts
 *
 * Карта города — единственный источник правды для всей игровой логики.
 *
 * Город: VERIDIAN CITY
 * ─────────────────────────────────────────────────────────────────────────────
 * Концепция: среднеевропейский промышленный город, который переживает
 * экономический подъём. Старый завод превратился в арт-квартал,
 * студенты пьют кофе рядом с рабочими, а в центре стоят дорогие рестораны.
 *
 * Карта районов (топология, не точные координаты):
 *
 *   ┌──────────────┬──────────────┬──────────────┐
 *   │  INDUSTRIAL  │  OLD  TOWN   │   SHOPPING   │
 *   │     ZONE     │   (CENTER)   │    CENTER    │
 *   ├──────────────┼──────────────┼──────────────┤
 *   │   STUDENT    │   OFFICE     │  RESIDENTIAL │
 *   │    AREA      │   DISTRICT   │    WEST      │
 *   └──────────────┴──────────────┴──────────────┘
 */

// ── Типы ─────────────────────────────────────────────────────────────────────

export type DistrictId =
  | 'old_town'
  | 'office_district'
  | 'student_area'
  | 'residential_west'
  | 'industrial_zone'
  | 'shopping_center';

export type CustomerProfile =
  | 'worker'       // рабочий — хочет дёшево и быстро
  | 'student'      // студент — голодный, бюджетный, любит тренды
  | 'office'       // офисный — ланч за 30 минут, средний чек
  | 'tourist'      // турист — платит больше, хочет "местную" еду
  | 'resident'     // житель — семьи, вечером, средний чек
  | 'hipster';     // хипстер — дорогой кофе, веган, инстаграм

export interface DistrictDemand {
  /** Базовое количество клиентов в час (пиковое время) */
  peakCustomers: number;
  /** Готовность платить: 1.0 = среднее, 2.0 = вдвое больше */
  priceMultiplier: number;
  /** Скорость обслуживания: насколько нетерпеливы клиенты */
  patience: 'low' | 'medium' | 'high';
  /** Профили клиентов с весами (сумма не обязана = 1) */
  customerMix: Partial<Record<CustomerProfile, number>>;
}

export interface DistrictRent {
  /** Стоимость аренды 1 клетки в день */
  perTilePerDay: number;
  /** Начальный размер доступных участков */
  startingTiles: number;
}

export interface District {
  id: DistrictId;
  name: string;
  subtitle: string;
  description: string;
  /** Цвет на карте (hex) */
  color: string;
  /** Иконка (emoji) */
  icon: string;
  /** Позиция на сетке карты [col, row] 0-based */
  gridPos: [number, number];
  /** Соседние районы (для пешеходного трафика) */
  neighbors: DistrictId[];
  /** Разблокирован с самого начала? */
  unlocked: boolean;
  /** Уровень города необходимый для разблокировки */
  unlockLevel: number;
  demand: DistrictDemand;
  rent: DistrictRent;
  /** Бонусы/штрафы для конкретных типов кухни */
  kitchenBonus: Partial<Record<string, number>>; // kitchenType → multiplier
  /** Флаги особых условий */
  flags: {
    hasNightLife: boolean;       // работает ли по ночам
    hasMorningRush: boolean;     // утренний пик (7–9)
    hasLunchRush: boolean;       // обеденный пик (12–14)
    hasEveningRush: boolean;     // вечерний пик (18–21)
    competitionHigh: boolean;    // много конкурентов — нужен бонус к качеству
  };
}

// ── Районы города ─────────────────────────────────────────────────────────────

export const DISTRICTS: Record<DistrictId, District> = {

  // ── 1. Старый Город — центр, туристы, дорогие рестораны ──────────────────
  old_town: {
    id: 'old_town',
    name: 'Old Town',
    subtitle: 'Исторический центр',
    description:
      'Мощёные улочки, туристы с фотоаппаратами, дорогие кафе и ресторан со звездой Мишлен. '
      + 'Аренда высокая, но клиенты готовы платить.',
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
    flags: {
      hasNightLife: true,
      hasMorningRush: false,
      hasLunchRush: true,
      hasEveningRush: true,
      competitionHigh: true,
    },
  },

  // ── 2. Офисный Район ──────────────────────────────────────────────────────
  office_district: {
    id: 'office_district',
    name: 'Office District',
    subtitle: 'Деловой центр',
    description:
      'Стеклянные башни, люди в костюмах, 30-минутный перерыв на обед. '
      + 'Огромный поток клиентов в обед, тишина по вечерам.',
    color: '#4a7fc1',
    icon: '🏢',
    gridPos: [1, 1],
    neighbors: ['old_town', 'student_area', 'residential_west', 'shopping_center'],
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
    flags: {
      hasNightLife: false,
      hasMorningRush: true,
      hasLunchRush: true,
      hasEveningRush: false,
      competitionHigh: true,
    },
  },

  // ── 3. Студенческий Район ────────────────────────────────────────────────
  student_area: {
    id: 'student_area',
    name: 'Student Area',
    subtitle: 'Студенческий квартал',
    description:
      'Университет, общаги, кальянные и пиццерии за 5€. '
      + 'Клиентов много, платят мало, зато ночью самый живой район.',
    color: '#7a5ea8',
    icon: '🎓',
    gridPos: [0, 1],
    neighbors: ['office_district', 'industrial_zone'],
    unlocked: true,       // ← стартовый район
    unlockLevel: 1,
    demand: {
      peakCustomers: 100,
      priceMultiplier: 0.75,
      patience: 'medium',
      customerMix: { student: 8, worker: 1, hipster: 1 },
    },
    rent: { perTilePerDay: 60, startingTiles: 20 },
    kitchenBonus: { pizza: 1.5, fast_food: 1.3, asian: 1.2 },
    flags: {
      hasNightLife: true,
      hasMorningRush: false,
      hasLunchRush: true,
      hasEveningRush: true,
      competitionHigh: false,
    },
  },

  // ── 4. Жилой Западный ───────────────────────────────────────────────────
  residential_west: {
    id: 'residential_west',
    name: 'Residential West',
    subtitle: 'Спальный район',
    description:
      'Панельные дома, парки, семьи с колясками. '
      + 'Вечером все возвращаются домой — хороший поток после 18:00.',
    color: '#5a9c6a',
    icon: '🏠',
    gridPos: [2, 1],
    neighbors: ['office_district', 'shopping_center'],
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
    flags: {
      hasNightLife: false,
      hasMorningRush: true,
      hasLunchRush: false,
      hasEveningRush: true,
      competitionHigh: false,
    },
  },

  // ── 5. Индустриальная Зона ───────────────────────────────────────────────
  industrial_zone: {
    id: 'industrial_zone',
    name: 'Industrial Zone',
    subtitle: 'Заводской квартал',
    description:
      'Бывшие заводы, часть стала арт-пространством. '
      + 'Рабочие в 6 утра, хипстеры в 10. Аренда самая дешёвая в городе.',
    color: '#8a6040',
    icon: '🏭',
    gridPos: [0, 0],
    neighbors: ['old_town', 'student_area'],
    unlocked: true,       // ← стартовый район (здесь начинается игра)
    unlockLevel: 1,
    demand: {
      peakCustomers: 60,
      priceMultiplier: 0.85,
      patience: 'medium',
      customerMix: { worker: 6, hipster: 2, student: 2 },
    },
    rent: { perTilePerDay: 40, startingTiles: 30 },
    kitchenBonus: { burger: 1.4, fast_food: 1.3, breakfast: 1.5 },
    flags: {
      hasNightLife: false,
      hasMorningRush: true,
      hasLunchRush: true,
      hasEveningRush: false,
      competitionHigh: false,
    },
  },

  // ── 6. Торговый Центр ────────────────────────────────────────────────────
  shopping_center: {
    id: 'shopping_center',
    name: 'Shopping Center',
    subtitle: 'Торговый квартал',
    description:
      'Торговые молы, фастфуд-корты, кинотеатры. '
      + 'Семьи и подростки в выходные — пиковый трафик в субботу.',
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
    flags: {
      hasNightLife: true,
      hasMorningRush: false,
      hasLunchRush: true,
      hasEveningRush: true,
      competitionHigh: true,
    },
  },
};

// ── Вспомогательные функции ───────────────────────────────────────────────────

/** Получить район по ID (бросает ошибку если не найден) */
export function getDistrictById(id: DistrictId): District {
  const d = DISTRICTS[id];
  if (!d) throw new Error(`Unknown district: ${id}`);
  return d;
}

/** Все районы в порядке разблокировки */
export const DISTRICT_LIST = Object.values(DISTRICTS).sort(
  (a, b) => a.unlockLevel - b.unlockLevel,
);

/** Стартовые районы (доступны сразу) */
export const STARTER_DISTRICTS = DISTRICT_LIST.filter((d) => d.unlocked);

/** Получить соседей района */
export function getNeighbors(id: DistrictId): District[] {
  return DISTRICTS[id].neighbors.map((n) => DISTRICTS[n]);
}

/** Рассчитать стоимость аренды за N клеток на D дней */
export function calcRent(id: DistrictId, tiles: number, days: number): number {
  return DISTRICTS[id].rent.perTilePerDay * tiles * days;
}

/** Рассчитать базовый доход от одного клиента */
export function baseRevenuePerCustomer(id: DistrictId, basePrice: number): number {
  return basePrice * DISTRICTS[id].demand.priceMultiplier;
}
