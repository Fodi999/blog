/* ──────────────────────────────────────────────────────────────────
   SmartService v3 Types
   ────────────────────────────────────────────────────────────────── */

export enum Goal {
  Balanced    = 'balanced',
  HighProtein = 'high_protein',
  LowCalorie  = 'low_calorie',
  Keto        = 'keto',
  MuscleGain  = 'muscle_gain',
  Diet        = 'diet',
  FlavorBoost = 'flavor_boost',
}

/* ── Request ───────────────────────────────────────────────────── */

export interface SmartRequest {
  ingredient: string;              // primary slug
  state?: string;                  // "raw" | "grilled" | …
  additional_ingredients?: string[];
  goal?: Goal;
  lang?: string;                   // "en" | "ru" | "pl" | "uk"
  session_id?: string;
}

/* ── Response ──────────────────────────────────────────────────── */

export interface SmartResponse {
  ingredient:      IngredientInfo;
  state?:          StateInfo;
  nutrition:       NutritionBreakdown;
  vitamins:        Record<string, number>;
  flavor_profile:  FlavorProfileInfo;
  pairings:        PairingInfo[];
  suggestions:     SuggestionInfo[];
  diagnostics?:    DiagnosticsInfo;
  equivalents:     EquivalentInfo[];
  seasonality:     SeasonalityInfo[];
  confidence:      ConfidenceInfo;
  next_actions:    NextAction[];
  explain:         string[];
  session_id:      string;
  meta:            SmartMeta;
}

/* ── Sub-types ─────────────────────────────────────────────────── */

export interface ConfidenceInfo {
  overall:   number; // 0.0–1.0
  nutrition: number;
  pairings:  number;
  flavor:    number;
}

export interface NextAction {
  type:       'add' | 'remove' | 'swap' | 'adjust';
  ingredient: string; // slug
  name?:      string; // localized display name
  reason:     string;
  priority:   number; // 1 = highest
}

export interface SuggestionInfo {
  slug:            string;
  name:            string;
  image_url?:      string | null;
  score:           number;
  reasons:         string[];
  fills_gaps:      string[];
  suggested_grams: number;
}

export interface PairingInfo {
  slug:             string;
  name:             string;
  image_url?:       string | null;
  pair_score:       number;
  flavor_score?:    number;
  nutrition_score?: number;
}

export interface DiagnosticsInfo {
  health_score:    number;
  category_scores: Record<string, number>;
  issues:          DiagnosticIssue[];
}

export interface DiagnosticIssue {
  severity:    'critical' | 'warning' | 'info';
  code:        string;
  message:     string;
  fix_slugs?:  string[];
}

export interface IngredientInfo {
  slug:          string;
  name:          string;
  image_url?:    string | null;
  product_type?: string;
  sushi_grade?:  boolean;
}

export interface StateInfo {
  state:        string;
  description?: string;
  nutrition?: {
    calories?:      number;
    protein_g?:     number;
    fat_g?:         number;
    carbs_g?:       number;
    fiber_g?:       number;
    water_percent?: number;
  };
  texture?:                string;
  weight_change_percent?:  number;
  oil_absorption_g?:       number;
  water_loss_percent?:     number;
  glycemic_index?:         number;
  shelf_life_hours?:       number;
  storage_temp_c?:         number;
}

export interface NutritionBreakdown {
  calories?:  number;
  protein_g?: number;
  fat_g?:     number;
  carbs_g?:   number;
  fiber_g?:   number;
  sugar_g?:   number;
  salt_g?:    number;
}

export interface FlavorDimension {
  dimension: string;
  value:     number;
  deviation: number;
}

export interface FlavorProfileInfo {
  vector: Record<string, number>;
  balance: {
    vector:           Record<string, number>;
    balance_score:    number;
    weak_dimensions:  FlavorDimension[];
    strong_dimensions: FlavorDimension[];
  };
}

export interface EquivalentInfo {
  unit:  string;
  label: string;
  value: number;
}

export interface SeasonalityInfo {
  month:  number;
  status: string;
  note?:  string;
}

export interface SmartMeta {
  timing_ms:      number;
  cached:         boolean;
  cache_key:      string;
  engine_version: string;
}
