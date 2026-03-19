'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { HeroSearch } from './HeroSearch';
import { SeasonNow } from './SeasonNow';
import { IngredientGrid } from './IngredientGrid';
import { SmartResult } from './SmartResult';
import { Loader2, ChefHat, Sparkles, ArrowLeft } from 'lucide-react';
import { fetchSmartFromText, type ResolvedIngredient } from '@/lib/smart-api';
import type { SmartResponse } from '@/types/smart';
import type { DishIngredient } from './ChefBotPanel';

/* ──────────────────────────────────────────────────────────────
   Dashboard modes:
     idle   → Hero + catalog grid (landing)
     single → Single ingredient selected (old flow)
     recipe → Free-text recipe analyzed (new flow)
   ────────────────────────────────────────────────────────────── */
type Mode = 'idle' | 'single' | 'recipe';

export function DashboardClient() {
  const locale = useLocale();
  const t = useTranslations('chefTools.dashboard');

  /* ── Mode ────────────────────────────────────────────────── */
  const [mode, setMode] = useState<Mode>('idle');

  /* ── Single-ingredient state (old flow) ──────────────────── */
  const [selected, setSelected] = useState<{ slug: string; name: string; image?: string | null } | null>(null);

  /* ── Extra dish ingredients ──────────────────────────────── */
  const [dishExtras, setDishExtras] = useState<DishIngredient[]>([]);

  /* ── Recipe-text state (new flow) ────────────────────────── */
  const [textResult, setTextResult]     = useState<SmartResponse | null>(null);
  const [textIngredients, setTextIngredients] = useState<ResolvedIngredient[]>([]);
  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const smartPanelRef = useRef<HTMLDivElement>(null);

  /* ── Single ingredient select (old flow) ─────────────────── */
  const handleSelect = useCallback((slug: string, name: string, image?: string | null) => {
    setSelected({ slug, name, image });
    setDishExtras([]);
    setTextResult(null);
    setTextIngredients([]);
    setAnalyzeError(null);
    setMode('single');
  }, []);

  /* ── Free-text recipe submit (new flow) ──────────────────── */
  const handleSubmitText = useCallback(async (text: string) => {
    setMode('recipe');
    setIsAnalyzing(true);
    setAnalyzeError(null);
    setTextResult(null);
    setTextIngredients([]);
    setSelected(null);
    setDishExtras([]);

    try {
      const { smart, ingredients } = await fetchSmartFromText(text, locale);
      setTextResult(smart);
      setTextIngredients(ingredients);

      // Set the primary as selected so SmartResult gets the right slug
      if (ingredients.length > 0) {
        const primary = ingredients[0];
        setSelected({ slug: primary.slug, name: primary.name, image: primary.image_url });
        // Set the rest as dish extras
        const extras: DishIngredient[] = ingredients.slice(1).map((ing) => ({
          slug: ing.slug,
          name: ing.name,
          image_url: ing.image_url,
        }));
        setDishExtras(extras);
      }
    } catch (e: any) {
      setAnalyzeError(e.message || 'Analysis failed');
      setMode('idle');
    } finally {
      setIsAnalyzing(false);
    }
  }, [locale]);

  /* ── Extra management ────────────────────────────────────── */
  const handleAddExtra = useCallback((ing: DishIngredient) => {
    setDishExtras((prev) => prev.find((e) => e.slug === ing.slug) ? prev : [...prev, ing]);
  }, []);

  const handleRemoveExtra = useCallback((slug: string) => {
    setDishExtras((prev) => prev.filter((e) => e.slug !== slug));
  }, []);

  /* ── Clear everything → back to idle ─────────────────────── */
  const handleClear = useCallback(() => {
    setSelected(null);
    setDishExtras([]);
    setTextResult(null);
    setTextIngredients([]);
    setAnalyzeError(null);
    setMode('idle');
  }, []);

  /* Scroll SmartResult into view on mobile */
  useEffect(() => {
    if (mode !== 'idle' && smartPanelRef.current) {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        smartPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [mode, selected]);

  const isActive = mode !== 'idle' && selected;

  return (
    <div className="space-y-8">

      {/* ══════════════════════════════════════════════════════
          HERO AREA — transforms based on mode
          ══════════════════════════════════════════════════════ */}
      {mode === 'idle' && (
        <section className="text-center pt-4 pb-2 animate-in fade-in duration-500">
          <p className="text-sm font-bold uppercase tracking-widest text-primary mb-6">
            {t('tagline')}
          </p>
          <HeroSearch
            onSelect={handleSelect}
            onSubmitText={handleSubmitText}
            onClear={handleClear}
            selectedName={selected?.name}
          />

          {/* Empty state hint */}
          {!isAnalyzing && !analyzeError && (
            <div className="mt-8 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider">
                Try: <span className="text-foreground/70">salmon rice avocado</span>
              </p>
            </div>
          )}

          {/* Error state */}
          {analyzeError && (
            <div className="mt-6 text-center animate-in fade-in duration-300">
              <p className="text-sm text-rose-500 font-bold">{t('noIngredientsFound')}</p>
              <button
                onClick={handleClear}
                className="mt-2 text-xs text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-wider"
              >
                {t('tryAgain')}
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Analyzing loading screen (full-page takeover) ── */}
      {isAnalyzing && (
        <section className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-300">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
              <ChefHat className="h-7 w-7 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-lg font-black uppercase tracking-wider text-foreground mb-2">
            {t('buildingRecipe')}
          </p>
          <div className="flex gap-1.5">
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
        </section>
      )}

      {/* ── Result mode header (compact search + back) ─────── */}
      {isActive && !isAnalyzing && (
        <section className="flex items-center gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <button
            onClick={handleClear}
            className="shrink-0 p-2 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <HeroSearch
              onSelect={handleSelect}
              onSubmitText={handleSubmitText}
              onClear={handleClear}
              selectedName={selected?.name}
              isResultMode
            />
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ══════════════════════════════════════════════════════ */}

      {/* ── Idle: Show catalog ─────────────────────────────── */}
      {mode === 'idle' && !isAnalyzing && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
            <SeasonNow onSelect={handleSelect} />
          </div>
          <IngredientGrid onSelect={handleSelect} activeSlug={selected?.slug} compact={false} />
        </div>
      )}

      {/* ── Active: Split layout ───────────────────────────── */}
      {isActive && !isAnalyzing && (
        <div className="flex gap-6 items-start lg:flex-row animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* LEFT — Catalog: compact single-column list */}
          <div className="transition-all duration-500 min-w-0 lg:w-[28%] lg:shrink-0 hidden lg:block">
            <IngredientGrid onSelect={handleSelect} activeSlug={selected?.slug} compact />
          </div>

          {/* RIGHT — Smart Panel */}
          <div
            ref={smartPanelRef}
            className="flex-1 min-w-0"
          >
            <SmartResult
              slug={selected.slug}
              name={selected.name}
              primaryImage={selected.image}
              dishExtras={dishExtras}
              fromTextResult={textResult}
              onAddExtra={handleAddExtra}
              onRemoveExtra={handleRemoveExtra}
              onSelectIngredient={handleSelect}
              onClose={handleClear}
            />
          </div>
        </div>
      )}
    </div>
  );
}
