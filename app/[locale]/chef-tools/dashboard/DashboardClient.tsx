'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { HeroSearch } from './HeroSearch';
import { SeasonNow } from './SeasonNow';
import { IngredientGrid } from './IngredientGrid';
import { SmartResult } from './SmartResult';
import { Sparkles, ArrowLeft, Flame, Leaf, AlertTriangle, ChevronDown, Zap, LayoutGrid, ArrowRight } from 'lucide-react';
import { fetchSmartFromText, type ResolvedIngredient } from '@/lib/smart-api';
import type { SmartResponse, RecipeVariant, VariantType, DishType } from '@/types/smart';
import type { DishIngredient } from './ChefBotPanel';
import { cn } from '@/lib/utils';

/* ──────────────────────────────────────────────────────────────
   Dashboard modes:
     idle   → Hero + catalog grid (landing)
     single → Single ingredient selected (old flow)
     recipe → Free-text recipe analyzed (new flow)
   ────────────────────────────────────────────────────────────── */
type Mode = 'idle' | 'single' | 'recipe';

/* ──────────────────────────────────────────────────────────────
   Variant card — uses real RecipeVariant from backend
   ────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────
   VariantCard component
   ────────────────────────────────────────────────────────────── */
/* ── Per-type visual config ─────────────────────────────────── */
const variantConfig: Record<VariantType, {
  icon: React.ReactNode;
  containerBase: string;
  containerFeatured: string;
  badge: string;
  labelKey: string;
  ctaKey: string;
}> = {
  healthy: {
    icon: <Leaf className="h-3.5 w-3.5" />,
    containerBase: 'border-green-500/20 bg-green-500/3 hover:border-green-500/40 hover:shadow-md hover:shadow-green-500/5',
    containerFeatured: 'border-green-500/20 bg-green-500/3',
    badge: 'bg-green-500/15 text-green-700 dark:text-green-400',
    labelKey: 'variantLabelHealthy',
    ctaKey: 'variantCtaHealthy',
  },
  balanced: {
    icon: <Flame className="h-3.5 w-3.5" />,
    containerBase: 'border-amber-500/50 bg-amber-500/5 hover:border-amber-500/70 hover:shadow-lg hover:shadow-amber-500/10',
    containerFeatured: 'border-amber-500/60 bg-amber-500/8 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
    labelKey: 'variantLabelBalanced',
    ctaKey: 'variantCtaBalanced',
  },
  heavy: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    containerBase: 'border-border/30 bg-muted/20 opacity-75 hover:opacity-90 hover:border-rose-500/30',
    containerFeatured: 'border-border/30 bg-muted/20',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    labelKey: 'variantLabelHeavy',
    ctaKey: 'variantCtaHeavy',
  },
};

const dishTypeEmoji: Record<DishType, string> = {
  salad: '🥗',
  bowl: '🥘',
  main_course: '🍽',
  sauce_based: '🫕',
};

/* ── Role groups — only colors, labels come from i18n ───────── */
const roleGroup: Record<string, { emoji: string; color: string; labelKey: string }> = {
  base:     { emoji: '🐟', color: 'text-blue-600 dark:text-blue-400',   labelKey: 'roleBase' },
  side:     { emoji: '🌿', color: 'text-green-600 dark:text-green-400', labelKey: 'roleSide' },
  sauce:    { emoji: '🫙', color: 'text-amber-600 dark:text-amber-400', labelKey: 'roleSauce' },
  aromatic: { emoji: '🧄', color: 'text-purple-600 dark:text-purple-400', labelKey: 'roleAromatic' },
  fat:      { emoji: '🫒', color: 'text-orange-600 dark:text-orange-400', labelKey: 'roleFat' },
};

/* ── Score bar: visual flavour balance ─────────────────────── */
function ScoreBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.round((value / max) * 5);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground/70 w-14 shrink-0 font-medium">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((dot) => (
          <span key={dot} className={cn('w-1.5 h-1.5 rounded-full', dot <= pct ? color : 'bg-muted/40')} />
        ))}
      </div>
    </div>
  );
}

/* ── Why bullets from explanation ──────────────────────────── */
function WhyBullets({ explanation }: { explanation: string }) {
  // Split on punctuation into short bullet points (max 3)
  const raw = explanation.split(/[.;!]+/).map(s => s.trim()).filter(s => s.length > 8);
  const bullets = raw.slice(0, 3);
  if (!bullets.length) return null;
  return (
    <ul className="space-y-1">
      {bullets.map((b, i) => (
        <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed">
          <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
          {b}
        </li>
      ))}
    </ul>
  );
}

/* ── The card itself ────────────────────────────────────────── */
function VariantCardUI({
  variant,
  index,
  visible,
  onSelect,
  isFeatured,
  t,
}: {
  variant: RecipeVariant;
  index: number;
  visible: boolean;
  onSelect: (v: RecipeVariant) => void;
  isFeatured: boolean;
  t: (key: string) => string;
}) {
  const cfg = variantConfig[variant.variant_type];
  const emoji = dishTypeEmoji[variant.dish_type] ?? '🍽';

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-500 cursor-pointer group relative',
        isFeatured ? cfg.containerFeatured : cfg.containerBase,
        isFeatured ? 'p-6' : 'p-4',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none',
      )}
      style={{ transitionDelay: visible ? `${index * 100}ms` : '0ms' }}
      onClick={() => onSelect(variant)}
    >
      {/* ── RECOMMENDED badge (featured only) ─────────── */}
      {isFeatured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-amber-500/30">
            <Sparkles className="h-2.5 w-2.5" />
            {t('variantRecommended')}
          </span>
        </div>
      )}

      {/* ── Header ────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider', cfg.badge)}>
              {cfg.icon}
              {t(cfg.labelKey)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground/60">
              {emoji} {variant.dish_type.replace(/_/g, ' ')}
            </span>
          </div>
          <p className={cn('font-black text-foreground leading-snug', isFeatured ? 'text-base' : 'text-sm')}>
            {variant.title}
          </p>
        </div>

        {/* Calories */}
        <div className="shrink-0 text-right">
          <p className="text-xs font-black text-foreground">{variant.total_calories}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{t('kcal')}</p>
        </div>
      </div>

      {/* ── Ingredients — каждый отдельно с фото ─────── */}
      {isFeatured ? (
        <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3">
          {variant.ingredients.map(ing => {
            const rg = roleGroup[ing.role];
            return (
              <div key={ing.slug} className="flex items-start gap-2">
                {/* фото продукта или fallback-иконка роли */}
                {ing.image_url ? (
                  <img
                    src={ing.image_url}
                    alt={ing.name}
                    className="w-8 h-8 rounded-lg object-cover shrink-0 ring-1 ring-border/30"
                  />
                ) : (
                  <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted/40 text-base shrink-0">
                    {rg?.emoji ?? '🍴'}
                  </span>
                )}
                <div className="min-w-0">
                  {rg && (
                    <p className={cn('text-[9px] font-black uppercase tracking-wider leading-none mb-0.5', rg.color)}>
                      {t(rg.labelKey)}
                    </p>
                  )}
                  <p className="text-[12px] font-semibold text-foreground leading-snug truncate">
                    {ing.name}
                  </p>
                  {ing.grams > 0 && (
                    <p className="text-[10px] text-muted-foreground/60">{ing.grams} г · {ing.calories} ккал</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {variant.ingredients.map(ing => (
            <span key={ing.slug} className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full bg-muted/50 text-muted-foreground border border-border/40">
              {ing.image_url ? (
                <img src={ing.image_url} alt={ing.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-muted text-[9px]">
                  {roleGroup[ing.role]?.emoji ?? '🍴'}
                </span>
              )}
              {ing.name}
            </span>
          ))}
        </div>
      )}

      {/* ── Visual balance bars (featured only) ────────── */}
      {isFeatured && (
        <div className="mb-4 space-y-1.5 p-3 rounded-xl bg-background/50 border border-border/20">
          <ScoreBar label={t('scoreBalance')}  value={variant.balance_score} color="bg-amber-500" />
          <ScoreBar label={t('scoreScore')}    value={variant.score}         color="bg-primary" />
          <ScoreBar label={t('scoreCalories')} value={Math.min(variant.total_calories, 800)} max={800} color="bg-rose-400" />
        </div>
      )}

      {/* ── Why bullets ───────────────────────────────── */}
      {isFeatured ? (
        <div className="mb-4">
          <WhyBullets explanation={variant.explanation} />
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-1 mb-3">
          {variant.explanation}
        </p>
      )}

      {/* ── CTA ──────────────────────────────────────── */}
      <button
        className={cn(
          'w-full px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all',
          isFeatured
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98]'
            : 'bg-muted/40 text-muted-foreground hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0',
        )}
        onClick={(e) => { e.stopPropagation(); onSelect(variant); }}
      >
        {t(cfg.ctaKey)}
      </button>
    </div>
  );
}

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
  const [_textIngredients, setTextIngredients] = useState<ResolvedIngredient[]>([]);
  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  /* ── AI variant cards ────────────────────────────────────── */
  const [variantCards, setVariantCards] = useState<RecipeVariant[]>([]);
  const [visibleCardCount, setVisibleCardCount] = useState(0);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [hasVariantHistory, setHasVariantHistory] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // 0–3 progressive steps
  const [backendMode, setBackendMode] = useState<'analyze' | 'build'>('build');
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const smartPanelRef = useRef<HTMLDivElement>(null);

  /* ── Single ingredient select (old flow) ─────────────────── */
  const handleSelect = useCallback((slug: string, name: string, image?: string | null) => {
    setSelected({ slug, name, image });
    setDishExtras([]);
    setTextResult(null);
    setTextIngredients([]);
    setAnalyzeError(null);
    setVariantCards([]);
    setVisibleCardCount(0);
    setCatalogOpen(false);
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
    setVariantCards([]);
    setVisibleCardCount(0);
    setCatalogOpen(false);
    setLoadingStep(0);
    setBackendMode('build');

    // Clear any running timers
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    // Progressive loading steps
    timerRefs.current.push(setTimeout(() => setLoadingStep(1), 600));
    timerRefs.current.push(setTimeout(() => setLoadingStep(2), 1400));
    timerRefs.current.push(setTimeout(() => setLoadingStep(3), 2200));

    try {
      const { smart, ingredients } = await fetchSmartFromText(text, locale);
      setTextResult(smart);
      setTextIngredients(ingredients);

      // Use real backend variants from Recipe Builder v2
      setVariantCards(smart.variants ?? []);
      setBackendMode(smart.mode === 'analyze' ? 'analyze' : 'build');
      setHasVariantHistory(true);

      // Staggered reveal: 0.5s → card 1, 1.2s → cards 1-2, 2.0s → all 3
      timerRefs.current.push(setTimeout(() => setVisibleCardCount(1), 500));
      timerRefs.current.push(setTimeout(() => setVisibleCardCount(2), 1200));
      timerRefs.current.push(setTimeout(() => setVisibleCardCount(3), 2000));

      // Set the primary as selected so SmartResult gets the right slug
      if (ingredients.length > 0) {
        const primary = ingredients[0];
        setSelected({ slug: primary.slug, name: primary.name, image: primary.image_url });
        // Set the rest as dish extras (for when user selects a card)
        const extras: DishIngredient[] = ingredients.slice(1).map((ing) => ({
          slug: ing.slug,
          name: ing.name,
          image_url: ing.image_url,
        }));
        setDishExtras(extras);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Analysis failed';
      setAnalyzeError(msg);
      setMode('idle');
    } finally {
      setIsAnalyzing(false);
    }
  }, [locale]);

  /* ── Card select → enter full SmartResult view ───────────── */
  const handleCardSelect = useCallback((v: RecipeVariant) => {
    // Use the first ingredient (base) as primary for the SmartResult view
    const base = v.ingredients[0];
    setSelected({ slug: base?.slug ?? '', name: v.title, image: base?.image_url });
    // Keep existing textResult — it already has the full SmartResponse
    setVariantCards([]);
    setVisibleCardCount(0);
    setCatalogOpen(false);
    setHasVariantHistory(true);
    setMode('single');
    setTimeout(() => {
      smartPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  /* ── Extra management ────────────────────────────────────── */
  const handleAddExtra = useCallback((ing: DishIngredient) => {
    setDishExtras((prev) => prev.find((e) => e.slug === ing.slug) ? prev : [...prev, ing]);
  }, []);

  const handleRemoveExtra = useCallback((slug: string) => {
    setDishExtras((prev) => prev.filter((e) => e.slug !== slug));
  }, []);

  /* ── Clear everything → back to idle ─────────────────────── */
  const handleClear = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    setSelected(null);
    setDishExtras([]);
    setTextResult(null);
    setTextIngredients([]);
    setAnalyzeError(null);
    setVariantCards([]);
    setVisibleCardCount(0);
    setCatalogOpen(false);
    setLoadingStep(0);
    setBackendMode('build');
    setMode('idle');
  }, []);

  /* Cleanup timers on unmount */
  useEffect(() => {
    return () => { timerRefs.current.forEach(clearTimeout); };
  }, []);

  /* Scroll SmartResult into view on mobile */
  useEffect(() => {
    if (mode === 'single' && smartPanelRef.current) {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        smartPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [mode, selected]);

  const isActive = mode !== 'idle' && selected;
  const showVariants = mode === 'recipe' && variantCards.length > 0 && !isAnalyzing;

  /* ── Progressive loading labels ──────────────────────────── */
  const loadingLabels = [
    '⚡ Analyzing flavor profiles…',
    '⚡ Matching best pairings…',
    '⚡ Generating variants…',
  ];

  return (
    <div className="space-y-8">

      {/* ══════════════════════════════════════════════════════
          1. HERO — always visible, transforms per state
          ══════════════════════════════════════════════════════ */}
      <section className={cn(
        'transition-all duration-500',
        isActive && !showVariants ? 'pt-2' : 'text-center pt-4 pb-2',
      )}>
        {/* ── single mode: back + compact search ─────────── */}
        {isActive && !showVariants && !isAnalyzing && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <button
              onClick={hasVariantHistory ? handleClear : handleClear}
              className="shrink-0 p-2 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-all flex items-center gap-1.5"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
              {hasVariantHistory && (
                <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">
                  Back
                </span>
              )}
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
          </div>
        )}

        {/* ── idle / variants / analyzing: big hero input ─── */}
        {(!isActive || showVariants || isAnalyzing) && (
          <div className="animate-in fade-in duration-500">
            {/* Tagline — only idle: strong "sell the magic" headline */}
            {!showVariants && !isAnalyzing && mode === 'idle' && (
              <div className="mb-8 space-y-3">
                <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                  {t('heroHeadline')}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground/70 font-medium max-w-lg mx-auto leading-relaxed">
                  {t('heroSub')}
                </p>
              </div>
            )}

            {/* Variant header — mode-aware */}
            {showVariants && (
              <div className="mb-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest',
                    backendMode === 'analyze'
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                      : 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
                  )}>
                    {backendMode === 'analyze' ? <Zap className="h-2.5 w-2.5" /> : <Sparkles className="h-2.5 w-2.5" />}
                    {t(backendMode === 'analyze' ? 'modeAnalyze' : 'modeBuild')}
                  </span>
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {t(backendMode === 'analyze' ? 'variantHeaderAnalyze' : 'variantHeaderBuild')}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                  {t(backendMode === 'analyze' ? 'modeAnalyzeDesc' : 'modeBuildDesc')}
                </p>
              </div>
            )}

            <HeroSearch
              onSelect={handleSelect}
              onSubmitText={handleSubmitText}
              onClear={handleClear}
              selectedName={selected?.name}
              isResultMode={showVariants || isAnalyzing}
            />

            {/* Idle: preview cards + clickable example */}
            {!isAnalyzing && !analyzeError && mode === 'idle' && (
              <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                {/* ── Mini preview: what you'll get ─────────── */}
                <div className="flex justify-center gap-3">
                  {[
                    { emoji: '🟢', label: t('previewHealthy'), blur: true },
                    { emoji: '🟡', label: t('previewBalanced'), blur: false },
                    { emoji: '🔴', label: t('previewIndulgent'), blur: true },
                  ].map((card, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/40 bg-muted/30 transition-all duration-500",
                        card.blur && "opacity-60 blur-[1px]",
                        !card.blur && "opacity-90 shadow-sm",
                        "animate-in fade-in slide-in-from-bottom-2",
                      )}
                      style={{ animationDelay: `${300 + i * 150}ms` }}
                    >
                      <span className="text-lg">{card.emoji}</span>
                      <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">{card.label}</span>
                    </div>
                  ))}
                </div>

                {/* ── Clickable example ────────────────────── */}
                <button
                  onClick={() => {
                    const example = t('exampleRecipe');
                    // Trigger onSubmitText directly with the example
                    handleSubmitText(example);
                  }}
                  className="group flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground/60 hover:text-primary hover:bg-primary/5 transition-all duration-200"
                >
                  <Sparkles className="h-3 w-3 group-hover:text-primary transition-colors" />
                  <span>{t('tryExample')}</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0" />
                </button>
              </div>
            )}

            {/* Error */}
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
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════
          2. ANALYZING — skeleton cards + progressive labels
          ══════════════════════════════════════════════════════ */}
      {isAnalyzing && (
        <section className="space-y-4 animate-in fade-in duration-300">
          {/* Progressive status labels */}
          <div className="flex flex-col items-center gap-2 mb-4">
            {loadingLabels.map((label, i) => (
              <p
                key={i}
                className={cn(
                  'text-xs font-bold uppercase tracking-wider transition-all duration-500',
                  i <= loadingStep
                    ? 'text-primary opacity-100 translate-y-0'
                    : 'text-muted-foreground/30 opacity-0 translate-y-2',
                )}
              >
                {label}
              </p>
            ))}
          </div>

          {/* 3 Skeleton cards */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-2xl border border-border/40 p-5 transition-all duration-500',
                i <= loadingStep
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-30 translate-y-4',
              )}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-16 rounded-full bg-muted animate-pulse" />
                    <div className="h-3 w-12 rounded-full bg-muted/60 animate-pulse" />
                  </div>
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="flex gap-1.5">
                    <div className="h-5 w-14 rounded-full bg-muted/50 animate-pulse" />
                    <div className="h-5 w-16 rounded-full bg-muted/50 animate-pulse" />
                    <div className="h-5 w-12 rounded-full bg-muted/50 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          3. VARIANT CARDS — featured balanced first, then others
          ══════════════════════════════════════════════════════ */}
      {showVariants && (
        <section className="space-y-3 animate-in fade-in duration-300">
          {/* Sort: balanced first (featured), then healthy, then heavy */}
          {[...variantCards]
            .sort((a, b) => {
              const order: Record<VariantType, number> = { balanced: 0, healthy: 1, heavy: 2 };
              return (order[a.variant_type] ?? 9) - (order[b.variant_type] ?? 9);
            })
            .map((v, i) => (
              <VariantCardUI
                key={v.variant_type}
                variant={v}
                index={i}
                visible={i < visibleCardCount}
                onSelect={handleCardSelect}
                isFeatured={v.variant_type === 'balanced'}
                t={t}
              />
            ))}

          {/* Collapsed catalog button — AI is primary, catalog is secondary */}
          {visibleCardCount >= 3 && (
            <div className="pt-6 space-y-3 animate-in fade-in duration-500">
              {/* Link to full catalog page */}
              <Link
                href="/chef-tools/ingredients"
                className="flex items-center justify-center gap-2 mx-auto px-5 py-2.5 rounded-xl border border-border/60 bg-background hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all group"
              >
                <LayoutGrid className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                  Ingredient catalog
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </Link>

              {/* Expand inline catalog */}
              {!catalogOpen ? (
                <button
                  onClick={() => setCatalogOpen(true)}
                  className="flex items-center gap-2 mx-auto text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                >
                  <ChevronDown className="h-3 w-3" />
                  or preview here
                  <ChevronDown className="h-3 w-3" />
                </button>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-px flex-1 bg-border/30" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                      Catalog
                    </p>
                    <div className="h-px flex-1 bg-border/30" />
                  </div>
                  <div className="mb-8">
                    <SeasonNow onSelect={handleSelect} />
                  </div>
                  <IngredientGrid onSelect={handleSelect} activeSlug={selected?.slug} compact={false} />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          4. SINGLE — deep analysis + sidebar
          ══════════════════════════════════════════════════════ */}
      {isActive && !showVariants && !isAnalyzing && (
        <div className="flex gap-6 items-start lg:flex-row animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* LEFT — Catalog: compact single-column list */}
          <div className="transition-all duration-500 min-w-0 lg:w-[28%] lg:shrink-0 hidden lg:block">
            <IngredientGrid onSelect={handleSelect} activeSlug={selected.slug} compact />
          </div>

          {/* RIGHT — Smart Panel */}
          <div ref={smartPanelRef} className="flex-1 min-w-0">
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

      {/* ══════════════════════════════════════════════════════
          IDLE — light popular picks + catalog on demand
          AI-first: SeasonNow as teaser, catalog behind button
          ══════════════════════════════════════════════════════ */}
      {mode === 'idle' && !isAnalyzing && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-border/30" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1.5">
              <Zap className="h-3 w-3" />
              Popular now
            </p>
            <div className="h-px flex-1 bg-border/30" />
          </div>

          {/* Light season picks */}
          <SeasonNow onSelect={handleSelect} />

          {/* ── Catalog access ─────────────────────────────── */}
          <div className="pt-8 space-y-4">
            {/* Link to full catalog page */}
            <Link
              href="/chef-tools/ingredients"
              className="flex items-center justify-center gap-2 mx-auto px-5 py-2.5 rounded-xl border border-border/60 bg-background hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all group"
            >
              <LayoutGrid className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                Ingredient catalog
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </Link>

            {/* Expand inline catalog */}
            {!catalogOpen ? (
              <button
                onClick={() => setCatalogOpen(true)}
                className="flex items-center gap-2 mx-auto text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <ChevronDown className="h-3 w-3" />
                or preview here
                <ChevronDown className="h-3 w-3" />
              </button>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px flex-1 bg-border/30" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    Catalog
                  </p>
                  <div className="h-px flex-1 bg-border/30" />
                </div>
                <IngredientGrid onSelect={handleSelect} activeSlug={selected?.slug} compact={false} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
