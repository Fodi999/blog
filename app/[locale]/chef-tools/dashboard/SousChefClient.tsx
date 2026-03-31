'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  ChefHat, Sparkles, ArrowRight, ChevronDown, ChevronUp,
  Flame, Zap, Heart, UtensilsCrossed, Leaf, Paperclip, Mic, Scale,
} from 'lucide-react';
import {
  fetchSousChefPlan,
  fetchSousChefSuggestions,
  type MealPlan,
  type Suggestion,
} from '@/lib/sous-chef-api';

const goalMeta: Record<string, { icon: typeof Flame }> = {
  weight_loss:      { icon: Flame },
  high_protein:     { icon: Zap },
  quick_breakfast:  { icon: Zap },
  from_ingredients: { icon: UtensilsCrossed },
  healthy_day:      { icon: Leaf },
};

const levelStyles: Record<string, { ring: string; bg: string; text: string; glow: string; dot: string }> = {
  light:    { ring: 'ring-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-600 dark:text-emerald-400', glow: 'shadow-emerald-500/5',  dot: 'bg-emerald-500' },
  balanced: { ring: 'ring-blue-500/20',    bg: 'bg-blue-500/5',    text: 'text-blue-600 dark:text-blue-400',       glow: 'shadow-blue-500/10', dot: 'bg-blue-500' },
  rich:     { ring: 'ring-amber-500/20',   bg: 'bg-amber-500/5',   text: 'text-amber-600 dark:text-amber-400',     glow: 'shadow-amber-500/5',  dot: 'bg-amber-500' },
};

/** Parse weight from ingredient amounts (г/g + мл/ml). Skips "шт", "ст.л." etc. */
function parseTotalWeight(ingredients: { amount: string }[]): number {
  let total = 0;
  for (const ing of ingredients) {
    const a = ing.amount.toLowerCase().trim();
    // Match: "150г", "80g", "250мл", "250ml"
    const m = a.match(/^([\d.,]+)\s*(г|g|гр|мл|ml)/);
    if (m) {
      total += parseFloat(m[1].replace(',', '.'));
    }
  }
  return Math.round(total);
}

export function SousChefClient() {
  const locale = useLocale();
  const t = useTranslations('chefTools.sousChef');

  const [query, setQuery] = useState('');
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeLevel, setActiveLevel] = useState<string>('balanced');
  const [contentVisible, setContentVisible] = useState(false);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);

  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSousChefSuggestions(locale).then(setSuggestions).catch(() => {});
  }, [locale]);

  useEffect(() => () => { timerRefs.current.forEach(clearTimeout); }, []);

  // Auto-resize textarea: grow up to 3 lines, then scroll
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
    const maxHeight = lineHeight * 3 + 20; // 3 lines + padding
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [query]);

  const handleSubmit = useCallback(async (text?: string) => {
    const q = (text ?? query).trim();
    if (!q || q.length < 3) return;

    setLoading(true);
    setError(null);
    setPlan(null);
    setLoadingStep(0);
    setActiveLevel('balanced');
    setContentVisible(false);
    setIngredientsOpen(false);
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    timerRefs.current.push(setTimeout(() => setLoadingStep(1), 500));
    timerRefs.current.push(setTimeout(() => setLoadingStep(2), 1200));
    timerRefs.current.push(setTimeout(() => setLoadingStep(3), 2000));

    try {
      const result = await fetchSousChefPlan(q, locale);
      setPlan(result);
      timerRefs.current.push(setTimeout(() => setContentVisible(true), 200));
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [query, locale]);

  const handleClear = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    setPlan(null);
    setQuery('');
    setError(null);
    setLoadingStep(0);
    setActiveLevel('balanced');
    setContentVisible(false);
    setIngredientsOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const isIdle = !plan && !loading && !error;
  const hasResult = !!plan && !loading;

  return (
    // Outer wrapper — content scrolls, fixed island always visible at bottom
    <div className="relative min-h-[calc(100dvh-180px)]">

      {/* ═══ SCROLL AREA — results / loading / idle teasers ══════ */}
      <div
        ref={topRef}
        className={cn(
          'pb-40 transition-all duration-500',
          isIdle && 'min-h-[45vh] flex flex-col items-center justify-center',
        )}
      >

        {/* IDLE */}
            {isIdle && (
          <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-1000 px-2">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-6">
                <ChefHat className="h-6 w-6 text-primary/80" />
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight text-balance uppercase italic">
                {t('heroHeadline')}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground/60 max-w-lg mx-auto leading-relaxed text-balance font-medium">
                {t('heroSub')}
              </p>
            </div>

            {suggestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {suggestions.map((s, i) => {
                  const meta = goalMeta[s.goal];
                  const Icon = meta?.icon || Sparkles;
                  return (
                    <button
                      key={i}
                      onClick={() => { setQuery(s.text); handleSubmit(s.text); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/20 bg-muted/10 hover:bg-primary/5 hover:border-primary/20 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-95 group"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary/60 transition-colors" />
                      <span className="truncate">{s.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              {[
                { label: t('previewLight'),    style: levelStyles.light },
                { label: t('previewBalanced'), style: levelStyles.balanced },
                { label: t('previewRich'),     style: levelStyles.rich },
              ].map((card, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border border-border/10 bg-muted/5 opacity-40 grayscale',
                  )}
                >
                  <div className={cn('w-1.5 h-1.5 rounded-full', card.style.dot)} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{card.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="text-center py-8 animate-in fade-in duration-300">
            <p className="text-sm text-rose-500 font-bold">{error}</p>
            <button onClick={handleClear} className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
              {t('tryAgain')}
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="space-y-4 animate-in fade-in duration-300 max-w-2xl mx-auto">
            <div className="flex flex-col items-center gap-1.5 mb-4">
              {[t('loading1'), t('loading2'), t('loading3')].map((label, i) => (
                <p key={i} className={cn(
                  'text-xs font-bold uppercase tracking-wider transition-all duration-500',
                  i <= loadingStep ? 'text-primary opacity-100' : 'text-muted-foreground/20 opacity-0',
                )}>
                  {label}
                </p>
              ))}
            </div>
            <div className="animate-pulse rounded-3xl bg-muted/20 h-48 transition-all duration-500" />
            <div className="animate-pulse rounded-2xl bg-muted/15 h-20 transition-all duration-500" style={{ animationDelay: '150ms' }} />
          </div>
        )}

        {/* RESULT — Opinionated AI: 1 main card + quick variation buttons */}
        {hasResult && (() => {
          const mainVariant = plan.variants.find(v => v.level === activeLevel) ?? plan.variants[0];
          const altVariants = plan.variants.filter(v => v.level !== activeLevel);
          const style = levelStyles[mainVariant.level] ?? levelStyles.balanced;

          return (
            <div className={cn(
              'space-y-6 max-w-2xl mx-auto transition-all duration-700',
              contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            )}>
              {/* Chef intro */}
              {plan.chef_intro && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/20 border border-border/10">
                  <div className="shrink-0 w-8 h-8 rounded-2xl bg-primary/5 flex items-center justify-center mt-0.5">
                    <ChefHat className="h-4 w-4 text-primary/80" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1">{t('chefSays')}</p>
                    <p className="text-sm text-foreground leading-relaxed font-medium">{plan.chef_intro}</p>
                  </div>
                </div>
              )}

              {plan.cached && (
                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/5 text-[9px] font-bold uppercase tracking-[0.15em] text-primary/60">
                    <Zap className="h-2.5 w-2.5" />{t('cachedBadge')}
                  </span>
                </div>
              )}

              {/* ═══ MAIN CARD ═══ */}
              <div className={cn(
                'rounded-3xl border p-6 sm:p-8 ring-1 transition-all duration-500',
                style.ring, 'border-transparent shadow-2xl', style.glow,
                'bg-background/80 backdrop-blur-sm',
              )}>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn('w-2 h-12 rounded-full shrink-0', style.dot)} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className={cn('text-2xl sm:text-3xl font-black tracking-tighter leading-none uppercase italic', style.text)}>
                          {mainVariant.title}
                        </h3>
                        <span className={cn('px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]', style.bg, style.text)}>
                          {t('recommended')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground/60 leading-snug mt-2 font-medium">
                        {mainVariant.short_description}
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-2xl tabular-nums tracking-tighter italic text-foreground shrink-0">
                    {mainVariant.calories}<span className="text-xs ml-0.5 opacity-30 not-italic uppercase tracking-widest">{t('kcal')}</span>
                  </span>
                </div>

                {/* Total weight per serving */}
                {(() => {
                  const totalW = parseTotalWeight(mainVariant.ingredients);
                  if (totalW <= 0) return null;
                  const unit = ['ru', 'uk'].includes(plan.lang) ? 'г' : 'g';
                  return (
                    <div className="flex items-center gap-2 mb-4 -mt-2">
                      <Scale className="h-3.5 w-3.5 text-muted-foreground/30" />
                      <span className="text-sm font-bold tabular-nums text-muted-foreground/50">
                        {totalW}<span className="text-[10px] ml-0.5 opacity-60">{unit}</span>
                        <span className="text-[10px] ml-1.5 font-medium opacity-40">{t('perServing')}</span>
                      </span>
                    </div>
                  );
                })()}

                {/* Ingredient Photos */}
                {mainVariant.ingredients.some(ing => ing.image_url) && (
                  <div className="flex gap-3 mb-6">
                    {mainVariant.ingredients.filter(ing => ing.image_url).map((ing, i) => (
                      <div key={i} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-border/10 bg-muted/20 shrink-0 group/photo">
                        <Image
                          src={ing.image_url!}
                          alt={ing.name}
                          fill
                          sizes="80px"
                          className="object-cover transition-transform duration-500 group-hover/photo:scale-110"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <span className="absolute bottom-1.5 left-0 right-0 text-center text-[8px] font-black text-white/90 uppercase tracking-wide leading-none px-1 truncate">
                          {ing.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Macros */}
                <div className="space-y-2 mb-6">
                  <MacroBar label={t('proteinShort')} value={mainVariant.protein_g} max={80}  color="bg-blue-500" />
                  <MacroBar label={t('fatShort')}     value={mainVariant.fat_g}     max={60}  color="bg-amber-500" />
                  <MacroBar label={t('carbsShort')}   value={mainVariant.carbs_g}   max={120} color="bg-emerald-500" />
                </div>

                {/* Ingredients list — collapsible */}
                <button
                  onClick={() => setIngredientsOpen(!ingredientsOpen)}
                  className="flex items-center gap-2 w-full text-left group"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                    {t('ingredientsList')}
                  </p>
                  {ingredientsOpen
                    ? <ChevronUp className="h-3 w-3 text-muted-foreground/30" />
                    : <ChevronDown className="h-3 w-3 text-muted-foreground/30" />
                  }
                </button>

                {ingredientsOpen && (
                  <div className="mt-3 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    {mainVariant.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {ing.image_url ? (
                          <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-border/10 shrink-0">
                            <Image
                              src={ing.image_url}
                              alt={ing.name}
                              fill
                              sizes="36px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className={cn('w-9 h-9 rounded-xl shrink-0 flex items-center justify-center', style.bg)}>
                            <div className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{ing.name}</p>
                          <p className="text-[10px] text-muted-foreground/50 tabular-nums">{ing.amount}</p>
                        </div>
                        <span className="text-[10px] font-bold tabular-nums text-muted-foreground/40 shrink-0">
                          {ing.calories} <span className="opacity-60">{t('kcal')}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ═══ QUICK VARIATION BUTTONS ═══ */}
              {altVariants.length > 0 && (
                <div className="text-center space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
                    {t('altSection')}
                  </p>
                  <div className="flex justify-center gap-2">
                    {altVariants.map((v) => {
                      const vs = levelStyles[v.level] ?? levelStyles.balanced;
                      return (
                        <button
                          key={v.level}
                          onClick={() => { setActiveLevel(v.level); setIngredientsOpen(false); }}
                          className={cn(
                            'flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all',
                            'hover:scale-105 active:scale-95',
                            'border-border/20 bg-muted/5 hover:border-border/40',
                          )}
                        >
                          <div className={cn('w-2 h-2 rounded-full', vs.dot)} />
                          <span className={cn('text-xs font-bold', vs.text)}>
                            {v.title}
                          </span>
                          <span className="text-[10px] tabular-nums text-muted-foreground/40">
                            {v.calories} {t('kcal')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Why this works */}
              {plan.explanation && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/10 border border-border/10">
                  <Heart className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">{t('whyThisWorks')}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{plan.explanation}</p>
                  </div>
                </div>
              )}

              {plan.motivation && (
                <p className="text-xs text-muted-foreground/40 text-center leading-relaxed px-4">
                  {plan.motivation}
                </p>
              )}
            </div>
          );
        })()}
      </div>

      {/* ═══ FIXED BOTTOM ISLAND — Modern 2026 AI HUD ═════ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Soft background gradient behind input */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none h-40 mt-auto" />

        <div className="w-full max-w-2xl relative px-4 pb-8 pointer-events-auto">
          
          {/* Quick Suggestions - Right above input when idle or query is short */}
          {!loading && query.length < 5 && suggestions.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {suggestions.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(s.text); handleSubmit(s.text); }}
                  className="px-3 py-1.5 rounded-full border border-border/20 bg-background/50 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:border-primary/30 transition-all hover:scale-105 active:scale-95"
                >
                  {s.text}
                </button>
              ))}
            </div>
          )}

          {/* Main Input Pod */}
          <div className={cn(
            "relative group transition-all duration-500",
            "rounded-[2.5rem] border border-border/40 bg-background/80 backdrop-blur-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]",
            "focus-within:border-primary/30 focus-within:shadow-[0_8px_50px_-12px_rgba(var(--primary),0.15)] focus-within:scale-[1.01]"
          )}>
            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('placeholder')}
              rows={1}
              className={cn(
                'w-full resize-none bg-transparent px-6 pt-5 pb-14',
                'text-base font-medium placeholder:text-muted-foreground/30',
                'focus:outline-none transition-all duration-300 overflow-hidden',
                loading && 'opacity-50 pointer-events-none',
              )}
            />
            
            {/* Action Bar inside textarea */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-1 pointer-events-auto pl-2">
                <button className="p-2 rounded-full text-muted-foreground/30 hover:text-primary hover:bg-primary/5 transition-colors">
                  <Paperclip className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-full text-muted-foreground/30 hover:text-primary hover:bg-primary/5 transition-colors">
                  <Mic className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => handleSubmit()}
                disabled={loading || query.trim().length < 3}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-full transition-all pointer-events-auto',
                  'bg-foreground text-background dark:bg-primary dark:text-primary-foreground',
                  'hover:opacity-90 hover:shadow-lg active:scale-95',
                  'disabled:opacity-10 disabled:grayscale disabled:pointer-events-none',
                )}
              >
                <span className="text-[11px] font-black uppercase tracking-[0.1em]">{t('generate')}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* New Search link when results are visible */}
          {hasResult && (
            <div className="flex justify-center mt-3">
              <button
                onClick={handleClear}
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30 hover:text-primary transition-colors"
              >
                {t('newSearch')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Macro Bar ─────────────────────────────────────────────────────────────────

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground w-7">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums text-muted-foreground w-7 text-right">{value}</span>
    </div>
  );
}
