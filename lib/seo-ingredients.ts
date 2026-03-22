/**
 * SEO-локализация ингредиентов.
 *
 * Архитектура:
 *   Frontend = основной генератор (locale-specific формулы)
 *   Backend seo_title/seo_description = EN-only override (не трогает PL/RU/UK)
 *   Backend seo_title_pl / seo_description_pl = ручной override при наличии
 *
 * НЕ перевод — каждый язык использует местные поисковые паттерны.
 * Формулы подобраны под реальный спрос Google PL / RU / UK / EN.
 *
 * Применяется в:
 *   - /ingredients/[slug]   (профиль ингредиента)
 *   - /nutrition/[slug]     (нутрициология)
 *   - /how-many/[...query]  (конвертации объём → граммы)
 *   - /converter/[conv]     (конвертер)
 */

import type { ApiIngredient } from '@/lib/api';

type Locale = 'en' | 'pl' | 'ru' | 'uk';

/** Калории округляем до целого для чистоты заголовка */
function kcal(v: number | null | undefined): string {
  if (v == null) return '?';
  return Math.round(v).toString();
}

function g(v: number | null | undefined): string {
  if (v == null) return '?';
  return (Math.round(v * 10) / 10).toString();
}

/** Локализованное имя с фолбэком на английский */
export function localeName(item: ApiIngredient, locale: string): string {
  if (locale === 'pl' && item.name_pl) return item.name_pl;
  if (locale === 'ru' && item.name_ru) return item.name_ru;
  if (locale === 'uk' && item.name_uk) return item.name_uk;
  return item.name_en ?? item.name;
}

/** Флаг "высокобелковый" для динамичных тайтлов */
function isHighProtein(item: ApiIngredient): boolean {
  const p = item.macros_full?.protein_g ?? item.protein;
  return p != null && p >= 15;
}

/** Флаг "низкокалорийный" */
function isLowCal(item: ApiIngredient): boolean {
  return item.calories != null && item.calories < 60;
}

/** Первый активный диетический флаг для subtitle */
function dietTag(item: ApiIngredient, locale: Locale): string | null {
  const flags = item.diet_flags;
  if (!flags) return null;
  if (flags.vegan) {
    return { en: 'vegan', pl: 'wegański', ru: 'веганский', uk: 'веганський' }[locale];
  }
  if (flags.keto) return 'keto';
  if (flags.gluten_free) {
    return { en: 'gluten-free', pl: 'bezglutenowy', ru: 'без глютена', uk: 'без глютену' }[locale];
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// INGREDIENT PAGE SEO
// /chef-tools/ingredients/[slug]
// ─────────────────────────────────────────────────────────────────────────────

export function generateIngredientSEO(
  item: ApiIngredient,
  locale: string,
): { title: string; description: string } {
  // Locale-specific backend override: seo_title_pl / seo_description_pl etc.
  const localeTitle = (item as Record<string, unknown>)[`seo_title_${locale}`] as string | undefined;
  const localeDesc  = (item as Record<string, unknown>)[`seo_description_${locale}`] as string | undefined;
  if (localeTitle) {
    return {
      title: localeTitle.replace(/\s*\|[^|]*$/, '').trim(),
      description: localeDesc ?? buildIngredientDesc(item, locale as Locale),
    };
  }

  // EN-only backend override — strip any "| site-name" suffix baked in by backend
  if (locale === 'en' && item.seo_title) {
    const cleanTitle = item.seo_title.replace(/\s*\|[^|]*$/, '').trim();
    return {
      title: cleanTitle,
      description: item.seo_description ?? buildIngredientDesc(item, 'en'),
    };
  }

  const l = locale as Locale;
  const name = localeName(item, locale);
  const cal = kcal(item.calories);
  const prot = g(item.macros_full?.protein_g ?? item.protein);
  const fat = g(item.macros_full?.fat_g ?? item.fat);
  const carbs = g(item.macros_full?.carbs_g ?? item.carbs);
  const tag = dietTag(item, l);
  const highP = isHighProtein(item);
  const lowC = isLowCal(item);

  const title = buildIngredientTitle(name, cal, tag, highP, lowC, l);
  const description = buildIngredientDesc(item, l);

  return { title, description };
}

function buildIngredientTitle(
  name: string,
  cal: string,
  tag: string | null,
  highP: boolean,
  lowC: boolean,
  locale: Locale,
): string {
  switch (locale) {
    case 'pl': {
      // "Morela — kalorie, witaminy i wartości odżywcze"
      // "Łosoś — kalorie, białko i właściwości (keto)"
      const suffix = tag ? ` (${tag})` : highP ? ' — źródło białka' : lowC ? ' — mało kalorii' : '';
      return `${name} — kalorie, witaminy i wartości odżywcze${suffix}`;
    }
    case 'ru': {
      const suffix = tag ? ` (${tag})` : highP ? ' — источник белка' : lowC ? ' — низкокалорийный' : '';
      return `${name} — калории, витамины и пищевая ценность${suffix}`;
    }
    case 'uk': {
      const suffix = tag ? ` (${tag})` : highP ? ' — джерело білка' : lowC ? ' — низькокалорійний' : '';
      return `${name} — калорії, вітаміни та харчова цінність${suffix}`;
    }
    default: {
      // EN
      const suffix = tag ? ` (${tag})` : highP ? ' — high protein' : lowC ? ' — low calorie' : '';
      return `${name} — Calories, Vitamins & Nutrition Facts${suffix}`;
    }
  }
}

function buildIngredientDesc(item: ApiIngredient, locale: Locale): string {
  const name = localeName(item, locale);
  const cal = kcal(item.calories);
  const prot = g(item.macros_full?.protein_g ?? item.protein);
  const fat  = g(item.macros_full?.fat_g  ?? item.fat);
  const carbs = g(item.macros_full?.carbs_g ?? item.carbs);
  const cupG = item.measures?.grams_per_cup;
  const cup = cupG != null ? Math.round(cupG) : null;

  switch (locale) {
    case 'pl':
      // "Morela: 48 kcal na 100 g. Białko 1 g · Tłuszcz 0 g · Węglowodany 11 g.
      //  Ile gramów w szklance moreli? Wartości odżywcze i właściwości."
      return (
        `${name}: ${cal} kcal na 100 g. ` +
        `Białko ${prot} g · Tłuszcz ${fat} g · Węglowodany ${carbs} g. ` +
        (cup != null ? `1 szklanka ${name.toLowerCase()} = ${cup} g. ` : '') +
        `Wartości odżywcze, witaminy i właściwości ${name.toLowerCase()}.`
      );
    case 'ru':
      return (
        `${name}: ${cal} ккал на 100 г. ` +
        `Белки ${prot} г · Жиры ${fat} г · Углеводы ${carbs} г. ` +
        (cup != null ? `1 стакан ${name.toLowerCase()} = ${cup} г. ` : '') +
        `Пищевая ценность, витамины и свойства ${name.toLowerCase()}.`
      );
    case 'uk':
      return (
        `${name}: ${cal} ккал на 100 г. ` +
        `Білки ${prot} г · Жири ${fat} г · Вуглеводи ${carbs} г. ` +
        (cup != null ? `1 склянка ${name.toLowerCase()} = ${cup} г. ` : '') +
        `Харчова цінність, вітаміни та властивості ${name.toLowerCase()}.`
      );
    default:
      return (
        `${name}: ${cal} kcal per 100g. ` +
        `Protein ${prot}g · Fat ${fat}g · Carbs ${carbs}g. ` +
        (cup != null ? `1 cup of ${name.toLowerCase()} = ${cup}g. ` : '') +
        `Nutrition facts, vitamins and health properties of ${name.toLowerCase()}.`
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NUTRITION PAGE SEO
// /chef-tools/nutrition/[slug]
// ─────────────────────────────────────────────────────────────────────────────

export function generateNutritionSEO(
  item: ApiIngredient,
  locale: string,
): { title: string; description: string } {
  const l = locale as Locale;
  const name = localeName(item, locale);
  const cal = kcal(item.calories);
  const prot = g(item.macros_full?.protein_g ?? item.protein);
  const fat  = g(item.macros_full?.fat_g  ?? item.fat);
  const carbs = g(item.macros_full?.carbs_g ?? item.carbs);
  const highP = isHighProtein(item);
  const lowC  = isLowCal(item);

  switch (l) {
    case 'pl':
      return {
        title: `${name} — wartości odżywcze na 100 g (${cal} kcal)`,
        description:
          `${name} zawiera ${cal} kcal, białko ${prot} g, tłuszcz ${fat} g, węglowodany ${carbs} g na 100 g. ` +
          (highP ? `Bogaty w białko. ` : lowC ? `Niskokaloryczny. ` : '') +
          `Pełna tabela witamin i minerałów.`,
      };
    case 'ru':
      return {
        title: `${name} — пищевая ценность на 100 г (${cal} ккал)`,
        description:
          `${name}: ${cal} ккал, белки ${prot} г, жиры ${fat} г, углеводы ${carbs} г на 100 г. ` +
          (highP ? `Высокобелковый продукт. ` : lowC ? `Низкокалорийный. ` : '') +
          `Полная таблица витаминов и минералов.`,
      };
    case 'uk':
      return {
        title: `${name} — харчова цінність на 100 г (${cal} ккал)`,
        description:
          `${name}: ${cal} ккал, білки ${prot} г, жири ${fat} г, вуглеводи ${carbs} г на 100 г. ` +
          (highP ? `Джерело білка. ` : lowC ? `Низькокалорійний. ` : '') +
          `Повна таблиця вітамінів та мінералів.`,
      };
    default:
      return {
        title: `${name} — Nutrition Facts per 100g (${cal} kcal)`,
        description:
          `${name}: ${cal} kcal, protein ${prot}g, fat ${fat}g, carbs ${carbs}g per 100g. ` +
          (highP ? `High-protein food. ` : lowC ? `Low-calorie. ` : '') +
          `Full vitamins and minerals table.`,
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HOW-MANY PAGE SEO
// /chef-tools/how-many/how-many-{unit}-in-a-{measure}-of-{slug}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Unit labels per locale — search-pattern tuned (not literal translation).
 * e.g. Polish Google: "ile gramów w szklance" not "ile gramów w cup"
 */
const UNIT_LABELS_SEO: Record<Locale, Record<string, string>> = {
  en: { cup: 'cup', tbsp: 'tablespoon', tsp: 'teaspoon', g: 'gram', kg: 'kg', oz: 'oz', lb: 'lb', ml: 'ml' },
  pl: { cup: 'szklance', tbsp: 'łyżce', tsp: 'łyżeczce', g: 'gram', kg: 'kg', oz: 'uncji', lb: 'funcie', ml: 'ml' },
  ru: { cup: 'стакане', tbsp: 'столовой ложке', tsp: 'чайной ложке', g: 'грамм', kg: 'кг', oz: 'унции', lb: 'фунте', ml: 'мл' },
  uk: { cup: 'склянці', tbsp: 'столовій ложці', tsp: 'чайній ложці', g: 'грам', kg: 'кг', oz: 'унції', lb: 'фунті', ml: 'мл' },
};

const UNIT_LABELS_RESULT: Record<Locale, Record<string, string>> = {
  en: { cup: 'cup', tbsp: 'tbsp', tsp: 'tsp', g: 'grams', kg: 'kg', oz: 'oz', lb: 'lb', ml: 'ml' },
  pl: { cup: 'szklanka', tbsp: 'łyżka', tsp: 'łyżeczka', g: 'gramów', kg: 'kg', oz: 'uncji', lb: 'funtów', ml: 'ml' },
  ru: { cup: 'стакан', tbsp: 'ст.л.', tsp: 'ч.л.', g: 'граммов', kg: 'кг', oz: 'унций', lb: 'фунтов', ml: 'мл' },
  uk: { cup: 'склянка', tbsp: 'ст.л.', tsp: 'ч.л.', g: 'грамів', kg: 'кг', oz: 'унцій', lb: 'фунтів', ml: 'мл' },
};

function lblIn(unit: string, locale: Locale): string {
  return UNIT_LABELS_SEO[locale]?.[unit] ?? unit;
}
function lblResult(unit: string, locale: Locale): string {
  return UNIT_LABELS_RESULT[locale]?.[unit] ?? unit;
}

export function generateHowManySEO(
  name: string,
  fromApi: string,  // measure: cup, tbsp, tsp, oz, ...
  toApi: string,    // unit: g, oz, cups, ml, ...
  result: number,
  locale: string,
): { title: string; description: string } {
  const l = locale as Locale;
  const r = result % 1 === 0 ? result.toFixed(0) : result.toFixed(1);
  const inLbl = lblIn(fromApi, l);
  const resLbl = lblResult(toApi, l);

  switch (l) {
    case 'pl':
      return {
        // "Ile gramów w 1 szklance mąki? — 125 gramów"
        title: `Ile ${resLbl} w 1 ${inLbl} ${name}? — ${r} ${resLbl}`,
        description:
          `1 ${inLbl} ${name} = ${r} ${resLbl}. ` +
          `Przelicznik oparty na rzeczywistej gęstości produktu. ` +
          `Sprawdź też wartości odżywcze i kalorie ${name.toLowerCase()} na 100 g.`,
      };
    case 'ru':
      return {
        // "Сколько граммов в 1 стакане муки? — 125 граммов"
        title: `Сколько ${resLbl} в 1 ${inLbl} ${name}? — ${r} ${resLbl}`,
        description:
          `1 ${inLbl} ${name} = ${r} ${resLbl}. ` +
          `Конвертация на основе реальной плотности продукта. ` +
          `Калорийность и пищевая ценность ${name.toLowerCase()} на 100 г.`,
      };
    case 'uk':
      return {
        title: `Скільки ${resLbl} в 1 ${inLbl} ${name}? — ${r} ${resLbl}`,
        description:
          `1 ${inLbl} ${name} = ${r} ${resLbl}. ` +
          `Конвертація на основі реальної щільності продукту. ` +
          `Калорійність і харчова цінність ${name.toLowerCase()} на 100 г.`,
      };
    default:
      return {
        // "How many grams in 1 cup of flour? — 125 grams"
        title: `How many ${resLbl} in 1 ${fromApi} of ${name}? — ${r} ${resLbl}`,
        description:
          `1 ${fromApi} of ${name} = ${r} ${resLbl}. ` +
          `Conversion based on the actual density of ${name.toLowerCase()}. ` +
          `Check ${name.toLowerCase()} calories and nutrition facts per 100g.`,
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERTER PAGE SEO
// /chef-tools/converter/[conversion]
// ─────────────────────────────────────────────────────────────────────────────

/** Called when CONVERSION_MAP doesn't have a locale-specific description */
export function generateConverterSEO(
  fromEn: string,   // e.g. "cup"
  toEn: string,     // e.g. "grams"
  example: { name: string; result: number } | null,
  locale: string,
): { title: string; description: string } {
  const l = locale as Locale;
  const from = lblIn(fromEn, l);
  const to   = lblResult(toEn, l);
  const r    = example ? (example.result % 1 === 0 ? example.result.toFixed(0) : example.result.toFixed(1)) : null;

  switch (l) {
    case 'pl':
      return {
        title: `Przelicznik: ${from} na ${to}` + (r && example ? ` — 1 ${from} ${example.name} = ${r} ${to}` : ''),
        description:
          `Szybki przelicznik ${from} na ${to} dla mąki, cukru, masła i innych składników. ` +
          (r && example ? `1 ${from} ${example.name} = ${r} ${to}. ` : '') +
          `Przeliczenia oparte na rzeczywistej gęstości produktu.`,
      };
    case 'ru':
      return {
        title: `Конвертер: ${from} в ${to}` + (r && example ? ` — 1 ${from} ${example.name} = ${r} ${to}` : ''),
        description:
          `Конвертер ${from} в ${to} для муки, сахара, масла и других ингредиентов. ` +
          (r && example ? `1 ${from} ${example.name} = ${r} ${to}. ` : '') +
          `Конвертация на основе плотности продукта.`,
      };
    case 'uk':
      return {
        title: `Конвертер: ${from} в ${to}` + (r && example ? ` — 1 ${from} ${example.name} = ${r} ${to}` : ''),
        description:
          `Конвертер ${from} у ${to} для борошна, цукру, масла та інших інгредієнтів. ` +
          (r && example ? `1 ${from} ${example.name} = ${r} ${to}. ` : '') +
          `Конвертація на основі щільності продукту.`,
      };
    default:
      return {
        title: `Convert ${fromEn} to ${toEn}` + (r && example ? ` — 1 ${fromEn} of ${example.name} = ${r} ${toEn}` : ''),
        description:
          `Convert ${fromEn} to ${toEn} for flour, sugar, butter and more. ` +
          (r && example ? `1 ${fromEn} of ${example.name} = ${r} ${toEn}. ` : '') +
          `Results based on actual ingredient density.`,
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DIET PAGE SEO
// /chef-tools/diet/[flag]
// ─────────────────────────────────────────────────────────────────────────────

const DIET_NAMES: Record<string, Record<Locale, string>> = {
  vegan:         { en: 'Vegan',         pl: 'Wegańskie',        ru: 'Веганские',         uk: 'Веганські' },
  vegetarian:    { en: 'Vegetarian',    pl: 'Wegetariańskie',   ru: 'Вегетарианские',    uk: 'Вегетаріанські' },
  keto:          { en: 'Keto',          pl: 'Keto',             ru: 'Кето',              uk: 'Кето' },
  paleo:         { en: 'Paleo',         pl: 'Paleo',            ru: 'Палео',             uk: 'Палео' },
  'gluten-free': { en: 'Gluten-Free',   pl: 'Bezglutenowe',    ru: 'Без глютена',       uk: 'Без глютену' },
  mediterranean: { en: 'Mediterranean', pl: 'Śródziemnomorskie',ru: 'Средиземноморские', uk: 'Середземноморські' },
  'low-carb':    { en: 'Low-Carb',      pl: 'Niskowęglowodanowe',ru: 'Низкоуглеводные', uk: 'Низьковуглеводні' },
};

export function generateDietSEO(
  flag: string,
  total: number,
  locale: string,
): { title: string; description: string } {
  const l = locale as Locale;
  const diet = DIET_NAMES[flag]?.[l] ?? flag;

  switch (l) {
    case 'pl':
      return {
        title: `${diet} produkty — lista ${total} składników`,
        description: `${total} produktów ${diet.toLowerCase()} z kaloriami, białkiem i wartościami odżywczymi. Sprawdź pełną listę składników odpowiednich dla diety ${diet.toLowerCase()}.`,
      };
    case 'ru':
      return {
        title: `${diet} продукты — список из ${total} ингредиентов`,
        description: `${total} ${diet.toLowerCase()} продуктов с калориями, белками и пищевой ценностью. Полный список ингредиентов для ${diet.toLowerCase()} диеты.`,
      };
    case 'uk':
      return {
        title: `${diet} продукти — список з ${total} інгредієнтів`,
        description: `${total} ${diet.toLowerCase()} продуктів з калоріями, білками та харчовою цінністю. Повний список інгредієнтів для ${diet.toLowerCase()} дієти.`,
      };
    default:
      return {
        title: `${diet} Foods — ${total} Ingredients List`,
        description: `${total} ${diet.toLowerCase()} foods with calories, protein, and nutrition facts. Complete list of ${diet.toLowerCase()} diet ingredients.`,
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RANKING PAGE SEO
// /chef-tools/ranking/[metric]
// ─────────────────────────────────────────────────────────────────────────────

/* Nominative (именительный) — for titles: "Топ продуктов: Белок" */
const METRIC_NAMES: Record<string, Record<Locale, string>> = {
  calories:      { en: 'Calories',     pl: 'Kalorie',       ru: 'Калории',       uk: 'Калорії' },
  protein:       { en: 'Protein',      pl: 'Białko',        ru: 'Белок',         uk: 'Білок' },
  fat:           { en: 'Fat',          pl: 'Tłuszcz',       ru: 'Жиры',          uk: 'Жири' },
  carbs:         { en: 'Carbohydrates',pl: 'Węglowodany',   ru: 'Углеводы',      uk: 'Вуглеводи' },
  fiber:         { en: 'Fiber',        pl: 'Błonnik',       ru: 'Клетчатка',     uk: 'Клітковина' },
  sugar:         { en: 'Sugar',        pl: 'Cukier',        ru: 'Сахар',         uk: 'Цукор' },
  'vitamin-c':   { en: 'Vitamin C',    pl: 'Witamina C',    ru: 'Витамин C',     uk: 'Вітамін C' },
  'vitamin-d':   { en: 'Vitamin D',    pl: 'Witamina D',    ru: 'Витамин D',     uk: 'Вітамін D' },
  'vitamin-b12': { en: 'Vitamin B12',  pl: 'Witamina B12',  ru: 'Витамин B12',   uk: 'Вітамін B12' },
  iron:          { en: 'Iron',         pl: 'Żelazo',        ru: 'Железо',        uk: 'Залізо' },
  calcium:       { en: 'Calcium',      pl: 'Wapń',          ru: 'Кальций',       uk: 'Кальцій' },
  potassium:     { en: 'Potassium',    pl: 'Potas',         ru: 'Калий',         uk: 'Калій' },
  magnesium:     { en: 'Magnesium',    pl: 'Magnez',        ru: 'Магний',        uk: 'Магній' },
  zinc:          { en: 'Zinc',         pl: 'Cynk',          ru: 'Цинк',          uk: 'Цинк' },
  sodium:        { en: 'Sodium',       pl: 'Sód',           ru: 'Натрий',        uk: 'Натрій' },
};

/* Genitive (родительный / dopełniacz) — for descriptions: "по содержанию белка" */
const METRIC_GENITIVE: Record<string, Record<Locale, string>> = {
  calories:      { en: 'calories',      pl: 'kalorii',        ru: 'калорий',        uk: 'калорій' },
  protein:       { en: 'protein',       pl: 'białka',         ru: 'белка',          uk: 'білка' },
  fat:           { en: 'fat',           pl: 'tłuszczu',       ru: 'жиров',          uk: 'жирів' },
  carbs:         { en: 'carbohydrates', pl: 'węglowodanów',   ru: 'углеводов',      uk: 'вуглеводів' },
  fiber:         { en: 'fiber',         pl: 'błonnika',       ru: 'клетчатки',      uk: 'клітковини' },
  sugar:         { en: 'sugar',         pl: 'cukru',          ru: 'сахара',         uk: 'цукру' },
  'vitamin-c':   { en: 'vitamin C',     pl: 'witaminy C',     ru: 'витамина C',     uk: 'вітаміну C' },
  'vitamin-d':   { en: 'vitamin D',     pl: 'witaminy D',     ru: 'витамина D',     uk: 'вітаміну D' },
  'vitamin-b12': { en: 'vitamin B12',   pl: 'witaminy B12',   ru: 'витамина B12',   uk: 'вітаміну B12' },
  iron:          { en: 'iron',          pl: 'żelaza',         ru: 'железа',         uk: 'заліза' },
  calcium:       { en: 'calcium',       pl: 'wapnia',         ru: 'кальция',        uk: 'кальцію' },
  potassium:     { en: 'potassium',     pl: 'potasu',         ru: 'калия',          uk: 'калію' },
  magnesium:     { en: 'magnesium',     pl: 'magnezu',        ru: 'магния',         uk: 'магнію' },
  zinc:          { en: 'zinc',          pl: 'cynku',          ru: 'цинка',          uk: 'цинку' },
  sodium:        { en: 'sodium',        pl: 'sodu',           ru: 'натрия',         uk: 'натрію' },
};

export function generateRankingSEO(
  metric: string,
  unit: string,
  total: number,
  locale: string,
): { title: string; description: string } {
  const l = locale as Locale;
  const name = METRIC_NAMES[metric]?.[l] ?? metric;
  const gen  = METRIC_GENITIVE[metric]?.[l] ?? name.toLowerCase();

  switch (l) {
    case 'pl':
      return {
        title: `Top ${total} produktów z najwyższą zawartością ${gen}`,
        description: `Ranking ${total} produktów spożywczych według zawartości ${gen} (${unit} na 100 g). Porównaj wartości odżywcze i znajdź najlepsze źródła ${gen}.`,
      };
    case 'ru':
      return {
        title: `Топ ${total} продуктов с высоким содержанием ${gen}`,
        description: `Рейтинг ${total} продуктов по содержанию ${gen} (${unit} на 100 г). Сравни пищевую ценность и найди лучшие источники ${gen}.`,
      };
    case 'uk':
      return {
        title: `Топ ${total} продуктів з високим вмістом ${gen}`,
        description: `Рейтинг ${total} продуктів за вмістом ${gen} (${unit} на 100 г). Порівняй харчову цінність і знайди найкращі джерела ${gen}.`,
      };
    default:
      return {
        title: `Top ${total} Foods Highest in ${name}`,
        description: `Ranking of ${total} foods by ${gen} content (${unit} per 100g). Compare nutrition facts and find the best sources of ${gen}.`,
      };
  }
}
