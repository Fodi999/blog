import type { Locale } from '@/lib/i18n';
import tables from '@/data/standards.json';

/* The standards tables of Monge — the same numbers the program builds its library parts by
   (geometry_engine::standards in the Monge repository: every table checked against two sources, edition pinned).
   data/standards.json is written from the program; titles in three languages and units live here. */

export type Family = 'fasteners' | 'bearings' | 'shafts' | 'reinforcement';
export const families: Family[] = ['reinforcement', 'fasteners', 'bearings', 'shafts'];

type Cell = string | number | boolean | null | number[] | string[];

export type StandardTable = {
  id: string;
  slug: string;
  family: Family;
  /** The program's own title (English). */
  title: string;
  edition: string;
  checked: string | null;
  columns: string[];
  rows: Record<string, Cell>[];
  sources: string[];
  /** Library items built by this table. */
  usedBy: string[];
};

export const standards = tables as unknown as StandardTable[];

export function getStandard(slug: string): StandardTable | undefined {
  return standards.find((s) => s.slug === slug);
}

export function standardById(id: string): StandardTable | undefined {
  return standards.find((s) => s.id === id);
}

export const totalRows = standards.reduce((n, s) => n + s.rows.length, 0);

type L10n = Record<Locale, string>;

/** Short titles of the tables. */
export const standardTitles: Record<string, L10n> = {
  'ISO 261': {
    ru: 'Метрическая резьба общего назначения — крупный шаг',
    pl: 'Gwint metryczny ogólnego przeznaczenia — skok zwykły',
    en: 'ISO metric screw threads — coarse pitch',
  },
  'ISO 261 fine': {
    ru: 'Метрическая резьба — мелкие шаги, 3…100 мм',
    pl: 'Gwint metryczny — skoki drobne, 3…100 mm',
    en: 'ISO metric screw threads — fine pitches, 3…100 mm',
  },
  'ISO 2306': {
    ru: 'Свёрла под резьбу с крупным шагом',
    pl: 'Wiertła pod gwint o skoku zwykłym',
    en: 'Tap drills for the coarse thread',
  },
  'ISO 273': {
    ru: 'Отверстия под болты и винты — точный, средний и грубый ряд',
    pl: 'Otwory przejściowe pod śruby — szereg dokładny, średni i zgrubny',
    en: 'Clearance holes for bolts and screws — fine, medium, coarse',
  },
  'ISO 7089': {
    ru: 'Шайбы плоские, нормальный ряд, класс точности A',
    pl: 'Podkładki płaskie, szereg normalny, klasa A',
    en: 'Plain washers, normal series, product grade A',
  },
  'ISO 4017': {
    ru: 'Болты с шестигранной головкой, резьба до головки',
    pl: 'Śruby z łbem sześciokątnym, gwint na całej długości',
    en: 'Hexagon head screws, fully threaded',
  },
  'ISO 4032': {
    ru: 'Гайки шестигранные, тип 1',
    pl: 'Nakrętki sześciokątne, typ 1',
    en: 'Hexagon nuts, style 1',
  },
  'ISO 4762': {
    ru: 'Винты с цилиндрической головкой и шестигранным углублением',
    pl: 'Śruby z łbem walcowym i gniazdem sześciokątnym',
    en: 'Hexagon socket head cap screws',
  },
  'ISO 15': {
    ru: 'Шарикоподшипники радиальные однорядные, серии 60, 62, 63 — основные размеры',
    pl: 'Łożyska kulkowe zwykłe jednorzędowe, serie 60, 62, 63 — wymiary główne',
    en: 'Deep groove ball bearings, series 60, 62, 63 — boundary dimensions',
  },
  'DIN 5418': {
    ru: 'Монтажные размеры подшипников: заплечики вала и корпуса, радиус галтели',
    pl: 'Wymiary montażowe łożysk: odsadzenia wału i oprawy, promień',
    en: 'Mounting dimensions of bearings: shaft and housing shoulders, fillet',
  },
  'ISO 492': {
    ru: 'Допуски радиальных подшипников нормального класса',
    pl: 'Tolerancje łożysk poprzecznych klasy normalnej',
    en: 'Tolerances of radial bearings, Normal class',
  },
  'DIN 981': {
    ru: 'Гайки шлицевые KM0…KM20',
    pl: 'Nakrętki łożyskowe KM0…KM20',
    en: 'Bearing lock nuts KM0…KM20',
  },
  'DIN 5406': {
    ru: 'Шайбы стопорные многолапчатые MB0…MB20',
    pl: 'Podkładki zabezpieczające MB0…MB20',
    en: 'Tab washers MB0…MB20',
  },
  'ISO 286': {
    ru: 'Допуски и посадки: квалитеты IT5…IT11 и основные отклонения',
    pl: 'Tolerancje i pasowania: klasy IT5…IT11 i odchyłki podstawowe',
    en: 'Limits and fits: grades IT5…IT11 and fundamental deviations',
  },
  'DIN 471': {
    ru: 'Кольца стопорные для валов — канавки, 3…100 мм',
    pl: 'Pierścienie osadcze na wałki — rowki, 3…100 mm',
    en: 'Retaining rings for shafts — grooves, 3…100 mm',
  },
  'DIN 509': {
    ru: 'Канавки для выхода шлифовального круга, формы E и F',
    pl: 'Podcięcia obróbkowe, formy E i F',
    en: 'Undercuts, forms E and F',
  },
  'DIN 6885': {
    ru: 'Шпонки призматические и пазы, высокая форма',
    pl: 'Wpusty pryzmatyczne i rowki, forma wysoka',
    en: 'Parallel keys and keyways, high form',
  },
  'EN 10080': {
    ru: 'Арматура периодического профиля Ø6…50 — площадь сечения и масса метра',
    pl: 'Pręty żebrowane Ø6…50 — pole przekroju i masa metra',
    en: 'Ribbed reinforcing bars Ø6…50 — area and mass per metre',
  },
  'EN 10080 ribs': {
    ru: 'Геометрия рёбер периодического профиля и наименьшая площадь смятия fR',
    pl: 'Geometria żeber prętów i najmniejsze względne pole żeber fR',
    en: 'Rib geometry of ribbed bars and the least relative rib area fR',
  },
  'EN 1992-1-1 C.1': {
    ru: 'Классы арматурной стали B500A, B500B, B500C (Еврокод 2, приложение C)',
    pl: 'Klasy stali zbrojeniowej B500A, B500B, B500C (Eurokod 2, załącznik C)',
    en: 'Classes of reinforcing steel B500A, B500B, B500C (Eurocode 2, Annex C)',
  },
  'EN 1992-1-1 8.1N': {
    ru: 'Наименьший диаметр оправки при гибке стержней (таблица 8.1N)',
    pl: 'Najmniejsza średnica trzpienia przy gięciu prętów (tablica 8.1N)',
    en: 'Minimum mandrel diameter for bent bars (Table 8.1N)',
  },
  'EN 1992-1-1 8.5': {
    ru: 'Анкеровка хомутов — прямой конец после загиба (рисунок 8.5)',
    pl: 'Zakotwienie strzemion — prosty koniec za odgięciem (rysunek 8.5)',
    en: 'Anchorage of links — the straight end after the bend (Figure 8.5)',
  },
};

export function standardTitle(s: StandardTable, locale: Locale): string {
  return standardTitles[s.id]?.[locale] ?? s.title;
}

/** Units of the values: millimetres unless a table or a column says otherwise. */
const tableUnit: Record<string, string> = { 'ISO 286': 'µm', 'ISO 492': 'µm' };
const columnUnit: Record<string, Record<string, string>> = {
  'EN 10080': { d: 'mm', area: 'mm²', mass: 'kg/m' },
  'EN 1992-1-1 C.1': { fyk: 'MPa', euk: '%', euk_below_8: '%' },
  'DIN 981': { mass_g: 'g' },
  'ISO 286': { d_to: 'mm' },
  'ISO 492': { over: 'mm', to: 'mm' },
};
const unitless = new Set(['size', 'name', 'metric', 'grade', 'class', 'ring', 'what', 'unit', 'bars', 'mandrel', 'bend', 'end', 'preferred', 'fabric_only', 'source', 'second', 'choice', 'series', 'l_from', 'tabs', 'k_min', 'k_max', 'k_min_below_8', 'lengths']);

export function unitOf(s: StandardTable, column: string): string {
  if (columnUnit[s.id]?.[column]) return columnUnit[s.id][column];
  if (unitless.has(column) || s.id === 'EN 10080 ribs') return '';
  return tableUnit[s.id] ?? 'mm';
}

/** Column heads as written in the standards: e_min_a → e min (A), dw_min_b → dw min (B). */
export function columnLabel(column: string): string {
  const named: Record<string, string> = {
    size: '', name: '', metric: 'M', tap_drill: 'Ø', d_to: '≤ d', d_from: '> d', mass_g: 'm', fabric_only: 'mesh', l_from: 'l', mass: 'm/l', area: 'As',
  };
  if (column in named) return named[column];
  return column
    .replace(/_min_(a|b)$/, (_, g: string) => ` min (${g.toUpperCase()})`)
    .replace(/_below_8$/, ' (< 8)')
    .replace(/_min$/, ' min')
    .replace(/_max$/, ' max')
    .replace(/_tol$/, ' ±')
    .replace(/_/g, ' ');
}

/** Columns whose pair of numbers is a range of diameters (DIN 509: the shafts an undercut is for). */
const rangeColumns = new Set(['normal', 'fatigue']);

export function formatCell(locale: Locale, v: Cell, column = ''): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? '✓' : '—';
  if (typeof v === 'number') return new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(v);
  if (Array.isArray(v)) {
    if (rangeColumns.has(column) && v.length === 2 && v.every((x) => typeof x === 'number')) return `${formatCell(locale, v[0])}…${formatCell(locale, v[1])}`;
    return v.map((x) => formatCell(locale, x as Cell)).join(', ');
  }
  return String(v);
}
