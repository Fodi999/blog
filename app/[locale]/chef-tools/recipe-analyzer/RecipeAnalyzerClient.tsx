'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Trash2, ChefHat, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { API_URL } from '@/lib/api';
import { FlavorRadar } from './FlavorRadar';
import { NutritionCard } from './NutritionCard';
import { SuggestionCard } from './SuggestionCard';
import { DiagnosisCard, type RuleDiagnosis } from './DiagnosisCard';
import { ChefSummary, type NutritionSnapshot, type ChangeLogEntry, collectReduceRules } from './ChefSummary';
import { cn } from '@/lib/utils';

// ── Adaptive grams — smart portions instead of fixed 50g ─────────────────────
// Maps slug patterns to sensible auto-improve portions.
// "Don't pour oil" — add just enough to fix the gap.

const SLUG_GRAMS: Record<string, number> = {
  // Oils & fats — tiny amounts (10-15g)
  'olive-oil': 10, 'sunflower-oil': 10, 'coconut-oil': 10,
  'butter': 15, 'lard': 10, 'cream': 20, 'sour-cream': 20,
  'mayonnaise': 10,
  // Spices & herbs — micro amounts (2-5g)
  'black-pepper': 2, 'garlic': 5, 'basil': 3, 'onion': 30,
  'cinnamon': 2, 'turmeric': 2, 'paprika': 2, 'oregano': 2,
  'cumin': 2, 'rosemary': 2, 'thyme': 2, 'dill': 3,
  'parsley': 5, 'cilantro': 3, 'ginger': 3, 'chili': 2,
  // Acids — small amounts
  'lemon': 15, 'vinegar': 5, 'lime': 10,
  // Proteins — moderate (50g)
  'chicken-breast': 50, 'chicken-eggs': 50, 'salmon': 50,
  'hard-cheese': 20, 'lentils': 40, 'tofu': 50,
  // Vegetables — medium (40-60g)
  'tomato': 50, 'broccoli': 50, 'spinach': 30, 'carrot': 40,
  // Sweeteners — small
  'honey': 10, 'sugar': 5, 'maple-syrup': 10,
  // Nuts & seeds
  'walnuts': 15, 'almonds': 15, 'flaxseed': 5,
  // Grains
  'oatmeal': 30, 'rice': 50, 'bread': 30,
  // Dairy
  'milk': 50, 'cottage-cheese': 50, 'yogurt': 50,
  'soy-sauce': 5,
};

/** Resolve adaptive grams for an ingredient slug.
 *  Falls back to 30g for unknown slugs (conservative default). */
function smartGrams(slug: string): number {
  if (SLUG_GRAMS[slug]) return SLUG_GRAMS[slug];
  // Pattern-based fallbacks
  if (slug.includes('oil')) return 10;
  if (slug.includes('pepper') || slug.includes('spice')) return 2;
  if (slug.includes('herb') || slug.includes('leaf')) return 3;
  if (slug.includes('sauce')) return 10;
  if (slug.includes('cheese')) return 20;
  return 30; // conservative default
}

// ── Types ────────────────────────────────────────────────────────────────────

type IngredientRow = {
  slug: string;
  name: string;
  grams: number;
  image_url?: string;
};

type NutritionSummary = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
};

type FlavorSummary = {
  sweetness: number;
  acidity: number;
  bitterness: number;
  umami: number;
  fat: number;
  aroma: number;
  balance_score: number;
  weak: string[];
  strong: string[];
};

type SuggestionItem = {
  slug: string;
  name: string;
  image_url?: string;
  score: number;
  reasons: string[];
  fills: string[];
};

type MacrosSummary = {
  protein_pct: number;
  fat_pct: number;
  carbs_pct: number;
};

type IngredientDetail = {
  slug: string;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  found: boolean;
};

type AnalyzeResponse = {
  nutrition: NutritionSummary;
  per_portion?: NutritionSummary;
  portions: number;
  macros: MacrosSummary;
  score: number;
  flavor: FlavorSummary;
  diet: string[];
  dish_type?: 'dessert' | 'savory' | 'neutral';
  suggestions: SuggestionItem[];
  ingredients: IngredientDetail[];
  diagnosis: RuleDiagnosis;
};

type SearchResult = {
  slug: string;
  name: string;
  image_url?: string;
};

// ── Component ────────────────────────────────────────────────────────────────

const EMPTY_ROW: IngredientRow = { slug: '', name: '', grams: 100 };

const QUICK_RECIPES = [
  {
    key: 'pastaPomodoro',
    ingredients: [
      { slug: 'pasta', grams: 200 },
      { slug: 'tomato', grams: 300 },
      { slug: 'olive-oil', grams: 20 },
      { slug: 'garlic', grams: 10 },
      { slug: 'basil', grams: 5 },
    ],
  },
  {
    key: 'greekSalad',
    ingredients: [
      { slug: 'tomato', grams: 200 },
      { slug: 'cucumber', grams: 150 },
      { slug: 'onion', grams: 50 },
      { slug: 'olive-oil', grams: 30 },
      { slug: 'hard-cheese', grams: 100 },
    ],
  },
  {
    key: 'salmonBowl',
    ingredients: [
      { slug: 'salmon', grams: 150 },
      { slug: 'rice', grams: 200 },
      { slug: 'avocado', grams: 80 },
      { slug: 'cucumber', grams: 50 },
      { slug: 'soy-sauce', grams: 15 },
    ],
  },
];

// Quick recipe display names per locale
const RECIPE_NAMES: Record<string, Record<string, string>> = {
  pastaPomodoro: { en: 'Pasta Pomodoro', pl: 'Makaron Pomodoro', ru: 'Паста Помодоро', uk: 'Паста Помодоро' },
  greekSalad: { en: 'Greek Salad', pl: 'Sałatka Grecka', ru: 'Греческий салат', uk: 'Грецький салат' },
  salmonBowl: { en: 'Salmon Bowl', pl: 'Bowl z łososiem', ru: 'Боул с лососем', uk: 'Боул з лососем' },
};

export function RecipeAnalyzerClient() {
  const locale = useLocale();
  const t = useTranslations('chefTools.tools.recipeAnalyzer');

  const [rows, setRows] = useState<IngredientRow[]>([
    { slug: '', name: '', grams: 100 },
  ]);
  const [portions, setPortions] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Re-analyze flag (auto-analyze after adding ingredient from suggestion/diagnosis)
  const [pendingReanalyze, setPendingReanalyze] = useState(false);

  // Auto-improve loading state
  const [improving, setImproving] = useState(false);

  // Snapshot of nutrition before auto-improve (for before/after comparison)
  const [previousSnapshot, setPreviousSnapshot] = useState<NutritionSnapshot | null>(null);

  // Changelog of what auto-improve did
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);

  // Top 3 suggestions toggle
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  // Improve attempt counter (hard limit = 3)
  const [improveCount, setImproveCount] = useState(0);

  // True when last improve changed nothing (no-op)
  const [improveExhausted, setImproveExhausted] = useState(false);

  // ── Ingredient search ──
  const searchIngredients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/public/tools/product-search?q=${encodeURIComponent(query)}&lang=${locale}&limit=8`,
      );
      if (res.ok) {
        const data = await res.json();
        const items: SearchResult[] = (data.results || data.products || []).map((p: any) => ({
          slug: p.slug,
          name: p.name || p.name_en || p.slug,
          image_url: p.image_url,
        }));
        setSearchResults(items);
      }
    } catch {
      // ignore
    } finally {
      setSearchLoading(false);
    }
  }, [locale]);

  const selectIngredient = (idx: number, item: SearchResult) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], slug: item.slug, name: item.name, image_url: item.image_url };
      return next;
    });
    setSearchResults([]);
    setActiveRowIdx(null);
    setSearchQuery('');
  };

  const addRow = () => setRows(prev => [...prev, { ...EMPTY_ROW }]);

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const updateGrams = (idx: number, grams: number) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], grams };
      return next;
    });
  };

  const loadQuickRecipe = async (recipe: typeof QUICK_RECIPES[0]) => {
    setResult(null);
    setError(null);
    setPreviousSnapshot(null);
    setShowAllSuggestions(false);
    setChangeLog([]);
    setImproveCount(0);
    setImproveExhausted(false);
    // Set rows immediately with slug as placeholder name
    const initial: IngredientRow[] = recipe.ingredients.map(i => ({ slug: i.slug, name: i.slug, grams: i.grams }));
    setRows(initial);
    // Fetch localized names + image_url in parallel
    try {
      const resolved = await Promise.all(
        recipe.ingredients.map(async (i) => {
          try {
            const res = await fetch(`${API_URL}/public/tools/product-search?q=${encodeURIComponent(i.slug)}&lang=${locale}&limit=1`);
            if (res.ok) {
              const data = await res.json();
              const found = (data.results || []).find((r: any) => r.slug === i.slug);
              if (found) return { name: found.name || i.slug, image_url: found.image_url as string | undefined };
            }
          } catch { /* ignore */ }
          return { name: i.slug, image_url: undefined };
        }),
      );
      setRows(recipe.ingredients.map((i, idx) => ({ slug: i.slug, name: resolved[idx].name, grams: i.grams, image_url: resolved[idx].image_url })));
    } catch { /* keep slug names */ }
  };

  // ── Add ingredient to recipe (from suggestion/diagnosis) ──
  const addIngredientToRecipe = useCallback(async (slug: string, name?: string) => {
    // Check if already in the list
    const existing = rows.find(r => r.slug === slug);
    if (existing) return;

    // Try to resolve localized name + image
    let resolvedName = name || slug;
    let imageUrl: string | undefined;
    try {
      const res = await fetch(`${API_URL}/public/tools/product-search?q=${encodeURIComponent(slug)}&lang=${locale}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        const found = (data.results || []).find((r: any) => r.slug === slug);
        if (found) {
          resolvedName = found.name || slug;
          imageUrl = found.image_url;
        }
      }
    } catch { /* ignore */ }

    // Add to rows (replace empty row if exists, otherwise append)
    setRows(prev => {
      const emptyIdx = prev.findIndex(r => !r.slug);
      const newRow: IngredientRow = { slug, name: resolvedName, grams: smartGrams(slug), image_url: imageUrl };
      if (emptyIdx >= 0) {
        const next = [...prev];
        next[emptyIdx] = newRow;
        return next;
      }
      return [...prev, newRow];
    });

    // Trigger auto re-analyze
    setPendingReanalyze(true);
  }, [rows, locale]);

  // ── Smart auto-improve: reduce bad → add good → show NET changes ──
  const handleAutoImprove = useCallback(async (slugs: string[]) => {
    if (!result) return;

    // 1. Capture "before" snapshot
    setPreviousSnapshot({
      score: result.score,
      health_score: result.diagnosis.health_score,
      calories: result.nutrition.calories,
      protein: result.nutrition.protein,
      fat: result.nutrition.fat,
      carbs: result.nutrition.carbs,
      fiber: result.nutrition.fiber,
      sugar: result.nutrition.sugar,
    });

    setShowAllSuggestions(false);
    setImproving(true);

    const reduceRules = collectReduceRules(result.diagnosis.issues);

    // ── Data-driven reduce: use actual ingredient nutrition, not hardcoded lists ──
    // For each reduce rule, find the biggest contributors in the recipe.
    const reduceSlugs = new Set<string>();
    for (const rule of reduceRules) {
      // Sort recipe ingredients by the problematic nutrient (descending)
      const sorted = [...result.ingredients]
        .filter(i => i.found)
        .sort((a, b) => {
          if (rule === 'high_fat_ratio') return b.fat - a.fat;
          if (rule === 'high_sugar')     return b.carbs - a.carbs; // sugar is part of carbs
          if (rule === 'high_carbs')     return b.carbs - a.carbs;
          return 0;
        });
      // Mark the top 1-2 contributors for reduction
      for (const ing of sorted.slice(0, 2)) {
        const nutrient = rule === 'high_fat_ratio' ? ing.fat
                       : rule === 'high_sugar'     ? ing.carbs
                       : rule === 'high_carbs'     ? ing.carbs
                       : 0;
        if (nutrient > 0) reduceSlugs.add(ing.slug);
      }
    }

    // 2. Snapshot BEFORE rows (from latest state)
    let rowsBefore: IngredientRow[] = [];
    setRows(prev => { rowsBefore = prev.map(r => ({ ...r })); return prev; });
    // Small tick to let state settle
    await new Promise(r => setTimeout(r, 50));

    // 3. Reduce grams for the biggest offenders (single pass)
    if (reduceSlugs.size > 0) {
      setRows(prev => {
        const next = [...prev];
        for (let i = 0; i < next.length; i++) {
          if (reduceSlugs.has(next[i].slug) && next[i].grams > 20) {
            const newGrams = Math.max(Math.round(next[i].grams * 0.6), 10);
            next[i] = { ...next[i], grams: newGrams };
          }
        }
        return next;
      });
    }

    // 4. Add new ingredients — skip if slug is one of the reduce targets
    const addedSlugs: { slug: string; name: string; grams: number }[] = [];
    for (const slug of slugs) {
      // Skip if this slug is one of the reduce targets
      if (reduceSlugs.has(slug)) continue;

      // Check if already in the recipe
      let alreadyExists = false;
      setRows(prev => {
        alreadyExists = prev.some(r => r.slug === slug);
        return prev;
      });
      await new Promise(r => setTimeout(r, 10));
      if (alreadyExists) continue;

      // Resolve name + image
      let resolvedName = slug;
      let imageUrl: string | undefined;
      try {
        const res = await fetch(`${API_URL}/public/tools/product-search?q=${encodeURIComponent(slug)}&lang=${locale}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          const found = (data.results || []).find((r: any) => r.slug === slug);
          if (found) { resolvedName = found.name || slug; imageUrl = found.image_url; }
        }
      } catch { /* ignore */ }

      addedSlugs.push({ slug, name: resolvedName, grams: smartGrams(slug) });

      setRows(prev => {
        const emptyIdx = prev.findIndex(r => !r.slug);
        const newRow: IngredientRow = { slug, name: resolvedName, grams: smartGrams(slug), image_url: imageUrl };
        if (emptyIdx >= 0) {
          const next = [...prev];
          next[emptyIdx] = newRow;
          return next;
        }
        return [...prev, newRow];
      });

      await new Promise(r => setTimeout(r, 100));
    }

    // 5. Build NET changelog by comparing before → after
    let rowsAfter: IngredientRow[] = [];
    setRows(prev => { rowsAfter = prev.map(r => ({ ...r })); return prev; });
    await new Promise(r => setTimeout(r, 10));

    const log: ChangeLogEntry[] = [];
    const beforeMap = new Map(rowsBefore.filter(r => r.slug).map(r => [r.slug, r]));
    const afterMap = new Map(rowsAfter.filter(r => r.slug).map(r => [r.slug, r]));

    // Reductions: existed before with MORE grams
    for (const [slug, after] of afterMap) {
      const before = beforeMap.get(slug);
      if (before && before.grams > after.grams) {
        log.push({
          type: 'reduced',
          slug,
          name: after.name || slug,
          grams: after.grams,
          delta: before.grams - after.grams,
        });
      }
    }

    // Additions: didn't exist before
    for (const [slug, after] of afterMap) {
      if (!beforeMap.has(slug)) {
        log.push({
          type: 'added',
          slug,
          name: after.name || slug,
          grams: after.grams,
        });
      }
    }

    // 6. NO-OP detection: if nothing changed → mark exhausted
    const isNoOp = log.length === 0;
    if (isNoOp) {
      setImproveExhausted(true);
      setImproving(false);
      return; // don't re-analyze, nothing changed
    }

    // 7. Increment improve counter
    setImproveCount(prev => prev + 1);

    // 8. Save changelog and trigger re-analyze
    setChangeLog(prev => {
      // On "improve more", merge with previous changelog
      if (prev.length === 0) return log;
      const merged = [...prev];
      for (const entry of log) {
        const idx = merged.findIndex(e => e.slug === entry.slug);
        if (idx >= 0) {
          // Update existing: recalculate delta from original
          merged[idx] = { ...entry, delta: entry.delta };
        } else {
          merged.push(entry);
        }
      }
      return merged;
    });
    setImproving(false);
    setPendingReanalyze(true);
  }, [result, locale]);

  // Auto re-analyze when ingredient added from suggestion/diagnosis
  const analyzeRef = useRef<((keepPrevious?: boolean) => void) | null>(null);

  // ── Analyze ──
  const analyze = async (keepPrevious = false) => {
    const validRows = rows.filter(r => r.slug && r.grams > 0);
    if (validRows.length === 0) {
      setError(t('addAtLeastOne'));
      return;
    }

    setLoading(true);
    setError(null);
    if (!keepPrevious) {
      setResult(null);
    }
    setShowAllSuggestions(false);

    // Clear previous comparison if user manually re-analyzes
    if (!keepPrevious) {
      setPreviousSnapshot(null);
      setChangeLog([]);
      setImproveCount(0);
      setImproveExhausted(false);
    }

    try {
      const res = await fetch(`${API_URL}/public/tools/recipe-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: validRows.map(r => ({ slug: r.slug, grams: r.grams })),
          portions: Math.max(1, portions),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      const data: AnalyzeResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || t('failedAnalyze'));
    } finally {
      setLoading(false);
    }
  };

  // Keep ref in sync for auto-reanalyze
  analyzeRef.current = analyze;

  // Auto re-analyze after adding ingredient from suggestion/diagnosis
  useEffect(() => {
    if (pendingReanalyze && !loading) {
      setPendingReanalyze(false);
      // If we have a snapshot, keep previous result visible during loading
      const keepPrev = !!previousSnapshot;
      const timer = setTimeout(() => analyzeRef.current?.(keepPrev), 150);
      return () => clearTimeout(timer);
    }
  }, [pendingReanalyze, loading, previousSnapshot]);

  return (
    <div className="space-y-8">
      {/* Quick recipes */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          {t('quickStart')}
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_RECIPES.map(recipe => (
            <button
              key={recipe.key}
              onClick={() => loadQuickRecipe(recipe)}
              className="px-3 py-1.5 text-sm font-semibold border border-border/60 rounded-lg hover:border-primary/40 hover:text-primary transition-colors"
            >
              {RECIPE_NAMES[recipe.key]?.[locale] || RECIPE_NAMES[recipe.key]?.en || recipe.key}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredient table */}
      <div className="border border-border/60 rounded-2xl overflow-hidden">
        <div className="bg-muted/30 px-4 py-3 border-b border-border/40">
          <div className="grid grid-cols-[1fr_100px_40px] gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <span>{t('ingredient')}</span>
            <span>{t('grams')}</span>
            <span></span>
          </div>
        </div>

        <div className="divide-y divide-border/30">
          {rows.map((row, idx) => (
            <div key={idx} className="px-4 py-3 relative">
              <div className="grid grid-cols-[1fr_100px_40px] gap-3 items-center">
                {/* Ingredient input */}
                <div className="relative flex items-center gap-2">
                  {row.image_url && <img src={row.image_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />}
                  <input
                    type="text"
                    value={activeRowIdx === idx ? searchQuery : row.name || ''}
                    onChange={(e) => {
                      setActiveRowIdx(idx);
                      setSearchQuery(e.target.value);
                      searchIngredients(e.target.value);
                    }}
                    onFocus={() => {
                      setActiveRowIdx(idx);
                      setSearchQuery(row.name || '');
                    }}
                    placeholder={t('searchPlaceholder')}
                    className="w-full px-3 py-2 text-sm bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />

                  {/* Dropdown */}
                  {activeRowIdx === idx && searchResults.length > 0 && (
                    <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-background border border-border/60 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map(item => (
                        <button
                          key={item.slug}
                          onClick={() => selectIngredient(idx, item)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"
                        >
                          {item.image_url && (
                            <img src={item.image_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                          )}
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{item.slug}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grams */}
                <input
                  type="number"
                  min={1}
                  value={row.grams}
                  onChange={(e) => updateGrams(idx, Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-center"
                />

                {/* Remove */}
                <button
                  onClick={() => removeRow(idx)}
                  disabled={rows.length <= 1}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add row + portions */}
        <div className="px-4 py-3 border-t border-border/40 flex items-center justify-between gap-4 bg-muted/20">
          <button
            onClick={addRow}
            className="flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            <Plus className="h-4 w-4" />
            {t('addIngredient')}
          </button>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t('portions')}
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={portions}
              onChange={(e) => setPortions(Number(e.target.value))}
              className="w-16 px-2 py-1.5 text-sm bg-background border border-border/50 rounded-lg text-center"
            />
          </div>
        </div>
      </div>

      {/* Analyze button */}
      <button
        onClick={() => analyze()}
        disabled={loading || rows.every(r => !r.slug)}
        className={cn(
          "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-200",
          "bg-primary text-primary-foreground hover:brightness-110",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "flex items-center justify-center gap-2"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('analyzing')}
          </>
        ) : (
          <>
            <ChefHat className="h-4 w-4" />
            {t('analyzeRecipe')}
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6 pt-4">
          {/* �‍🍳 Chef Summary — hero verdict + auto-improve */}
          {result.diagnosis && (
            <ChefSummary
              diagnosis={result.diagnosis}
              score={result.score}
              locale={locale}
              onAutoImprove={handleAutoImprove}
              improving={improving}
              previous={previousSnapshot}
              current={{
                score: result.score,
                health_score: result.diagnosis.health_score,
                calories: result.nutrition.calories,
                protein: result.nutrition.protein,
                fat: result.nutrition.fat,
                carbs: result.nutrition.carbs,
                fiber: result.nutrition.fiber,
                sugar: result.nutrition.sugar,
              }}
              changeLog={changeLog}
              improveCount={improveCount}
              improveExhausted={improveExhausted}
            />
          )}

          {/* 🔍 Grouped Diagnosis — problem → solution pairs */}
          {result.diagnosis && (
            <DiagnosisCard
              diagnosis={result.diagnosis}
              locale={locale}
            />
          )}

          {/* Nutrition + Flavor side by side */}
          <div className="grid md:grid-cols-2 gap-6">
            <NutritionCard
              nutrition={result.nutrition}
              perPortion={result.per_portion}
              portions={result.portions}
              macros={result.macros}
              score={result.score}
              diet={result.diet}
            />
            <FlavorRadar flavor={result.flavor} />
          </div>

          {/* Per-ingredient breakdown (collapsible) */}
          <details className="group border border-border/60 rounded-2xl overflow-hidden">
            <summary className="bg-muted/30 px-4 py-3 border-b border-border/40 cursor-pointer flex items-center justify-between hover:bg-muted/50 transition-colors">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {t('ingredientBreakdown')}
              </h3>
              <svg className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="text-left px-4 py-2">{t('ingredient')}</th>
                    <th className="text-right px-3 py-2">g</th>
                    <th className="text-right px-3 py-2">kcal</th>
                    <th className="text-right px-3 py-2">P</th>
                    <th className="text-right px-3 py-2">F</th>
                    <th className="text-right px-3 py-2">C</th>
                  </tr>
                </thead>
                <tbody>
                  {result.ingredients.map((ing) => (
                    <tr key={ing.slug} className="border-b border-border/20">
                      <td className="px-4 py-2 font-medium">
                        {ing.name}
                        {!ing.found && (
                          <span className="text-xs text-amber-500 ml-1">{t('notFound')}</span>
                        )}
                      </td>
                      <td className="text-right px-3 py-2 text-muted-foreground">{ing.grams}</td>
                      <td className="text-right px-3 py-2">{ing.calories}</td>
                      <td className="text-right px-3 py-2">{ing.protein}g</td>
                      <td className="text-right px-3 py-2">{ing.fat}g</td>
                      <td className="text-right px-3 py-2">{ing.carbs}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          {/* Suggestions — Top 3 + show more */}
          {result.suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black uppercase tracking-tight italic">
                  {t('improveRecipe')}
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(showAllSuggestions ? result.suggestions : result.suggestions.slice(0, 3)).map(s => (
                  <SuggestionCard
                    key={s.slug}
                    suggestion={s}
                    onAdd={(slug, name) => addIngredientToRecipe(slug, name)}
                  />
                ))}
              </div>
              {result.suggestions.length > 3 && !showAllSuggestions && (
                <button
                  onClick={() => setShowAllSuggestions(true)}
                  className="mt-3 w-full py-2.5 text-sm font-bold text-muted-foreground hover:text-primary border border-border/50 hover:border-primary/30 rounded-xl transition-all"
                >
                  {t('showMore')} ({result.suggestions.length - 3})
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
