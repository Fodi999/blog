'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, ChefHat, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { API_URL } from '@/lib/api';
import { FlavorRadar } from './FlavorRadar';
import { NutritionCard } from './NutritionCard';
import { SuggestionCard } from './SuggestionCard';
import { cn } from '@/lib/utils';

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
  suggestions: SuggestionItem[];
  ingredients: IngredientDetail[];
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

  // ── Analyze ──
  const analyze = async () => {
    const validRows = rows.filter(r => r.slug && r.grams > 0);
    if (validRows.length === 0) {
      setError(t('addAtLeastOne'));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

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
        onClick={analyze}
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
        <div className="space-y-8 pt-4">
          {/* Per-ingredient breakdown */}
          <div className="border border-border/60 rounded-2xl overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 border-b border-border/40">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {t('ingredientBreakdown')}
              </h3>
            </div>
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
          </div>

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

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black uppercase tracking-tight italic">
                  {t('improveRecipe')}
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.suggestions.map(s => (
                  <SuggestionCard key={s.slug} suggestion={s} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
