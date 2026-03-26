/* ──────────────────────────────────────────────────────────────────
   SmartService v3 — API Client
   
   Single entry-point for the /api/smart/ingredient endpoint.
   Manages session_id automatically for conversation continuity.
   ────────────────────────────────────────────────────────────────── */

import type { SmartRequest, SmartResponse, Goal, MealType } from '@/types/smart';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';

let currentSessionId: string | null = null;

// ── 6D Context auto-detection from free text ──────────────────────────────────

/** Infer goal from natural text keywords. Returns undefined if ambiguous. */
function inferGoal(text: string): Goal | undefined {
  const t = text.toLowerCase();
  // Order matters: more specific patterns first
  if (/high.?protein|protein.?rich|muscle|gym|bulk/i.test(t)) return 'high_protein' as Goal;
  if (/low.?cal|diet|weight.?loss|lean|slim|light/i.test(t))  return 'low_calorie' as Goal;
  if (/keto|low.?carb|no.?carb/i.test(t))                     return 'keto' as Goal;
  if (/quick|fast|express|15.?min|under.?\d+.?min/i.test(t))  return 'balanced' as Goal; // quick = balanced + time hint
  if (/cheap|budget|affordable|economy/i.test(t))              return 'balanced' as Goal;
  if (/healthy|clean|wellness/i.test(t))                       return 'balanced' as Goal;
  if (/flavor|tasty|delicious|umami|rich/i.test(t))            return 'flavor_boost' as Goal;
  // Russian
  if (/протеин|белок|мышц|качалк/i.test(t))                   return 'high_protein' as Goal;
  if (/диет|похуд|лёгк|легк|калор/i.test(t))                  return 'low_calorie' as Goal;
  if (/кето|безуглевод/i.test(t))                              return 'keto' as Goal;
  if (/быстр|экспресс/i.test(t))                               return 'balanced' as Goal;
  if (/бюджет|дёшев|дешев|эконом/i.test(t))                    return 'balanced' as Goal;
  if (/вкусн|ароматн/i.test(t))                                return 'flavor_boost' as Goal;
  // Polish
  if (/białk|protein|mięśn/i.test(t))                          return 'high_protein' as Goal;
  if (/diet|odchudz|lekk|niskokalo/i.test(t))                  return 'low_calorie' as Goal;
  if (/szybk|ekspres/i.test(t))                                 return 'balanced' as Goal;
  if (/budżet|tani/i.test(t))                                   return 'balanced' as Goal;
  return undefined;
}

/** Infer meal_type from natural text keywords. */
function inferMealType(text: string): MealType | undefined {
  const t = text.toLowerCase();
  if (/breakfast|morning|brunch|śniadani|завтрак|сніданок/i.test(t)) return 'breakfast' as MealType;
  if (/lunch|midday|obiad|обед|обід/i.test(t))                       return 'lunch' as MealType;
  if (/dinner|evening|supper|kolacja|ужин|вечер|вечір/i.test(t))     return 'dinner' as MealType;
  return undefined;
}

/** Infer diet from natural text keywords. */
function inferDiet(text: string): string | undefined {
  const t = text.toLowerCase();
  if (/\bvegan\b|растительн|wegańsk|веган/i.test(t))           return 'vegan';
  if (/vegetarian|вегетариан|wegetariańsk/i.test(t))            return 'vegetarian';
  if (/gluten.?free|безглютенов|bezglutenow/i.test(t))         return 'gluten_free';
  return undefined;
}

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
  role?: string;
};

/** Context overrides from the UI chips — only set fields are sent. */
export type SmartContext = {
  goal?: string;
  meal_type?: string;
  diet?: string;
};

/**
 * Parse a free-text input like "salmon rice avocado" into resolved ingredients
 * via the product search API, then call SmartService with the first as primary
 * and the rest as additional_ingredients.
 *
 * If no explicit context is provided, auto-detects goal/meal_type/diet from text.
 * Explicit context from UI chips always overrides auto-detection.
 *
 * Returns both the SmartResponse and the resolved ingredient list for chips display.
 */
export async function fetchSmartFromText(
  text: string,
  lang: string,
  context?: SmartContext,
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

  // 6D context: explicit UI overrides → auto-detection from text → undefined
  const goal = context?.goal || inferGoal(text);
  const meal_type = context?.meal_type || inferMealType(text);
  const diet = context?.diet || inferDiet(text);

  const req: SmartRequest = {
    ingredient: primary.slug,
    ...(rest.length > 0 && { additional_ingredients: rest.map((r) => r.slug) }),
    ...(goal && { goal }),
    ...(meal_type && { meal_type }),
    ...(diet && { diet }),
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
