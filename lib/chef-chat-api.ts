/**
 * ChefOS Chat API client
 *
 * POST /public/chat
 *
 * Request:  { input: string, context?: SessionContext }
 * Response: ChatResponse & { context: SessionContext }
 */

import { API_URL } from './api';

// ── Types — mirror the Rust backend contract exactly ─────────────────────────

export interface ProductCard {
  type: 'product';
  slug: string;
  name: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  fat_per_100g?: number;
  carbs_per_100g?: number;
  image_url?: string | null;
  highlight?: string;
  reason_tag?: 'high_protein' | 'low_calorie' | 'balanced';
}

export interface ConversionCard {
  type: 'conversion';
  value: number;
  from: string;
  to: string;
  result: number;
  supported: boolean;
}

export interface NutritionCard {
  type: 'nutrition';
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  image_url?: string | null;
}

export interface RecipeIngredient {
  slug: string;
  name: string;
  role: string;
  state: string;
  gross_g: number;
  net_g: number;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

export interface RecipeStep {
  step: number;
  text: string;
  time_min?: number | null;
}

export interface RecipeCard {
  type: 'recipe';
  dish_name: string;
  dish_name_local?: string;
  display_name?: string;
  dish_type: string;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  total_output_g: number;
  total_gross_g: number;
  total_loss_g: number;
  loss_percent: number;
  kcal_per_100g: number;
  total_kcal: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  per_serving_kcal: number;
  per_serving_protein: number;
  per_serving_fat: number;
  per_serving_carbs: number;
}

export type Card = ProductCard | ConversionCard | NutritionCard | RecipeCard;

export interface Suggestion {
  label: string;
  query: string;
  emoji?: string;
}

export interface ChatResponse {
  text?: string;
  cards?: Card[];
  suggestions?: Suggestion[];
  chef_tip?: string;
  coach_message?: string;
  intent?: string;
  intents?: string[];
  reason?: string;
  lang?: string;
  timing_ms?: number;
}

export interface SessionContext {
  last_intent?: string;
  last_intents?: string[];
  last_product_slug?: string;
  last_product_name?: string;
  last_lang?: string;
  last_modifier?: string;
  last_goal?: string;
  last_cards?: string[];
  shown_slugs?: string[];
  turn_count?: number;
}

export interface ChatApiResponse extends ChatResponse {
  context: SessionContext;
}

// ── API call ──────────────────────────────────────────────────────────────────

export async function postChat(
  input: string,
  context: SessionContext = {},
): Promise<ChatApiResponse> {
  const res = await fetch(`${API_URL}/public/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, context }),
  });

  if (!res.ok) {
    throw new Error(`Chat API error ${res.status}`);
  }

  return res.json();
}
