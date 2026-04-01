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

export type Card = ProductCard | ConversionCard | NutritionCard;

export interface ChatResponse {
  text?: string;
  cards?: Card[];
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
