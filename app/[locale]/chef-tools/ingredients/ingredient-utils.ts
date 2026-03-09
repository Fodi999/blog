/**
 * Pure utility functions for ingredient category resolution.
 * No 'use client' directive — safe to import from both server and client components.
 */

export const CATEGORY_ORDER = [
  'fish', 'meat', 'vegetables', 'fruits', 'dairy', 'grains',
  'legumes', 'nuts', 'oils', 'sauces', 'spices', 'preserved',
  'drinks', 'sweets', 'other',
] as const;

// Slug → category mapping (last-resort fallback only)
const SLUG_CATEGORY: Record<string, string> = {
  // Fish & Seafood
  salmon: 'fish', tuna: 'fish', cod: 'fish', herring: 'fish', mackerel: 'fish',
  trout: 'fish', carp: 'fish', pike: 'fish', shrimp: 'fish',
  'sea-bass': 'fish', 'canned-tuna': 'fish',
  // Meat
  beef: 'meat', pork: 'meat', 'chicken-breast': 'meat', 'chicken-thighs': 'meat',
  'ground-meat': 'meat', ham: 'meat', sausage: 'meat', sausages: 'meat', bacon: 'meat',
  // Vegetables
  potato: 'vegetables', tomato: 'vegetables', cucumber: 'vegetables', carrot: 'vegetables',
  onion: 'vegetables', garlic: 'vegetables', 'bell-pepper': 'vegetables', broccoli: 'vegetables',
  cabbage: 'vegetables', eggplant: 'vegetables', spinach: 'vegetables', lettuce: 'vegetables',
  zucchini: 'vegetables', cauliflower: 'vegetables', artichoke: 'vegetables',
  corn: 'vegetables', 'green-peas': 'vegetables', 'frozen-vegetables': 'vegetables',
  olives: 'vegetables',
  // Fruits
  apple: 'fruits', banana: 'fruits', orange: 'fruits', lemon: 'fruits', grape: 'fruits',
  strawberry: 'fruits', raspberry: 'fruits', blueberry: 'fruits', cherry: 'fruits',
  peach: 'fruits', pear: 'fruits', plum: 'fruits', watermelon: 'fruits',
  pineapple: 'fruits', apricot: 'fruits', avocado: 'fruits',
  // Dairy & Eggs
  'pasteurized-milk': 'dairy', 'hard-cheese': 'dairy', 'mozzarella-cheese': 'dairy',
  'cottage-cheese': 'dairy', butter: 'dairy', 'chicken-eggs': 'dairy',
  // Grains & Bread
  rice: 'grains', pasta: 'grains', bread: 'grains', oatmeal: 'grains',
  buckwheat: 'grains', 'wheat-flour': 'grains', breadcrumbs: 'grains',
  // Legumes
  beans: 'legumes', lentils: 'legumes', chickpeas: 'legumes',
  // Nuts & Seeds
  almonds: 'nuts', walnuts: 'nuts', hazelnuts: 'nuts',
  'sesame-seeds': 'nuts', 'sunflower-seeds': 'nuts',
  // Oils & Fats
  'olive-oil': 'oils', 'sunflower-oil': 'oils', 'rapeseed-oil': 'oils',
  // Sauces & Condiments
  ketchup: 'sauces', mayonnaise: 'sauces', mustard: 'sauces', 'soy-sauce': 'sauces',
  vinegar: 'sauces',
  // Spices & Herbs
  'black-pepper': 'spices', basil: 'spices', oregano: 'spices', rosemary: 'spices',
  thyme: 'spices', parsley: 'spices', dill: 'spices', ginger: 'spices',
  cinnamon: 'spices', turmeric: 'spices', 'sweet-paprika': 'spices',
  // Preserved
  pickles: 'preserved', 'canned-tomatoes': 'preserved',
  // Drinks
  beer: 'drinks', 'red-wine': 'drinks', 'white-wine': 'drinks',
  'orange-juice': 'drinks', 'mineral-water': 'drinks',
  // Sweets
  sugar: 'sweets', honey: 'sweets', chocolate: 'sweets', cocoa: 'sweets',
  'vanilla-ice-cream': 'sweets', vanilla: 'sweets', 'baking-powder': 'sweets',
  // Mushrooms → other
  'button-mushroom': 'other', 'porcini-mushroom': 'other',
};

/** Maps API category_name_en values → internal category keys */
const API_CATEGORY_NAME_MAP: Record<string, string> = {
  'Fish & Seafood': 'fish',
  'Meat & Poultry': 'meat',
  'Meat': 'meat',
  'Poultry': 'meat',
  'Vegetables': 'vegetables',
  'Fruits': 'fruits',
  'Dairy & Eggs': 'dairy',
  'Dairy': 'dairy',
  'Grains & Bread': 'grains',
  'Grains': 'grains',
  'Legumes': 'legumes',
  'Nuts & Seeds': 'nuts',
  'Oils & Fats': 'oils',
  'Oils': 'oils',
  'Sauces & Condiments': 'sauces',
  'Sauces': 'sauces',
  'Spices & Herbs': 'spices',
  'Spices': 'spices',
  'Herbs': 'spices',
  'Preserved': 'preserved',
  'Drinks': 'drinks',
  'Beverages': 'drinks',
  'Sweets': 'sweets',
  'Sweets & Sugars': 'sweets',
  'Mushrooms': 'other',
};

/**
 * Resolves an ingredient's internal category key.
 * Priority: API category_name_en → SLUG_CATEGORY fallback → 'other'
 */
export function resolveCategory(slug: string, apiCategoryName?: string): string {
  if (apiCategoryName && API_CATEGORY_NAME_MAP[apiCategoryName]) {
    return API_CATEGORY_NAME_MAP[apiCategoryName];
  }
  return SLUG_CATEGORY[slug] ?? 'other';
}
