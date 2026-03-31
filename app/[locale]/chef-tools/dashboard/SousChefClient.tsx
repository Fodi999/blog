'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Sparkles, ArrowRight, ChevronDown, ChevronUp,
  Flame, Zap, Heart, UtensilsCrossed, Leaf, Scale, RotateCcw,
  Paperclip, Mic
} from 'lucide-react';
import {
  fetchSousChefPlan,
  fetchSousChefSuggestions,
  type MealPlan,
  type Suggestion,
} from '@/lib/sous-chef-api';

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
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSousChefSuggestions(locale).then(setSuggestions).catch(() => {});
  }, [locale]);

  useEffect(() => () => { timerRefs.current.forEach(clearTimeout); }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    
    // Smooth auto-grow
    el.style.height = '0px'; // Reset to get scrollHeight
    const scrollHeight = el.scrollHeight;
    const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
    const maxHeight = lineHeight * 10 + 20; // Increased max height
    
    const newHeight = Math.min(Math.max(scrollHeight, 44), maxHeight);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [query]);

  // Auto-focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

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
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const isIdle = !plan && !loading && !error;
  const hasResult = !!plan && !loading;

  return (
    <div className="max-w-2xl mx-auto">
      
      {/* ═══ INPUT-FIRST HERO — compact, focused ═══ */}
      <div className={cn(
        'transition-all duration-500',
        isIdle ? 'pt-8 sm:pt-16' : 'pt-4',
      )}>
        {/* Mini branding — only when idle */}
        {isIdle && (
          <div className="text-center mb-10 animate-in fade-in duration-1000">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter leading-none italic mb-4 text-shimmer">
              {t('heroHeadline')}<span className="text-primary not-italic">.</span>
            </h2>
            <p className="text-sm text-muted-foreground/60 max-w-md mx-auto font-medium tracking-tight">
              {t('heroSub')}
            </p>
          </div>
        )}

        {/* ═══ INPUT POD — always visible, inline (not fixed) ═══ */}
        <div className={cn(
          "relative group transition-all duration-700",
          "rounded-[2.5rem] border bg-card/60 dark:bg-card/40 backdrop-blur-3xl",
          "border-border/40 shadow-2xl",
          "focus-within:border-primary/50 focus-within:shadow-primary/10",
          "hover:border-primary/20"
        )}>
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder')}
            rows={1}
            className={cn(
              'w-full resize-none bg-transparent px-5 pt-4 pb-14',
              'text-base font-medium placeholder:text-muted-foreground/30',
              'focus:outline-none transition-[height] duration-500 ease-in-out overflow-hidden',
              loading && 'opacity-50 pointer-events-none',
            )}
          />
          
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            {/* Left: icons & hint */}
            <div className="flex items-center gap-1.5 pl-1">
              <button className="p-1.5 text-muted-foreground/20 hover:text-primary transition-colors">
                <Paperclip className="h-4 w-4" />
              </button>
              <button className="p-1.5 text-muted-foreground/20 hover:text-primary transition-colors">
                <Mic className="h-4 w-4" />
              </button>
              <span className="text-[10px] text-muted-foreground/20 font-medium ml-1 hidden sm:block">
                {t('enterHint')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {hasResult && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-all duration-500"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-[11px] font-black uppercase tracking-widest">{t('newSearch')}</span>
                </button>
              )}
              <button
                onClick={() => handleSubmit()}
                disabled={loading || query.trim().length < 3}
                className={cn(
                  'flex items-center gap-2.5 px-7 py-3 rounded-2xl transition-all duration-500',
                  'bg-primary text-primary-foreground',
                  'hover:opacity-100 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95',
                  'disabled:opacity-10 disabled:pointer-events-none disabled:grayscale',
                )}
              >
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t('generate')}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ═══ QUICK SUGGESTIONS — right below input ═══ */}
        {!loading && query.length < 5 && suggestions.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {suggestions.slice(0, 3).map((s, i) => (
              <button
                key={i}
                onClick={() => { setQuery(s.text); handleSubmit(s.text); }}
                className="px-3.5 py-2 rounded-xl border border-border/30 bg-muted/10 text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all hover:scale-[1.03] active:scale-95"
              >
                {s.text}
              </button>
            ))}
          </div>
        )}

        {/* Level preview chips — idle only */}
        {isIdle && (
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {[
              { label: t('previewLight'),    style: levelStyles.light },
              { label: t('previewBalanced'), style: levelStyles.balanced },
              { label: t('previewRich'),     style: levelStyles.rich },
            ].map((card, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/10 bg-muted/5 opacity-40"
              >
                <div className={cn('w-1.5 h-1.5 rounded-full', card.style.dot)} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{card.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ ERROR ═══ */}
      {error && (
        <div className="text-center py-8 animate-in fade-in duration-300">
          <p className="text-sm text-rose-500 font-bold">{error}</p>
          <button onClick={handleClear} className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
            {t('tryAgain')}
          </button>
        </div>
      )}

      {/* ═══ LOADING ═══ */}
      {loading && (
        <div className="space-y-4 animate-in fade-in duration-300 mt-8">
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
          <div className="animate-pulse rounded-2xl bg-muted/20 h-48 transition-all duration-500" />
          <div className="animate-pulse rounded-xl bg-muted/15 h-20 transition-all duration-500" style={{ animationDelay: '150ms' }} />
        </div>
      )}

      {/* ═══ RESULT ═══ */}
      {hasResult && (() => {
        const mainVariant = plan.variants.find(v => v.level === activeLevel) ?? plan.variants[0];
        const altVariants = plan.variants.filter(v => v.level !== activeLevel);
        const style = levelStyles[mainVariant.level] ?? levelStyles.balanced;

        return (
          <div
            ref={resultRef}
            className={cn(
              'space-y-5 mt-8 transition-all duration-700',
              contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            )}
          >
            {/* Chef intro */}
            {plan.chef_intro && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/20 border border-border/10">

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
              'rounded-[2.5rem] border p-6 sm:p-10 transition-all duration-1000',
              'border-border/40 shadow-2xl hover-lift hover-glow',
              'bg-card shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] relative overflow-hidden group/card',
            )}>
              {/* Internal accent glow */}
              <div className={cn('absolute -top-32 -right-32 w-80 h-80 blur-[100px] rounded-full opacity-30 pointer-events-none transition-all duration-1000 group-hover/card:scale-150', style.dot)} />

              {/* Header */}
              <div className="flex items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-5 min-w-0">
                  <div className={cn('w-2 h-12 rounded-full shrink-0', style.dot)} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className={cn('text-2xl sm:text-3xl font-black tracking-tighter leading-none uppercase italic', style.text)}>
                        {mainVariant.title}
                      </h3>
                      <span className={cn('px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md border border-white/10', style.bg, style.text)}>
                        {t('recommended')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground/60 leading-snug mt-1.5 font-medium">
                      {mainVariant.short_description}
                    </p>
                  </div>
                </div>
                <span className="font-black text-xl tabular-nums tracking-tighter italic text-foreground shrink-0">
                  {mainVariant.calories}<span className="text-[10px] ml-0.5 opacity-30 not-italic uppercase tracking-widest">{t('kcal')}</span>
                </span>
              </div>

              {/* Total weight */}
              {(() => {
                const totalW = parseTotalWeight(mainVariant.ingredients);
                if (totalW <= 0) return null;
                const unit = ['ru', 'uk'].includes(plan.lang) ? 'г' : 'g';
                return (
                  <div className="flex items-center gap-2 mb-4 -mt-1">
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
                <div className="flex gap-2.5 mb-5 overflow-x-auto pb-1">
                  {mainVariant.ingredients.filter(ing => ing.image_url).map((ing, i) => (
                    <div key={i} className="relative w-14 h-14 sm:w-18 sm:h-18 rounded-xl overflow-hidden border border-border/10 bg-muted/20 shrink-0 group/photo">
                      <Image
                        src={ing.image_url!}
                        alt={ing.name}
                        fill
                        sizes="72px"
                        className="object-cover transition-transform duration-500 group-hover/photo:scale-110"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute bottom-1 left-0 right-0 text-center text-[7px] font-black text-white/90 uppercase tracking-wide leading-none px-1 truncate">
                        {ing.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Macros */}
              <div className="space-y-2 mb-5">
                <MacroBar label={t('proteinShort')} value={mainVariant.protein_g} max={80}  color="bg-blue-500" />
                <MacroBar label={t('fatShort')}     value={mainVariant.fat_g}     max={60}  color="bg-amber-500" />
                <MacroBar label={t('carbsShort')}   value={mainVariant.carbs_g}   max={120} color="bg-emerald-500" />
              </div>

              {/* Ingredients list — collapsible */}
              <button
                onClick={() => setIngredientsOpen(!ingredientsOpen)}
                className="flex items-center gap-2 w-full text-left group py-3 border-t border-border/40 mt-6"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 group-hover:text-primary transition-colors">
                  {t('ingredientsList')}
                </p>
                {ingredientsOpen
                  ? <ChevronUp className="h-3.5 w-3.5 text-primary" />
                  : <ChevronDown className="h-3.5 w-3.5 text-primary" />
                }
              </button>

              {ingredientsOpen && (
                <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                  {mainVariant.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-muted/10 border border-border/5 hover:bg-muted/20 transition-all">
                      {ing.image_url ? (
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-border/10 shrink-0">
                          <Image
                            src={ing.image_url}
                            alt={ing.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className={cn('w-10 h-10 rounded-xl shrink-0 flex items-center justify-center', style.bg)}>
                          <div className={cn('w-2 h-2 rounded-full', style.dot)} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-foreground truncate uppercase tracking-tight">{ing.name}</p>
                        <p className="text-[11px] text-muted-foreground/60 tabular-nums font-bold italic">{ing.amount}</p>
                      </div>
                      <span className="text-[11px] font-black tabular-nums text-primary shrink-0 bg-primary/10 px-2 py-1 rounded-lg">
                        {ing.calories} <span className="opacity-60 text-[9px]">{t('kcal')}</span>
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
                <div className="flex justify-center gap-2 flex-wrap">
                  {altVariants.map((v) => {
                    const vs = levelStyles[v.level] ?? levelStyles.balanced;
                    return (
                      <button
                        key={v.level}
                        onClick={() => { setActiveLevel(v.level); setIngredientsOpen(false); }}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all',
                          'hover:scale-[1.03] active:scale-95',
                          'border-border/20 bg-muted/5 hover:border-border/40',
                        )}
                      >
                        <div className={cn('w-2 h-2 rounded-full', vs.dot)} />
                        <span className={cn('text-xs font-bold tracking-tight', vs.text)}>
                          {v.title}
                        </span>
                        <span className="text-[10px] tabular-nums text-muted-foreground/40 font-medium">
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
              <div className="flex items-start gap-5 p-6 rounded-[2.5rem] bg-emerald-500/5 animate-glow border border-emerald-500/10 shadow-xl shadow-emerald-500/5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-inner">
                  <Heart className="h-5 w-5 shrink-0" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/60 mb-2">{t('whyThisWorks')}</p>
                  <p className="text-sm text-foreground leading-relaxed font-medium">{plan.explanation}</p>
                </div>
              </div>
            )}

            {plan.motivation && (
              <p className="text-xs text-muted-foreground/40 text-center leading-relaxed px-4">
                {plan.motivation}
              </p>
            )}

            {/* Bottom spacing */}
            <div className="h-8" />
          </div>
        );
      })()}
    </div>
  );
}

// ── Macro Bar ─────────────────────────────────────────────────────────────────

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-4 group/bar">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 w-10 transition-colors group-hover/bar:text-foreground">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-muted/20 overflow-hidden relative shadow-inner">
        <div 
          className={cn('h-full rounded-full transition-all duration-1000 ease-out relative z-10 shadow-lg', color)} 
          style={{ width: `${pct}%` }} 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none z-20" />
      </div>
      <span className="text-[12px] font-black tabular-nums text-foreground w-10 text-right">{value}<span className="text-[8px] ml-0.5 opacity-30 font-bold uppercase">g</span></span>
    </div>
  );
}
