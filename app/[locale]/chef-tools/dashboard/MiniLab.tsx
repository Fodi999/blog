'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, Plus, Trash2, FlaskConical, Minus, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { searchProducts, analyzeRecipe, type SearchResult, type RecipeAnalysisResult } from '@/lib/tools';

type LabIngredient = { slug: string; name: string; grams: number; image_url?: string | null };

type MiniLabProps = {
  slug: string;
  name: string;
  cookingState?: string;
  onSelectIngredient?: (slug: string, name: string) => void;
};

export function MiniLab({ slug, name, cookingState, onSelectIngredient }: MiniLabProps) {
  const locale = useLocale();
  const t = useTranslations('chefTools.dashboard');

  /* Level 1 = compact list + analyze; Level 2 = full add/search/portions UI */
  const [expanded, setExpanded] = useState(false);

  const [ingredients, setIngredients] = useState<LabIngredient[]>([{ slug, name, grams: 100 }]);
  const [portions, setPortions] = useState(1);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [result, setResult] = useState<RecipeAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  /* Live search */
  useEffect(() => {
    if (search.length < 2) { setSearchResults([]); return; }
    let cancelled = false;
    setSearching(true);
    searchProducts(search, locale, 6).then((r) => {
      if (!cancelled) setSearchResults(r);
    }).finally(() => { if (!cancelled) setSearching(false); });
    return () => { cancelled = true; };
  }, [search, locale]);

  /* Reset result when ingredients/portions change */
  useEffect(() => { setResult(null); }, [ingredients, portions]);

  /* Sync main ingredient if slug/state changes */
  useEffect(() => {
    setIngredients([{ slug, name, grams: 100 }]);
    setResult(null);
    setExpanded(false);
  }, [slug, name, cookingState]);

  const addIngredient = (r: SearchResult) => {
    if (!ingredients.find((i) => i.slug === r.slug)) {
      setIngredients((prev) => [...prev, { slug: r.slug, name: r.name, grams: 100, image_url: r.image_url }]);
    }
    setSearch('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const removeIngredient = (s: string) => {
    if (s === slug) return;
    setIngredients((prev) => prev.filter((i) => i.slug !== s));
  };

  const updateGrams = (s: string, g: number) => {
    setIngredients((prev) => prev.map((i) => i.slug === s ? { ...i, grams: Math.max(1, g) } : i));
  };

  const analyze = async () => {
    setAnalyzing(true);
    setResult(null);
    const data = await analyzeRecipe(
      ingredients.map((i) => ({
        slug: i.slug,
        grams: i.grams,
        ...(i.slug === slug && cookingState && cookingState !== 'raw' ? { state: cookingState } : {}),
      })),
      portions,
      locale,
    );
    setResult(data as RecipeAnalysisResult | null);
    setAnalyzing(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">

      {/* ── LEVEL 1: Compact ingredient list ──────────────────── */}
      <div className="space-y-2">
        {ingredients.map((ing) => (
          <div key={ing.slug} className="flex items-center gap-2 p-2 rounded-xl border border-border/50 bg-muted/20">
            {ing.image_url ? (
              <img src={ing.image_url} alt={ing.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
            )}
            <span className="flex-1 text-sm font-bold text-foreground truncate">{ing.name}</span>

            {/* Grams: full controls when expanded, read-only label when collapsed */}
            {expanded ? (
              <div className="flex items-center gap-1.5 shrink-0 bg-background/50 rounded-xl p-1 border border-border/20 shadow-inner">
                <button
                  onClick={() => updateGrams(ing.slug, ing.grams - 10)}
                  className="w-7 h-7 rounded-lg bg-muted/40 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={ing.grams}
                  onChange={(e) => updateGrams(ing.slug, parseInt(e.target.value) || 1)}
                  className="w-14 text-center text-sm font-black tabular-nums bg-transparent focus:outline-none"
                />
                <span className="text-[10px] text-muted-foreground/40 font-black uppercase mr-1">g</span>
                <button
                  onClick={() => updateGrams(ing.slug, ing.grams + 10)}
                  className="w-7 h-7 rounded-lg bg-muted/40 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <span className="text-[11px] font-mono text-muted-foreground shrink-0">{ing.grams}g</span>
            )}

            {ing.slug !== slug && (
              <button
                onClick={() => removeIngredient(ing.slug)}
                className="text-muted-foreground hover:text-destructive transition-colors ml-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── Expand / Collapse toggle ──────────────────────────── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors w-full justify-center py-1"
      >
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {expanded ? t('collapseLab') : t('expandLab')}
      </button>

      {/* ── LEVEL 2: Full controls (visible only when expanded) ── */}
      {expanded && (
        <div className="space-y-4">
          {/* Add ingredient search */}
          <div className="relative">
            {!showSearch ? (
              <button
                onClick={() => setShowSearch(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-border/40 text-muted-foreground/60 hover:border-primary/40 hover:text-primary transition-all text-[11px] font-black uppercase tracking-[0.2em] w-full justify-center bg-card/20"
              >
                <Plus className="h-4 w-4" />
                {t('addIngredient')}
              </button>
            ) : (
              <div>
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onBlur={() => { if (!search) setShowSearch(false); }}
                  placeholder={t('searchIngredients')}
                  className="w-full px-3 py-2 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-border/60 bg-background/95 backdrop-blur shadow-lg overflow-hidden">
                    {searching && (
                      <div className="px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {searchResults.map((r) => (
                      <button
                        key={r.slug}
                        onMouseDown={() => addIngredient(r)}
                        className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors w-full text-left"
                      >
                        {r.image_url ? (
                          <img src={r.image_url} alt={r.name} className="w-7 h-7 rounded-md object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-md bg-muted" />
                        )}
                        <span className="text-sm font-bold text-foreground">{r.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{r.product_type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Portions control */}
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <span>{t('portions')}:</span>
            <button
              onClick={() => setPortions(Math.max(1, portions - 1))}
              className="w-6 h-6 rounded-md bg-muted/50 hover:bg-muted flex items-center justify-center"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-6 text-center font-mono text-foreground">{portions}</span>
            <button
              onClick={() => setPortions(portions + 1)}
              className="w-6 h-6 rounded-md bg-muted/50 hover:bg-muted flex items-center justify-center"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Analyze button (always at Level 1) ────────────────── */}
      <button
        onClick={analyze}
        disabled={analyzing}
        className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary text-primary-foreground text-[13px] font-black uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 w-full shadow-xl shadow-primary/10"
      >
        {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <FlaskConical className="h-5 w-5" />}
        {analyzing ? t('analyzing') : t('analyzeRecipe')}
      </button>

      {/* ── Results ───────────────────────────────────────────── */}
      {result && (() => {
        const pp = result.per_portion ?? result.nutrition;
        if (!pp) return null;
        return (
          <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-6 space-y-5 animate-in fade-in duration-700 shadow-xl shadow-primary/5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { label: t('calories'), value: Math.round(pp.calories),                         unit: 'kcal', color: 'text-primary' },
                { label: t('protein'),  value: Math.round((pp.protein ?? 0) * 10) / 10,         unit: 'g',    color: 'text-blue-500' },
                { label: t('fat'),      value: Math.round((pp.fat ?? 0) * 10) / 10,             unit: 'g',    color: 'text-amber-500' },
                { label: t('carbs'),    value: Math.round((pp.carbs ?? 0) * 10) / 10,           unit: 'g',    color: 'text-emerald-500' },
              ].map(({ label, value, unit, color }) => (
                <div key={label} className="rounded-2xl bg-card/60 backdrop-blur-md p-3 border border-border/40 shadow-sm transition-transform hover:scale-105">
                  <p className={`text-base font-black tabular-nums tracking-tighter ${color}`}>{value}</p>
                  <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest">{unit}</p>
                  <p className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-[0.2em] mt-1 border-t border-border/10 pt-1">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-bold">{t('score')}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 rounded-full bg-muted/40 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${result.score}%` }} />
                </div>
                <span className="text-xs font-black text-primary tabular-nums">{result.score}/100</span>
              </div>
            </div>

            {result.suggestions && result.suggestions.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  {t('labSuggestions')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.suggestions.slice(0, 4).map((s) => (
                    <button
                      key={s.slug}
                      onClick={() => onSelectIngredient?.(s.slug, s.name)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border/50 bg-muted/30 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                    >
                      {s.image_url ? (
                        <img src={s.image_url} alt={s.name} className="w-5 h-5 rounded-md object-cover shrink-0" />
                      ) : null}
                      <span className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors">
                        {s.name}
                      </span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
