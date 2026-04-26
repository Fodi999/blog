/**
 * Cook Suggestions client — `POST /api/cook/suggestions`.
 *
 * Mirrors `CookSuggestionsResponse` in
 * `assistant/src/application/cook_suggestions.rs`.
 *
 * The backend takes the user's current inventory, asks Gemini for dish
 * candidates, resolves each one through the deterministic `recipe_engine`
 * to get a full TechCard, then diffs against the inventory and groups the
 * results into three buckets:
 *
 *   • can_cook  — 0 missing ingredients, ready right now
 *   • almost    — 1-2 missing, near-term
 *   • strategic — 3-4 missing, anti-waste / smart picks
 *
 * Costs and margin are computed from REAL inventory prices; if data is
 * insufficient `economics` is `null` (we never fabricate numbers).
 */
import { api } from './chefos-api';

export type Confidence = 'strong' | 'medium' | 'weak';

export interface RecipeStep {
  step: number;
  text: string;
  time_min: number | null;
  temp_c: number | null;
  tip: string | null;
}

export interface SuggestedIngredient {
  name: string;
  slug: string;
  gross_g: number;
  role: string;
  available: boolean;
  expiring_soon: boolean;
  /** Catalog photo URL (omitted by backend when no image is set). */
  image_url?: string | null;
  /** Catalog `product_type`: meat, vegetable, fruit, dairy, spice, … */
  category?: string | null;
}

export interface DishEconomics {
  cost_cents: number;
  waste_saved_cents: number;
  suggested_price_cents: number;
  margin_percent: number;
  price_coverage_percent: number;
  confidence: Confidence;
}

export interface DishInsight {
  uses_expiring: boolean;
  high_protein: boolean;
  budget_friendly: boolean;
  estimated_cost_cents: number;
  priority_score: number;
  reasons: string[];
  economics?: DishEconomics | null;
}

export interface FlavorInfo {
  balance_score: number;
  dominant: string | null;
  suggestions: string[];
}

export interface AdaptationInfo {
  changed: boolean;
  strategy: string | null;
  actions: string[];
}

export interface SuggestedDish {
  dish_name: string;
  dish_name_local: string | null;
  display_name: string | null;
  dish_type: string;
  complexity: string;
  ingredients: SuggestedIngredient[];
  missing_ingredients: string[];
  missing_count: number;
  total_kcal: number;
  total_protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  per_serving_kcal: number;
  per_serving_protein_g: number;
  per_serving_fat_g: number;
  per_serving_carbs_g: number;
  servings: number;
  steps: RecipeStep[];
  insight: DishInsight;
  flavor: FlavorInfo | null;
  adaptation: AdaptationInfo | null;
  warnings: string[];
  tags: string[];
  allergens: string[];
}

export interface InventoryInsight {
  days_left: number;
  at_risk: string[];
  waste_risk: number;
  total_ingredients: number;
}

export interface UnlockSuggestions {
  missing_frequently: string[];
  unlock_hints: string[];
}

export interface PersonalizationInfo {
  personalized: boolean;
  goal: string;
  diet: string;
  kcal_target: number;
  protein_target: number;
  excluded_allergens: string[];
  excluded_dislikes: string[];
}

export interface CookSuggestionsResponse {
  inventory_insight: InventoryInsight;
  can_cook: SuggestedDish[];
  almost: SuggestedDish[];
  strategic: SuggestedDish[];
  suggestions: UnlockSuggestions;
  personalization: PersonalizationInfo | null;
}

export type DishBucket = 'can_cook' | 'almost' | 'strategic';

/**
 * Stable enum-key lists mirroring Rust:
 *   • DishType (lab_combos/dish_classifier.rs) — lowercase Debug-name
 *   • complexity (recipe_engine.rs:183) — "easy" | "medium" | "hard"
 *   • ingredient.role (flavor_engine.rs et al.) — small fixed vocab
 *
 * The backend emits these as raw English keys for stability. The UI
 * translates them via the `app.cookNow.dishType` / `complexity` / `role`
 * i18n namespaces (with a graceful fallback to the raw key).
 */
export const DISH_TYPE_KEYS = [
  'sticks',
  'cutlets',
  'pancakes',
  'soup',
  'salad',
  'bowl',
  'pasta',
  'casserole',
  'stirfry',
  'baked',
  'wrap',
  'omelette',
  'porridge',
  'smoothie',
  'generic',
] as const;
export type DishTypeKey = (typeof DISH_TYPE_KEYS)[number];

export const COMPLEXITY_KEYS = ['easy', 'medium', 'hard'] as const;
export type ComplexityKey = (typeof COMPLEXITY_KEYS)[number];

export const ROLE_KEYS = [
  'main',
  'protein',
  'side',
  'base',
  'sauce',
  'spice',
  'garnish',
  'vegetable',
  'fruit',
  'dairy',
  'grain',
] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

/**
 * Display-friendly title fallback chain:
 *   display_name → dish_name_local → dish_name
 */
export function dishTitle(d: SuggestedDish): string {
  return d.display_name?.trim() || d.dish_name_local?.trim() || d.dish_name;
}

/** Flat list across all buckets — useful for empty-state checks. */
export function totalDishes(r: CookSuggestionsResponse): number {
  return r.can_cook.length + r.almost.length + r.strategic.length;
}

/**
 * POST /api/cook/suggestions — generates suggestions from user's inventory.
 *
 * The request has no body; the server uses the auth user's inventory.
 * Costs ~1 AI action when the user is past their free daily quota.
 */
export function getCookSuggestions(): Promise<CookSuggestionsResponse> {
  return api.post<CookSuggestionsResponse>('/api/cook/suggestions');
}
