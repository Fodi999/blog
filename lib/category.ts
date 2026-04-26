/**
 * Category emoji map — mirrors `StockViewModel.categoryEmoji` from iOS,
 * so web/iOS speak the same visual language.
 *
 * Backend returns category names *already localized* (RU/PL/UK/EN), so a
 * plain English-key lookup misses real-world data ("Овощи", "Warzywa",
 * "Молочные продукты и яйца"). We fuzzy-match keywords across all 4
 * languages, exactly like the Swift implementation.
 */

type Rule = { emoji: string; keywords: string[] };

// Order matters — first match wins. Specific buckets (poultry, eggs) come
// before generic ones (meat, dairy) because backend often combines them
// in one category name like "Мясо и птица" / "Молочные продукты и яйца".
const RULES: Rule[] = [
  // Poultry — before "meat".
  { emoji: '🍗', keywords: ['poultry', 'птиц', 'kurcz', 'drób', 'птах', 'курка'] },

  // Eggs — before "dairy".
  { emoji: '🥚', keywords: ['egg', 'яйц', 'jajk', 'яєц', 'яєчн'] },

  // Fish & seafood
  { emoji: '🐟', keywords: ['fish', 'seafood', 'рыб', 'риб', 'ryb', 'мореп', 'morz'] },

  // Meat (after poultry / fish)
  { emoji: '�', keywords: ['meat', 'мяс', "м'яс", 'мʼяс', 'mięs'] },

  // Dairy & cheese (after eggs)
  { emoji: '🧀', keywords: ['cheese', 'сыр', 'сир', 'ser '] },
  { emoji: '🥛', keywords: ['dairy', 'milk', 'молоч', 'молок', 'nabiał', 'mlek'] },

  // Vegetables
  { emoji: '�', keywords: ['vegetab', 'овощ', 'овоч', 'warzyw'] },

  // Fruits & berries
  { emoji: '🍎', keywords: ['fruit', 'berry', 'фрукт', 'ягод', 'owoc', 'jagod'] },

  // Herbs & spices
  { emoji: '🌿', keywords: ['herb', 'зелен', 'zioł'] },
  { emoji: '🌶️', keywords: ['spice', 'спец', 'прян', 'przypr'] },

  // Grains, pasta, bread, bakery
  { emoji: '�', keywords: ['bread', 'bakery', 'хлеб', 'хліб', 'pieczyw', 'piek'] },
  { emoji: '🍝', keywords: ['pasta', 'паст', 'макарон', 'makaron'] },
  { emoji: '�', keywords: ['rice', 'рис', 'ryż'] },
  { emoji: '�', keywords: ['grain', 'cereal', 'круп', 'zboż', 'kasza'] },
  { emoji: '🥐', keywords: ['baking', 'выпечк', 'випічк', 'wypiek'] },

  // Oils & fats
  { emoji: '🫒', keywords: ['oil', 'fat', 'масл', 'жир', 'олі', 'olej', 'tłuszcz'] },

  // Sauces, condiments, salt
  { emoji: '🧂', keywords: ['salt', 'соль', 'сіль', 'sól'] },
  { emoji: '🥫', keywords: ['sauce', 'condim', 'соус', 'припр', 'sos', 'przyp'] },
  { emoji: '�', keywords: ['canned', 'preserv', 'консерв', 'konserw'] },

  // Sweets, baking goods, sugar
  { emoji: '🍰', keywords: ['sweet', 'sugar', 'сладк', 'солодк', 'cukier', 'słodycz'] },

  // Drinks
  { emoji: '🥤', keywords: ['beverage', 'drink', 'напит', 'напо', 'напій', 'napój', 'napoj'] },
  { emoji: '🍷', keywords: ['alcohol', 'wine', 'алког', 'вино', 'alkohol'] },

  // Nuts & seeds
  { emoji: '🥜', keywords: ['nut', 'seed', 'орех', 'горіх', 'orzech', 'насін'] },

  // Legumes
  { emoji: '�', keywords: ['legume', 'bean', 'бобов', 'квасол', 'strączk', 'fasola'] },

  // Frozen
  { emoji: '�', keywords: ['frozen', 'заморож', 'mrożon'] },
];

const FALLBACK = '🍽️';

export function categoryEmoji(category: string | null | undefined): string {
  if (!category) return FALLBACK;
  const lower = category.toLowerCase();
  for (const r of RULES) {
    if (r.keywords.some((k) => lower.includes(k))) return r.emoji;
  }
  return FALLBACK;
}

/**
 * Best-effort label: backend already returns localized names, so just trim
 * and capitalize the first letter. Don't lowercase the tail — RU/UK/PL
 * names often keep proper case ("Молочные продукты и яйца").
 */
export function categoryLabel(category: string | null | undefined): string {
  if (!category) return '—';
  const k = category.trim();
  if (!k) return '—';
  return k.charAt(0).toUpperCase() + k.slice(1);
}

