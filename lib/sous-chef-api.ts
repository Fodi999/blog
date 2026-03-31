/**
 * API client for the Sous-Chef Planner.
 *
 * POST /public/sous-chef/plan   → MealPlan
 * GET  /public/sous-chef/suggestions?lang=  → Suggestion[]
 */

import { API_URL } from './api';

// ── Types matching Rust backend ───────────────────────────────────────────────

export interface MealIngredient {
  name: string;
  amount: string;
  calories: number;
  image_url?: string | null;
}

export interface MealVariant {
  level: 'light' | 'balanced' | 'rich';
  emoji: string;
  title: string;
  short_description: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  ingredients: MealIngredient[];
}

export interface MealPlan {
  cache_key: string;
  cached: boolean;
  chef_intro: string;
  variants: MealVariant[];
  explanation: string;
  motivation: string;
  goal: string;
  lang: string;
}

export interface Suggestion {
  text: string;
  goal: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function fetchSousChefPlan(
  query: string,
  lang: string,
): Promise<MealPlan> {
  const res = await fetch(`${API_URL}/public/sous-chef/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, lang }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Sous-chef error: ${res.status}`);
  }

  return res.json();
}

export async function fetchSousChefSuggestions(
  lang: string,
): Promise<Suggestion[]> {
  const res = await fetch(
    `${API_URL}/public/sous-chef/suggestions?lang=${encodeURIComponent(lang)}`,
    { next: { revalidate: 3600 } }, // cache suggestions for 1h
  );

  if (!res.ok) return [];
  return res.json();
}
