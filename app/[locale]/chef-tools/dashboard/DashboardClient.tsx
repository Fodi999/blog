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

/* ── Modern 3D Sphere ───────────────────────────────────────── */
function ModernStatusSphere({ color, size = 'sm' }: { color: 'green' | 'yellow' | 'red'; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const colorConfigs = {
    green:  'from-emerald-400 via-emerald-500 to-emerald-600 shadow-emerald-500/20',
    yellow: 'from-amber-300 via-amber-500 to-amber-600 shadow-amber-500/20',
    red:    'from-rose-400 via-rose-500 to-rose-600 shadow-rose-500/20',
  };

  return (
    <div className={cn(
      "relative rounded-full shadow-lg bg-gradient-to-br shrink-0",
      sizeClasses,
      colorConfigs[color]
    )}>
      {/* Glossy highlight */}
      <div className="absolute top-[18%] left-[18%] w-[35%] h-[35%] rounded-full bg-white/80 blur-[0.5px]" />
      {/* Subtle outer glow */}
      <div className={cn(
        "absolute -inset-1.5 rounded-full blur-md opacity-20",
        color === 'green' && "bg-emerald-400",
        color === 'yellow' && "bg-amber-400",
        color === 'red' && "bg-rose-400"
      )} />
    </div>
  );
}


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
    icon: <ModernStatusSphere color="green" />,
    containerBase: 'border-green-500/20 bg-green-500/3 hover:border-green-500/40 hover:shadow-md hover:shadow-green-500/5',
    containerFeatured: 'border-green-500/20 bg-green-500/3',
    badge: 'bg-green-500/15 text-green-700 dark:text-green-400',
    labelKey: 'variantLabelHealthy',
    ctaKey: 'variantCtaHealthy',
  },
  balanced: {
    icon: <ModernStatusSphere color="yellow" />,
    containerBase: 'border-amber-500/50 bg-amber-500/5 hover:border-amber-500/70 hover:shadow-lg hover:shadow-amber-500/10',
    containerFeatured: 'border-amber-500/60 bg-amber-500/8 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
    labelKey: 'variantLabelBalanced',
    ctaKey: 'variantCtaBalanced',
  },
  heavy: {
    icon: <ModernStatusSphere color="red" />,
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
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3 group/score">
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 w-16 sm:w-20 shrink-0 text-right transition-colors group-hover/score:text-foreground" title={label}>
        {label}
      </span>
      <div className="flex-1 h-3 flex gap-0.5 relative">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-full rounded-[1px] transition-all duration-700",
              (i + 1) * 10 <= pct ? color : "bg-muted/10",
              (i + 1) * 10 <= pct && "opacity-90 shadow-[0_0_10px_-2px_currentColor]",
            )}
            style={{ 
              transitionDelay: `${i * 50}ms`,
              color: (i + 1) * 10 <= pct ? undefined : 'transparent' 
            }}
          />
        ))}
      </div>
      <span className="text-[10px] font-black tabular-nums text-foreground/40 w-8 text-right italic group-hover/score:text-primary transition-colors">{value}</span>
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
  locale,
}: {
  variant: RecipeVariant;
  index: number;
  visible: boolean;
  onSelect: (v: RecipeVariant) => void;
  isFeatured: boolean;
  t: (key: string) => string;
  locale: string;
}) {
  const cfg = variantConfig[variant.variant_type];
  const emoji = dishTypeEmoji[variant.dish_type] ?? '🍽';

  return (
    <div
      className={cn(
        'rounded-[2.5rem] border-2 transition-all duration-700 cursor-pointer group relative',
        isFeatured ? cfg.containerFeatured : cfg.containerBase,
        isFeatured ? 'p-10 sm:p-12' : 'p-6',
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95 pointer-events-none',
        'hover-lift hover-glow shadow-2xl shadow-black/5'
      )}
      style={{ transitionDelay: visible ? `${index * 100}ms` : '0ms' }}
      onClick={() => onSelect(variant)}
    >
      {/* ── Header ────────────────────────────────────── */}

      {/* ── Header ────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-8 pt-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-3 flex-wrap">
            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border border-white/5 shadow-inner', cfg.badge)}>
              {cfg.icon}
              {t(cfg.labelKey)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 italic">
              {emoji} {variant.dish_type.replace(/_/g, ' ')}
            </span>
          </div>
          <h2 className={cn('font-black text-foreground italic uppercase tracking-tighter leading-tight text-shimmer transition-all duration-500', isFeatured ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl')}>
            {variant.title}
          </h2>
        </div>

        {/* Calories */}
        <div className="shrink-0 text-right bg-background/20 backdrop-blur-md p-3 rounded-[1.5rem] border border-border/10 shadow-xl">
          <p className="text-sm font-black text-foreground leading-none">{variant.total_calories}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 opacity-40">{t('kcal')}</p>
        </div>
      </div>

      {/* ── Ingredients — каждый отдельно с фото ─────── */}
      {isFeatured ? (
        <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          {variant.ingredients.map(ing => {
            const rg = roleGroup[ing.role];
            return (
              <div key={ing.slug} className="flex items-center gap-4 p-3.5 rounded-[1.5rem] border border-border/10 bg-background/30 hover:bg-background/50 transition-all hover:border-primary/20 backdrop-blur-md group/ing shadow-lg hover:shadow-primary/5">
                {/* фото продукта или fallback-иконка роли */}
                <div className="relative shrink-0">
                  {ing.image_url ? (
                    <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-2xl transition-transform duration-500 group-hover/ing:scale-110">
                      <img
                        src={ing.image_url}
                        alt={ing.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <span className="w-12 h-12 flex items-center justify-center rounded-2xl bg-card border border-border/10 text-2xl shadow-xl">
                      {rg?.emoji ?? '🍴'}
                    </span>
                  )}
                  {/* Small role indicator on image */}
                  <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-background shadow-lg flex items-center justify-center bg-background", rg?.color)}>
                     <span className="text-[8px]">{rg?.emoji}</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  {rg && (
                    <p className={cn('text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1 opacity-40 italic', rg.color)}>
                      {t(rg.labelKey)}
                    </p>
                  )}
                  <p className="text-[14px] font-black text-foreground leading-tight truncate italic uppercase tracking-tight">
                    {ing.name}
                  </p>
                  {ing.grams > 0 && (
                    <p className="text-[10px] text-muted-foreground/30 font-black tracking-widest mt-1 italic">{ing.grams}г · {ing.calories} ккал</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          {variant.ingredients.map(ing => (
            <span key={ing.slug} className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-muted/30 text-muted-foreground/60 border border-border/10 hover:border-primary/20 transition-colors cursor-default">
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
        <div className="mb-10 space-y-4 p-6 rounded-[2rem] bg-background/40 border border-border/10 shadow-2xl backdrop-blur-md">
          <ScoreBar label={t('scoreBalance')}  value={variant.balance_score} color="bg-amber-500" />
          <ScoreBar label={t('scoreScore')}    value={variant.score}         color="bg-primary" />
          <ScoreBar label={t('scoreCalories')} value={Math.min(variant.total_calories, 800)} max={800} color="bg-rose-500" />
        </div>
      )}

      {/* ── Why bullets ───────────────────────────────── */}
      {isFeatured ? (
        <div className="mb-10 ml-2">
          <WhyBullets explanation={variant.explanation} />
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground italic leading-relaxed line-clamp-1 mb-4 opacity-60">
          {variant.explanation}
        </p>
      )}

      <button
        className={cn(
          'w-full px-8 py-5 rounded-[2rem] text-[15px] font-black uppercase tracking-[0.3em] transition-all italic mt-auto',
          isFeatured
            ? 'bg-primary text-primary-foreground shadow-[0_20px_50px_-15px_rgba(239,68,68,0.4)] hover:shadow-[0_20px_60px_-10px_rgba(239,68,68,0.6)] active:scale-[0.98] hover:scale-[1.01]'
            : 'bg-primary/5 text-primary hover:bg-primary/10 border-2 border-primary/20 active:scale-[0.98]',
        )}
        onClick={(e) => { e.stopPropagation(); onSelect(variant); }}
      >
        {locale === 'ru' ? 'Готовить это →' : 'Cook this →'}
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
  const [visibleCardCount, setVisibleCardCount] = useState(1);
  const [activeTab, setActiveTab] = useState<'analysis' | 'catalog'>('analysis');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [hasVariantHistory, setHasVariantHistory] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // 0–3 progressive steps
  const [backendMode, setBackendMode] = useState<'analyze' | 'build'>('build');
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* ── Tagline ──────────────────────────────────────────── */
  // Removed fade-out tagline — show static compact heading like SousChef

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
        const extras: DishIngredient[] = ingredients.slice(1).map((ing) => ({
          slug: ing.slug,
          name: ing.name,
          image_url: ing.image_url,
          role: ing.role,
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
    const extras: DishIngredient[] = v.ingredients.slice(1).map((ing) => ({
      slug: ing.slug,
      name: ing.name,
      image_url: ing.image_url,
      role: ing.role,
    }));
    setDishExtras(extras);
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
  const loadingLabels = locale === 'ru' ? [
    '⚡ Анализ вкуса...',
    '⚡ Подбор сочетаний...',
    '⚡ Создание блюд...',
  ] : [
    '⚡ Analyzing flavor profiles…',
    '⚡ Matching best pairings…',
    '⚡ Generating variants…',
  ];

  return (
    <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-20 relative">
      {/* Decorative background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[140px] rounded-full animate-pulse opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[140px] rounded-full animate-pulse-slow opacity-50" />
      </div>

      <div className="relative z-10">

      {/* ══════════════════════════════════════════════════════
          1. HERO — always visible, transforms per state
          ══════════════════════════════════════════════════════ */}
      <section className={cn(
        'transition-all duration-500 max-w-3xl mx-auto',
        isActive && !showVariants ? 'pt-2' : 'text-center pt-6',
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
                  {t('back')}
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
            {!showVariants && !isAnalyzing && mode === 'idle' && (
              <div className="text-center mb-6 animate-in fade-in duration-700">
                <h1 className="text-xl sm:text-3xl font-black text-foreground tracking-tighter leading-none text-balance break-words uppercase italic mb-2 px-4 sm:px-0">
                  {t('heroHeadline')}
                </h1>
                <p className="text-[13px] sm:text-sm text-muted-foreground/50 font-medium max-w-md mx-auto leading-relaxed text-balance px-6 sm:px-0">
                  {t('heroSub')}
                </p>
              </div>
            )}

            {/* Variant header — mode-aware */}
            {showVariants && (
                <div className="flex flex-col items-center gap-2 mb-8 mt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-lg italic transition-all duration-500',
                      backendMode === 'analyze'
                        ? 'bg-blue-500 text-white shadow-blue-500/20'
                        : 'bg-primary text-white shadow-primary/20',
                    )}>
                      {backendMode === 'analyze' ? t('modeAnalyze') : t('modeBuild')}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-foreground text-center text-shimmer leading-none py-1">
                    {t(backendMode === 'analyze' ? 'variantHeaderAnalyze' : 'variantHeaderBuild')}
                  </h1>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 text-center italic mt-1">
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
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  {[
                    { color: 'green' as const, label: t('previewHealthy') },
                    { color: 'yellow' as const, label: t('previewBalanced') },
                    { color: 'red' as const, label: t('previewIndulgent') },
                  ].map((card, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md transition-all duration-500",
                        "hover:border-primary/30 hover:bg-card/60 hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.02]",
                        "animate-in fade-in slide-in-from-bottom-2",
                      )}
                      style={{ animationDelay: `${300 + i * 150}ms` }}
                    >
                      <ModernStatusSphere color={card.color} />
                      <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-foreground/80">{card.label}</span>
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
                'animate-pulse h-32 rounded-[2rem] bg-muted/20 border border-border/10 transition-all duration-500 mt-3 relative overflow-hidden',
                i <= loadingStep
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-30 translate-y-4',
              )}
              style={{ transitionDelay: `${i * 150}ms` }}
            />
          ))}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          3. VARIANT CARDS — featured balanced first, then others
          ══════════════════════════════════════════════════════ */}
      {showVariants && (
        <section className="mt-12 animate-in fade-in duration-300">
          <p className="text-[11px] font-black italic uppercase tracking-[0.3em] text-muted-foreground/30 text-center mb-12 flex items-center justify-center gap-4">
             <span className="w-16 h-[1px] bg-border/20" />
              {locale === 'ru' ? '3 варианта блюда' : '3 variation options'}
             <span className="w-16 h-[1px] bg-border/20" />
          </p>
          
          <div className="flex flex-col gap-24 items-center w-full px-4 lg:px-12 transition-all duration-700">
            {[...variantCards]
              .sort((a, b) => {
                const order: Record<VariantType, number> = { balanced: 0, healthy: 1, heavy: 2 };
                return (order[a.variant_type] ?? 9) - (order[b.variant_type] ?? 9);
              })
              .map((v, i) => {
                const isFeatured = v.variant_type === 'balanced';
                return (
                  <div key={v.variant_type} className="w-full flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ transitionDelay: `${i * 150}ms` }}>
                    {isFeatured && (
                      <div className="animate-float">
                        <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-background/40 backdrop-blur-xl border border-primary/20 shadow-2xl shadow-primary/5 group/badge whitespace-nowrap">
                          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/80 group-hover/badge:text-primary transition-colors italic">
                            {t('variantRecommended')}
                          </span>
                        </div>
                      </div>
                    )}
                    <VariantCardUI
                      variant={v}
                      index={i}
                      visible={i < visibleCardCount}
                      onSelect={handleCardSelect}
                      isFeatured={isFeatured}
                      t={t}
                      locale={locale}
                    />
                  </div>
                );
              })}
          </div>

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
          4. SINGLE — Tabbed View (Analysis vs Catalog)
          ══════════════════════════════════════════════════════ */}
      {isActive && !showVariants && !isAnalyzing && (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Premium Tab Switcher */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex p-1.5 rounded-[2rem] bg-card/40 backdrop-blur-3xl border-2 border-border/10 shadow-2xl shadow-black/5 relative group/tabs">
              <button
                onClick={() => setActiveTab('analysis')}
                className={cn(
                  "relative z-10 px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 italic",
                  activeTab === 'analysis' ? "text-white" : "text-muted-foreground/40 hover:text-foreground"
                )}
              >
                {t('tabAnalysis')}
              </button>
              <button
                onClick={() => setActiveTab('catalog')}
                className={cn(
                  "relative z-10 px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 italic",
                  activeTab === 'catalog' ? "text-white" : "text-muted-foreground/40 hover:text-foreground"
                )}
              >
                {t('tabCatalog')}
              </button>

              {/* Animated Background Pill */}
              <div 
                className={cn(
                  "absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-primary rounded-full shadow-lg shadow-primary/20 transition-all duration-500 ease-out z-0",
                  activeTab === 'catalog' && "translate-x-full"
                )}
              />
            </div>
          </div>

          <div className="transition-all duration-500">
            {activeTab === 'analysis' ? (
              <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            ) : (
              <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <IngredientGrid onSelect={handleSelect} activeSlug={selected.slug} compact={false} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          IDLE — catalog access only on demand (clean focus)
          ══════════════════════════════════════════════════════ */}
      {mode === 'idle' && !isAnalyzing && (
        <div className="animate-in fade-in duration-700 delay-500">
          {/* Catalog behind a single subtle link — don't distract from input */}
          <div className="flex flex-col items-center gap-3 pt-4">
            <Link
              href="/chef-tools/ingredients"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/20 transition-all group"
            >
              <LayoutGrid className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
              {t('ingredientCatalogLink')}
              <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>
      )}
    </div>
  </div>
);
}
