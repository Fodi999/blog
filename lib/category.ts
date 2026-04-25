/**
 * Category emoji map — mirrors StockViewModel.categoryEmoji from iOS,
 * so web/iOS speak the same visual language. Backend returns
 * lowercased English category slugs; unknown → generic 🍽️.
 */
const MAP: Record<string, string> = {
  meat: '🥩',
  poultry: '🍗',
  fish: '🐟',
  seafood: '🦐',
  dairy: '🥛',
  cheese: '🧀',
  eggs: '🥚',
  vegetables: '🥕',
  fruits: '🍎',
  herbs: '🌿',
  spices: '🌶️',
  grains: '🌾',
  pasta: '🍝',
  rice: '🍚',
  bread: '🍞',
  bakery: '🥐',
  oils: '🫒',
  sauces: '🥫',
  condiments: '🧂',
  legumes: '🫘',
  nuts: '🥜',
  sweets: '🍬',
  beverages: '🥤',
  alcohol: '🍷',
  frozen: '🧊',
  canned: '🥫',
  other: '🍽️',
};

export function categoryEmoji(category: string | null | undefined): string {
  if (!category) return '🍽️';
  const key = category.trim().toLowerCase();
  return MAP[key] ?? '🍽️';
}

export function categoryLabel(category: string | null | undefined): string {
  if (!category) return '—';
  const k = category.trim();
  if (!k) return '—';
  return k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();
}
