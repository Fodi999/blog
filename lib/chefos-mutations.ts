'use client';

/**
 * ChefOS mutation layer — every write goes through here.
 *
 * Each helper:
 *   1. Calls the same backend endpoint the iOS client uses.
 *   2. On success, calls `invalidate(...)` for every resource the
 *      mutation could have changed.
 *
 * That gives us the "single organism" guarantee: a write triggers
 * refetch in every page (and every browser tab) that subscribed to
 * the affected keys via `useChefOSSync(...)`.
 *
 * Mirrors `APIClient.swift` so the two clients stay in lock-step.
 */
import { api, ApiError } from './chefos-api';
import { invalidate } from './chefos-store';
import type {
  AddInventoryRequest,
  InventoryItem,
  MealPlanDay,
  MealPlanEntry,
  MealSlot,
  RecipeV2,
} from './chefos-types';

// ── Inventory ───────────────────────────────────────────────────────────────

export async function addInventoryItem(
  req: AddInventoryRequest,
): Promise<InventoryItem> {
  const item = await api.post<InventoryItem>('/api/inventory/products', req);
  invalidate('inventory', 'inventory-dashboard');
  return item;
}

export async function updateInventoryItem(
  id: string,
  patch: { quantity?: number; price_per_unit_cents?: number },
): Promise<void> {
  await api.put(`/api/inventory/products/${id}`, patch);
  invalidate('inventory', 'inventory-dashboard');
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await api.delete(`/api/inventory/products/${id}`);
  invalidate('inventory', 'inventory-dashboard');
}

// ── Recipes / My Dishes ─────────────────────────────────────────────────────

export async function deleteRecipe(id: string): Promise<void> {
  await api.delete(`/api/recipes/v2/${id}`);
  invalidate('recipes', 'dishes');
}

// ── Meal Plan ───────────────────────────────────────────────────────────────
// Mirrors iOS `upsertMealPlanDay`. Backend endpoint is being rolled out —
// `addRecipeToPlan` swallows 404/501 so the UI can keep working.

/** Build a `MealPlanRecipeRef` from a saved RecipeV2 the user picked. */
function recipeRefFromV2(recipe: RecipeV2) {
  // RecipeV2 has no per-serving kcal/protein columns yet — leave nulls so
  // the day-summary shows "—" until a richer recipe payload lands.
  const cost =
    recipe.cost_per_serving_cents != null
      ? recipe.cost_per_serving_cents / 100
      : null;
  return {
    id: recipe.id,
    title: recipe.name,
    calories: null,
    protein: null,
    estimated_cost: cost,
    image_url: recipe.image_url,
  };
}

/**
 * Add a saved recipe to a single day's meal plan slot. This is an upsert:
 * existing meals on that day are preserved; only the target slot is replaced.
 *
 * @param date  ISO `yyyy-MM-dd` — the day to plan for
 * @param slot  Which meal slot to fill
 * @param recipe Saved RecipeV2 to assign
 */
export async function addRecipeToPlan(
  date: string,
  slot: MealSlot,
  recipe: RecipeV2,
): Promise<void> {
  // Pull current day to preserve the other slots, falling back to empty
  // when backend is missing or this is the first edit.
  let existing: MealPlanEntry[] = [];
  try {
    const day = await api.get<MealPlanDay>(`/api/meal-plan/${date}`);
    existing = day.meals ?? [];
  } catch (e) {
    if (!(e instanceof ApiError) || (e.status !== 404 && e.status !== 501)) {
      // Unexpected — propagate so the UI can show the right error.
      throw e;
    }
  }

  // Build the new meals list: replace the target slot, keep others.
  const others = existing.filter((m) => m.slot !== slot);
  const next: MealPlanEntry[] = [
    ...others,
    { slot, recipe: recipeRefFromV2(recipe) },
  ];

  try {
    await api.put(`/api/meal-plan/${date}`, { meals: next });
    invalidate('plan');
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 501)) {
      // Backend not ready yet — still invalidate so listeners refresh; the
      // page will simply show the empty state.
      invalidate('plan');
      return;
    }
    throw e;
  }
}

/** Remove a single slot from a day's plan. */
export async function removeRecipeFromPlan(
  date: string,
  slot: MealSlot,
): Promise<void> {
  try {
    await api.delete(`/api/meal-plan/${date}/${slot}`);
  } catch (e) {
    if (!(e instanceof ApiError) || (e.status !== 404 && e.status !== 501)) {
      throw e;
    }
  }
  invalidate('plan');
}

// ── Profile ─────────────────────────────────────────────────────────────────

export async function updateLanguage(language: string): Promise<void> {
  await api.put('/api/profile/language', { language });
  invalidate('me', 'preferences');
}

export async function updateAvatarUrl(avatar_url: string): Promise<void> {
  await api.put('/api/profile/avatar', { avatar_url });
  invalidate('me');
}

// ── Chat ────────────────────────────────────────────────────────────────────

/**
 * Chat telemetry — fire-and-forget. Mirrors iOS `sendChatEvent`.
 * `POST /api/chat/event` is authenticated; user_id is derived server-side
 * from the JWT (no body spoofing). Anonymous calls are silently dropped.
 */
export type ChatEventType =
  | 'query_sent'
  | 'card_shown'
  | 'card_dismissed'
  | 'action_clicked'
  | 'suggestion_clicked';

export function sendChatEvent(
  event_type: ChatEventType,
  params: {
    user_id?: string;
    session_id?: string;
    card_type?: string;
    card_slug?: string;
    action_type?: string;
    intent?: string;
    query?: string;
    lang?: string;
  } = {},
): void {
  // Strip user_id from body — backend uses JWT-derived id.
  // Detached: never block UI, swallow all errors (incl. 401 for guests).
  const { user_id: _drop, ...rest } = params;
  void api
    .post('/api/chat/event', { event_type, ...rest })
    .catch(() => {
      /* drop */
    });
}
