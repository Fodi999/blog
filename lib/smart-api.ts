/* ──────────────────────────────────────────────────────────────────
   SmartService v3 — API Client
   
   Single entry-point for the /api/smart/ingredient endpoint.
   Manages session_id automatically for conversation continuity.
   ────────────────────────────────────────────────────────────────── */

import type { SmartRequest, SmartResponse } from '@/types/smart';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';

let currentSessionId: string | null = null;

/**
 * Call the SmartService v3 decision engine.
 *
 * Automatically injects the previous `session_id` if none is provided,
 * and saves the returned one for the next call (conversation chain).
 */
export async function fetchSmart(req: SmartRequest): Promise<SmartResponse> {
  // Inject session continuity
  if (currentSessionId && !req.session_id) {
    req.session_id = currentSessionId;
  }

  const res = await fetch(`${API_BASE}/api/smart/ingredient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    throw new Error(`Smart API ${res.status}: ${res.statusText}`);
  }

  const data: SmartResponse = await res.json();

  // Persist session for chaining
  if (data.session_id) {
    currentSessionId = data.session_id;
  }

  return data;
}

/* ── Text-based recipe analysis ────────────────────────────── */

import { searchProducts, type SearchResult } from '@/lib/tools';

export type ResolvedIngredient = {
  slug: string;
  name: string;
  image_url?: string | null;
};

/**
 * Parse a free-text input like "salmon rice avocado" into resolved ingredients
 * via the product search API, then call SmartService with the first as primary
 * and the rest as additional_ingredients.
 *
 * Returns both the SmartResponse and the resolved ingredient list for chips display.
 */
export async function fetchSmartFromText(
  text: string,
  lang: string,
): Promise<{ smart: SmartResponse; ingredients: ResolvedIngredient[] }> {
  // Split text into words, clean up
  const words = text
    .trim()
    .split(/[\s,;+]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 2);

  if (words.length === 0) {
    throw new Error('No ingredients found');
  }

  // Resolve each word to a slug via product search (parallel)
  const resolved = await Promise.all(
    words.map(async (word): Promise<ResolvedIngredient | null> => {
      const results = await searchProducts(word, lang, 1);
      if (results.length === 0) return null;
      const r = results[0];
      return { slug: r.slug, name: r.name, image_url: r.image_url };
    }),
  );

  // Filter out unresolved words, deduplicate by slug
  const seen = new Set<string>();
  const ingredients: ResolvedIngredient[] = [];
  for (const r of resolved) {
    if (r && !seen.has(r.slug)) {
      seen.add(r.slug);
      ingredients.push(r);
    }
  }

  if (ingredients.length === 0) {
    throw new Error('No ingredients found');
  }

  // First ingredient = primary, rest = additional
  const [primary, ...rest] = ingredients;

  const req: SmartRequest = {
    ingredient: primary.slug,
    ...(rest.length > 0 && { additional_ingredients: rest.map((r) => r.slug) }),
    lang,
  };

  const smart = await fetchSmart(req);
  return { smart, ingredients };
}

/** Reset the stored session (e.g. when the user clears the dish). */
export function resetSmartSession() {
  currentSessionId = null;
}

/** Get the current session_id (for debugging / display). */
export function getSmartSessionId(): string | null {
  return currentSessionId;
}
