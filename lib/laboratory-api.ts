/**
 * Laboratory — typed client for the food-tech analysis API.
 *
 * Maps 1:1 to backend `src/application/laboratory/*` (see
 * `assistant/FRONTEND_LABORATORY_INTEGRATION.md`). All endpoints are
 * authenticated via JWT (handled by `api`).
 */
import { api } from './chefos-api';

// ── Domain types ─────────────────────────────────────────────────────────────

export type LabRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type LabStatus = 'draft' | 'ready' | 'archived';

export type LabIngredient = {
  id: string;
  ingredient_slug: string;
  quantity: string; // Decimal as string
  unit: string; // "g" | "ml" | "pcs"
  role: string | null; // "base" | "acid" | "fat" | …
  sort_order: number;
  notes: string | null;
  /**
   * Set to `true` by the backend when an `addIngredient` call merged into
   * an existing line (same project_id + slug + unit). Quantity is the
   * post-merge total. Omitted in list/get responses.
   */
  merged?: boolean;
};

export type LabStep = {
  id: string;
  order_index: number;
  technique: string; // "heat" | "blend" | "ferment" | …
  temperature_c: string | null; // Decimal as string
  duration_min: number | null;
  target_slugs: string[];
  notes: string | null;
};

export type LabEffect = {
  ingredient_slug: string;
  ingredient_name: string;
  effect_type: string;
  visual_token: string;
  label: string;
  message: string;
  intensity: number; // 0..1
  confidence: number; // 0..1
  trigger_temperature_c: number | null;
  actual_temperature_c: number | null;
};

export type LabStepEffect = {
  step_id: string;
  order_index: number;
  technique: string;
  temperature_c: number | null;
  duration_min: number | null;
  effects: LabEffect[];
};

export type LabProcessEffects = {
  step_effects: LabStepEffect[];
  global_effects: LabEffect[];
};

export type LabFlavorProfile =
  | 'sweet_sour'
  | 'sweet'
  | 'acidic'
  | 'umami_rich'
  | 'bitter'
  | 'aromatic'
  | 'balanced'
  | 'unknown';

export type LabFlavorResult = {
  sweetness: number | null;
  acidity: number | null;
  bitterness: number | null;
  umami: number | null;
  aroma: number | null;
  dominant_profile: LabFlavorProfile;
  balance_label: string;
  message: string;
};

export type LabStorageRec = {
  method: 'refrigeration' | 'freezing' | 'pantry' | 'pasteurization_advisory' | string;
  label: string;
  message: string;
  extra_days: number | null;
  cost_impact: 'low' | 'medium' | 'high';
  quality_impact: 'low' | 'medium' | 'high';
};

export type LabPairing = {
  ingredient_slug: string;
  ingredient_name: string;
  score: number; // 0..100
  reason: string;
  source: string;
  role: string | null;
};

export type LabWarning = {
  kind: string;
  severity: 'info' | 'warning' | 'high' | 'critical';
  message: string;
  ingredient_slug?: string | null;
  step_id?: string | null;
};

export type LabAnalysis = {
  id: string;
  shelf_life_days: number | null;
  estimated_cost: string | null;
  complexity_score: number | null;
  risk_level: LabRiskLevel;
  texture_result: unknown | null;
  flavor_result: LabFlavorResult;
  nutrition_result: Record<string, unknown>;
  process_effects: LabProcessEffects;
  storage_recommendations: LabStorageRec[];
  pairing_suggestions: LabPairing[];
  warnings: LabWarning[];
};

export type LabProject = {
  id: string;
  name: string;
  description: string | null;
  target_product_type: string | null;
  status: LabStatus;
  ingredients: LabIngredient[];
  process_steps: LabStep[];
  latest_analysis: LabAnalysis | null;
};

export type LabProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  target_product_type: string | null;
  status: LabStatus;
  updated_at?: string;
};

// ── Payloads ─────────────────────────────────────────────────────────────────

export type CreateProjectPayload = {
  name: string;
  description?: string | null;
  target_product_type?: string | null;
};

export type AddIngredientPayload = {
  ingredient_slug: string;
  quantity: number | string;
  unit: string;
  role?: string | null;
  notes?: string | null;
};

export type AddStepPayload = {
  technique: string;
  temperature_c?: number | string | null;
  duration_min?: number | null;
  target_slugs?: string[];
  notes?: string | null;
};

// ── Copilot ──────────────────────────────────────────────────────────────────

export type CopilotSuggestIngredient = {
  slug: string;
  quantity: number;
  unit: string;
  role: string;
  in_catalog: boolean;
};

export type CopilotSuggestStep = {
  technique: string;
  temperature_c: number | null;
  duration_min: number | null;
  note: string;
};

export type CopilotSuggestResponse = {
  product_type: string;
  suggested_name: string;
  ingredients: CopilotSuggestIngredient[];
  steps: CopilotSuggestStep[];
  rationale: string;
  confidence: number; // 0..1
  unmatched_tokens: string[];
};

// ── Visual story (Step 9) ────────────────────────────────────────────────────

export type LaboratorySceneFrame = {
  step_id: string | null;
  scene_key: string;       // raw | softening | juicing | heated | browning | blended | thickening | frozen | fermenting | ready | …
  order_index: number;
  title: string;
  description: string;
  visual_tokens: string[];
  composition: string;
  prompt_hint: string;
  image_url: string | null;
  /**
   * `Some(n)` (n >= 2) when the engine collapsed adjacent identical scene
   * frames into a single one. Frontend can render a "× N" badge.
   * Always `undefined` for the standalone case.
   */
  repeated_count?: number;
};

export type LaboratoryVisualStory = {
  product_type: string | null;
  headline: string;
  scenes: LaboratorySceneFrame[];
};

// ── Endpoints ────────────────────────────────────────────────────────────────

const BASE = '/api/laboratory';

export const laboratoryApi = {
  list: () => api.get<LabProjectSummary[]>(`${BASE}/projects`),

  get: (id: string) => api.get<LabProject>(`${BASE}/projects/${id}`),

  create: (payload: CreateProjectPayload) =>
    api.post<LabProject>(`${BASE}/projects`, payload),

  update: (id: string, payload: Partial<CreateProjectPayload> & { status?: LabStatus }) =>
    api.patch<LabProject>(`${BASE}/projects/${id}`, payload),

  remove: (id: string) => api.delete<void>(`${BASE}/projects/${id}`),

  addIngredient: (id: string, payload: AddIngredientPayload) =>
    api.post<LabProject>(`${BASE}/projects/${id}/ingredients`, payload),

  removeIngredient: (id: string, ingId: string) =>
    api.delete<void>(`${BASE}/projects/${id}/ingredients/${ingId}`),

  addStep: (id: string, payload: AddStepPayload) =>
    api.post<LabProject>(`${BASE}/projects/${id}/steps`, payload),

  removeStep: (id: string, stepId: string) =>
    api.delete<void>(`${BASE}/projects/${id}/steps/${stepId}`),

  analyze: (id: string, lang: string) =>
    api.post<LabProject>(`${BASE}/projects/${id}/analyze?lang=${encodeURIComponent(lang)}`),

  copilotSuggest: (prompt: string, lang: string) =>
    api.post<CopilotSuggestResponse>(
      `${BASE}/copilot/suggest?lang=${encodeURIComponent(lang)}`,
      { prompt },
    ),

  generateScenes: (id: string) =>
    api.post<LaboratoryVisualStory>(`${BASE}/projects/${id}/generate-scenes`),
};

// ── UI helpers ───────────────────────────────────────────────────────────────

export function riskColor(level: LabRiskLevel): string {
  switch (level) {
    case 'low':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
    case 'medium':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
    case 'high':
      return 'bg-orange-500/15 text-orange-700 dark:text-orange-400';
    case 'critical':
      return 'bg-red-500/15 text-red-700 dark:text-red-400';
  }
}

export function severityColor(s: LabWarning['severity']): string {
  switch (s) {
    case 'info':
      return 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300';
    case 'warning':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300';
    case 'high':
      return 'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300';
    case 'critical':
      return 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300';
  }
}
