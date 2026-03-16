import { ChefHat, Apple, Scale, Utensils } from "lucide-react";

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export type IngredientRow = { slug: string; name: string; grams: number; image_url?: string };

export type NutritionData = {
  calories: number; protein: number; fat: number;
  carbs: number; fiber: number; sugar: number;
};

export type FlavorSummary = {
  sweetness: number; acidity: number; bitterness: number;
  umami: number; fat: number; aroma: number;
  balance_score: number; weak: string[]; strong: string[];
};

export type SuggestionItem = {
  slug: string; name: string; image_url?: string;
  score: number; reasons: string[]; fills: string[];
};

export type MacrosSummary = { protein_pct: number; fat_pct: number; carbs_pct: number };

export type IngredientDetail = {
  slug: string; name: string; grams: number; image_url?: string;
  calories: number; protein: number; fat: number; carbs: number; found: boolean;
};

export type AnalyzeResponse = {
  nutrition: NutritionData; per_portion?: NutritionData;
  portions: number; macros: MacrosSummary; score: number;
  flavor: FlavorSummary; diet: string[];
  suggestions: SuggestionItem[]; ingredients: IngredientDetail[];
};

export type SearchResult = { slug: string; name: string; image_url?: string };

export type Pairing = {
  slug: string; name_en?: string; name_ru?: string;
  name_pl?: string; name_uk?: string; image_url?: string;
  pair_score?: number; flavor_score?: number;
  nutrition_score?: number; culinary_score?: number;
};

export type PairingData = {
  slug: string;
  basic: { name_en?: string; name_ru?: string; name_pl?: string; name_uk?: string; image_url?: string; product_type?: string };
  macros?: { calories_kcal?: number; protein_g?: number; fat_g?: number; carbs_g?: number };
  culinary?: { sweetness?: number; acidity?: number; bitterness?: number; umami?: number; aroma?: number; texture?: string };
  pairings: Pairing[];
};

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

export const MODES = ["recipeAnalyzer", "ingredientExplorer", "unitConverter", "flavorPairing"] as const;
export type Mode = (typeof MODES)[number];

export const MODE_ICONS: Record<Mode, any> = {
  recipeAnalyzer: ChefHat,
  ingredientExplorer: Apple,
  unitConverter: Scale,
  flavorPairing: Utensils,
};

export const QUICK_RECIPES = [
  {
    key: "pastaPomodoro",
    ingredients: [
      { slug: "pasta", name: "Pasta", grams: 200 },
      { slug: "tomato", name: "Tomato", grams: 300 },
      { slug: "olive-oil", name: "Olive Oil", grams: 20 },
      { slug: "garlic", name: "Garlic", grams: 10 },
      { slug: "basil", name: "Basil", grams: 5 },
    ],
  },
  {
    key: "greekSalad",
    ingredients: [
      { slug: "tomato", name: "Tomato", grams: 200 },
      { slug: "cucumber", name: "Cucumber", grams: 150 },
      { slug: "onion", name: "Onion", grams: 50 },
      { slug: "olive-oil", name: "Olive Oil", grams: 30 },
      { slug: "feta", name: "Feta", grams: 100 },
    ],
  },
  {
    key: "salmonBowl",
    ingredients: [
      { slug: "salmon", name: "Salmon", grams: 150 },
      { slug: "rice", name: "Rice", grams: 200 },
      { slug: "avocado", name: "Avocado", grams: 80 },
      { slug: "cucumber", name: "Cucumber", grams: 50 },
      { slug: "soy-sauce", name: "Soy Sauce", grams: 15 },
    ],
  },
];

export const POPULAR_SLUGS = [
  { slug: "tomato", key: "tomato", image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100&h=100&fit=crop" },
  { slug: "salmon", key: "salmon", image_url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=100&h=100&fit=crop" },
  { slug: "chicken-breast", key: "chicken", image_url: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100&h=100&fit=crop" },
  { slug: "basil", key: "basil", image_url: "https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=100&h=100&fit=crop" },
  { slug: "mozzarella-cheese", key: "mozzarella", image_url: "https://images.unsplash.com/photo-1559561853-08451507cbe7?w=100&h=100&fit=crop" },
  { slug: "lemon", key: "lemon", image_url: "https://images.unsplash.com/photo-1590502593457-19bd65ff55ba?w=100&h=100&fit=crop" },
  { slug: "garlic", key: "garlic", image_url: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=100&h=100&fit=crop" },
  { slug: "avocado", key: "avocado", image_url: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=100&h=100&fit=crop" },
];

export const CONVERTER_QUICK = [
  { slug: "wheat-flour", from: "cup", to: "g", amount: 1 },
  { slug: "butter", from: "tbsp", to: "g", amount: 1 },
  { slug: "sugar", from: "cup", to: "g", amount: 1 },
  { slug: "rice", from: "cup", to: "g", amount: 1 },
  { slug: "olive-oil", from: "tbsp", to: "g", amount: 1 },
  { slug: "honey", from: "tbsp", to: "g", amount: 1 },
];

export const FROM_UNITS = ["cup", "tbsp", "tsp", "g", "kg", "oz", "ml", "l"];
export const TO_UNITS = ["g", "oz", "kg", "lb", "ml", "cup", "tbsp", "tsp"];

export const UNIT_LABELS: Record<string, Record<string, string>> = {
  cup: { en: "cup", ru: "стакан", pl: "szklanka", uk: "склянка" },
  tbsp: { en: "tbsp", ru: "ст.л.", pl: "łyżka", uk: "ст.л." },
  tsp: { en: "tsp", ru: "ч.л.", pl: "łyżeczka", uk: "ч.л." },
  g: { en: "g", ru: "г", pl: "g", uk: "г" },
  kg: { en: "kg", ru: "кг", pl: "kg", uk: "кг" },
  oz: { en: "oz", ru: "унц.", pl: "uncja", uk: "унц." },
  lb: { en: "lb", ru: "фунт", pl: "funt", uk: "фунт" },
  ml: { en: "ml", ru: "мл", pl: "ml", uk: "мл" },
  l: { en: "l", ru: "л", pl: "l", uk: "л" },
};
