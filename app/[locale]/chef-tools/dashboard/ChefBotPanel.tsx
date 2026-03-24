'use client';

/**
 * ChefBotPanel v4 — "AI Sous Chef" as an interactive cooking guide
 *
 * UX principles:
 *  ① DISH FORMULA  — [ Egg ] + [ Bacon ] + [ Avocado ]  (feels like building)
 *  ② ONE NEXT STEP — single hero CTA, not a list  (guides the user)
 *  ③ LIVE FEEDBACK  — animated score, color transitions, "balance improved"
 *  ④ TWO TABS       — [Recommendations] vs [Analysis]  (no overload)
 */

import { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  X, Plus, ChefHat, Zap, ArrowRight, Flame,
  Shield, Check, Lightbulb, BarChart3,
} from 'lucide-react';
import type {
  SmartResponse,
  NextAction,
  SuggestionInfo,
  ConfidenceInfo,
} from '@/types/smart';

/* ── Exported types ────────────────────────────────────────── */

export type DishIngredient = {
  slug: string;
  name: string;
  image_url?: string | null;
  grams?: number;
  role?: string;
};

export type ChefBotPanelProps = {
  smart: SmartResponse | null;
  loading: boolean;
  primarySlug: string;
  primaryName: string;
  primaryImage?: string | null;
  extras: DishIngredient[];
  onAddExtra: (ing: DishIngredient) => void;
  onRemoveExtra: (slug: string) => void;
  onSelectIngredient: (slug: string, name: string) => void;
};

/* ── Animated number ───────────────────────────────────────── */

function useAnimatedNumber(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    const from = prev.current;
    const diff = target - from;
    if (diff === 0) return;
    prev.current = target;

    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // ease-out
      const ease = 1 - (1 - t) * (1 - t);
      setDisplay(Math.round(from + diff * ease));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return display;
}

/* ── Score colour helper ───────────────────────────────────── */

function scoreColor(v: number): string {
  if (v >= 75) return 'text-emerald-500';
  if (v >= 50) return 'text-amber-500';
  return 'text-rose-500';
}

function barGradient(v: number): string {
  if (v >= 75) return 'from-emerald-400 to-emerald-500';
  if (v >= 50) return 'from-amber-400 to-amber-500';
  return 'from-rose-400 to-rose-500';
}

/* ── Severity colour ───────────────────────────────────────── */

const severityClass: Record<string, string> = {
  critical: 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-400',
  warning:  'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400',
  info:     'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-400',
};

/* ── DishChip ──────────────────────────────────────────────── */

function DishChip({
  name, image_url, isPrimary, onRemove,
}: {
  name: string;
  image_url?: string | null;
  isPrimary: boolean;
  onRemove?: () => void;
}) {
  return (
    <div className={`group flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-2xl border text-[13px] font-black transition-all
      ${isPrimary
        ? 'border-primary/40 bg-primary/10 text-primary shadow-sm shadow-primary/10'
        : 'border-border/50 bg-background text-foreground hover:border-primary/30 hover:shadow-sm'}`}
    >
      {image_url ? (
        <img src={image_url} alt={name} className="w-6 h-6 rounded-lg object-cover shrink-0" />
      ) : (
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isPrimary ? 'bg-primary/20' : 'bg-muted'}`}>
          <ChefHat className="h-3 w-3" />
        </div>
      )}
      <span className="truncate max-w-[90px] capitalize">{name}</span>
      {!isPrimary && onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
          aria-label={`Remove ${name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ── Plus connector ────────────────────────────────────────── */

function PlusSign() {
  return (
    <span className="text-primary/40 text-lg font-black select-none">+</span>
  );
}

/* ── Confidence badge ──────────────────────────────────────── */

function ConfidenceBadge({ confidence }: { confidence: ConfidenceInfo }) {
  const pct = Math.round(confidence.overall * 100);
  const color = pct >= 75
    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : pct >= 50
      ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase ${color}`}>
      <Shield className="h-3 w-3" />
      {pct}%
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */

export function ChefBotPanel({
  smart,
  loading,
  primarySlug,
  primaryName,
  primaryImage,
  extras,
  onAddExtra,
  onRemoveExtra,
  onSelectIngredient,
}: ChefBotPanelProps) {
  const locale = useLocale();
  const t = useTranslations('chefTools.dashboard');

  const addedSlugs = new Set([primarySlug, ...extras.map((e) => e.slug)]);

  const flavor      = smart?.flavor_profile;
  const diagnostics = smart?.diagnostics;
  const nextActions = smart?.next_actions ?? [];
  const suggestions = smart?.suggestions ?? [];
  const confidence  = smart?.confidence;

  // Pick the ONE best action
  const bestAction   = nextActions.find((a) => !addedSlugs.has(a.ingredient)) ?? null;
  const bestSuggestion = bestAction
    ? null
    : suggestions.find((s) => !addedSlugs.has(s.slug)) ?? null;

  // Build a slug→name lookup from suggestions (API returns localized names)
  const nameMap = new Map<string, string>();
  for (const s of suggestions) nameMap.set(s.slug, s.name);
  const actionName = (a: NextAction) => a.name || nameMap.get(a.ingredient) || a.ingredient.replace(/-/g, ' ');

  // Secondary recommendations (for the Recommendations tab)
  const secondaryActions = nextActions.filter((a) => a !== bestAction && !addedSlugs.has(a.ingredient)).slice(0, 4);
  const secondarySuggestions = suggestions.filter((s) => s !== bestSuggestion && !addedSlugs.has(s.slug)).slice(0, 4);

  // Balance
  const balanceScore = flavor?.balance?.balance_score ?? 0;
  const animatedScore = useAnimatedNumber(balanceScore);
  const prevScore = useRef(balanceScore);
  const [feedback, setFeedback] = useState<'improved' | 'declined' | null>(null);

  useEffect(() => {
    if (prevScore.current !== 0 && balanceScore !== prevScore.current) {
      setFeedback(balanceScore > prevScore.current ? 'improved' : 'declined');
      const timer = setTimeout(() => setFeedback(null), 2200);
      prevScore.current = balanceScore;
      return () => clearTimeout(timer);
    }
    prevScore.current = balanceScore;
  }, [balanceScore]);

  // Tabs
  const [tab, setTab] = useState<'recs' | 'analysis'>('recs');

  return (
    <div className="space-y-5">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
          <ChefHat className="h-3.5 w-3.5" />
          {t('aiSousChef')}
        </p>
        {confidence && <ConfidenceBadge confidence={confidence} />}
      </div>

      {/* ══════════════════════════════════════════════════════
          ① DISH FORMULA — Grouped by Roles
          ══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            🍽 {t('currentDish')}
          </p>
          {extras.length > 0 && (
            <button
              onClick={() => extras.forEach((e) => onRemoveExtra(e.slug))}
              className="text-[10px] text-muted-foreground hover:text-destructive transition-colors font-bold"
            >
              {t('clearDish')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
          {(() => {
            const allIngredients = [
              { slug: primarySlug, name: primaryName, image_url: primaryImage, role: 'base', isPrimary: true },
              ...extras.map(e => ({ ...e, isPrimary: false }))
            ];

            const roleGroups = [
              { id: 'base', emoji: '🥩', title: locale === 'ru' ? 'Основное' : 'Main', items: [] as typeof allIngredients },
              { id: 'side', emoji: '🥦', title: locale === 'ru' ? 'Гарнир' : 'Garnish', items: [] as typeof allIngredients },
              { id: 'aromatic', emoji: '🧄', title: locale === 'ru' ? 'Ароматика' : 'Aromatic', items: [] as typeof allIngredients },
              { id: 'fat', emoji: '🧈', title: locale === 'ru' ? 'Жиры / соус' : 'Fats & Sauces', items: [] as typeof allIngredients },
              { id: 'other', emoji: '🍴', title: locale === 'ru' ? 'Другое' : 'Other', items: [] as typeof allIngredients },
            ];

            allIngredients.forEach(ing => {
              let r = ing.role || 'other';
              if (r === 'sauce') r = 'fat'; // merge sauce and fat
              const group = roleGroups.find(g => g.id === r) || roleGroups.find(g => g.id === 'other')!;
              group.items.push(ing);
            });

            return roleGroups.filter(g => g.items.length > 0).map(group => (
              <div key={group.id} className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                  <span className="text-[12px]">{group.emoji}</span>
                  {group.title}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map(ing => (
                    <DishChip
                      key={ing.slug}
                      name={ing.name}
                      image_url={ing.image_url}
                      isPrimary={ing.isPrimary}
                      onRemove={!ing.isPrimary ? () => onRemoveExtra(ing.slug) : undefined}
                    />
                  ))}
                  {/* Ghost slot for aromatic or side if empty */}
                  {group.id === 'side' && group.items.length === 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-dashed border-border text-muted-foreground/40 text-[11px] font-bold cursor-default">
                      +
                    </div>
                  )}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          ③ BALANCE — animated score with colour transition
          ══════════════════════════════════════════════════════ */}
      {flavor && (
        <div className="p-4 rounded-2xl bg-muted/15 border border-border/40 relative overflow-hidden">
          {/* Feedback flash */}
          {feedback && (
            <div className={`absolute inset-0 pointer-events-none animate-in fade-in duration-300 ${
              feedback === 'improved'
                ? 'bg-emerald-500/10'
                : 'bg-rose-500/10'
            }`} />
          )}

          <div className="flex items-center gap-4 relative">
            {/* Score circle */}
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor"
                  className="text-muted/20" strokeWidth="6" />
                <circle cx="32" cy="32" r="26" fill="none"
                  className={`transition-all duration-700`}
                  stroke={balanceScore >= 75 ? '#10b981' : balanceScore >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - balanceScore / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-black tabular-nums transition-colors duration-500 ${scoreColor(balanceScore)}`}>
                  {animatedScore}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {t('balanceScore')}
                </span>
                {/* Feedback text */}
                {feedback === 'improved' && (
                  <span className="text-[10px] font-black text-emerald-500 animate-in fade-in slide-in-from-left-2 duration-300">
                    ↑ {t('balanceImproved')}
                  </span>
                )}
                {feedback === 'declined' && (
                  <span className="text-[10px] font-black text-rose-500 animate-in fade-in slide-in-from-left-2 duration-300">
                    ↓ {t('balanceDeclined')}
                  </span>
                )}
              </div>

              {/* Bar */}
              <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barGradient(balanceScore)} transition-all duration-700`}
                  style={{ width: `${balanceScore}%` }}
                />
              </div>

              {/* Weak zones */}
              {flavor.balance.weak_dimensions.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                  <span className="font-bold text-rose-500">{t('weakZones')}: </span>
                  {flavor.balance.weak_dimensions.map((w) => {
                    try { return t(`flavor.${w.dimension}` as any); } catch { return w.dimension; }
                  }).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Category scores */}
          {diagnostics?.category_scores && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-border/20">
              {Object.entries(diagnostics.category_scores).map(([cat, score]) => (
                <div key={cat} className="flex-1 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">{cat}</p>
                  <p className={`text-xs font-black tabular-nums ${scoreColor(score)}`}>{score}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ② HERO NEXT STEP — single CTA, not a list
          ══════════════════════════════════════════════════════ */}
      {(bestAction || bestSuggestion) && (
        <div className="p-4 rounded-2xl bg-primary/[0.04] border-2 border-primary/25 relative overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" />
            {t('nextStep')}
          </p>

          {bestAction && (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-foreground capitalize leading-snug">
                  {t('addAction')} <span className="text-primary">{actionName(bestAction)}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {bestAction.reason}
                </p>
              </div>
              <button
                onClick={() => onAddExtra({
                  slug: bestAction.ingredient,
                  name: actionName(bestAction),
                  grams: 50,
                })}
                className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-black uppercase tracking-wide hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                {t('addToDish')}
              </button>
            </div>
          )}

          {!bestAction && bestSuggestion && (
            <div className="flex items-center gap-3">
              {bestSuggestion.image_url && (
                <img src={bestSuggestion.image_url} alt={bestSuggestion.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-border/20" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-foreground capitalize leading-snug">
                  {t('addAction')} <span className="text-primary">{bestSuggestion.name}</span>
                </p>
                {bestSuggestion.fills_gaps.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    + {bestSuggestion.fills_gaps.map(f => {
                      try { return t(`flavor.${f}` as any); } catch { return f; }
                    }).join(', ')}
                  </p>
                )}
              </div>
              <button
                onClick={() => onAddExtra({
                  slug: bestSuggestion.slug,
                  name: bestSuggestion.name,
                  image_url: bestSuggestion.image_url,
                  grams: bestSuggestion.suggested_grams || 50,
                })}
                className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-black uppercase tracking-wide hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                {t('addToDish')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ④ TABS — [ Recommendations ] [ Analysis ]
          ══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex border-b border-border/40 mb-4">
          <button
            onClick={() => setTab('recs')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all border-b-2 -mb-[1px]
              ${tab === 'recs'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            {t('tabRecommendations')}
          </button>
          <button
            onClick={() => setTab('analysis')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all border-b-2 -mb-[1px]
              ${tab === 'analysis'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            {t('tabAnalysis')}
          </button>
        </div>

        {/* ── Tab: Recommendations ────────────────────────── */}
        {tab === 'recs' && (
          <div className="space-y-2 animate-in fade-in duration-200">
            {/* Secondary next actions */}
            {secondaryActions.map((a, i) => (
              <div
                key={`${a.type}-${a.ingredient}-${i}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/10 hover:border-primary/30 hover:bg-primary/[0.02] transition-all group"
              >
                <button
                  onClick={() => onSelectIngredient(a.ingredient, actionName(a))}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-xs font-black text-foreground capitalize group-hover:text-primary transition-colors">
                    {actionName(a)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{a.reason}</p>
                </button>
                <button
                  onClick={() => onAddExtra({
                    slug: a.ingredient,
                    name: actionName(a),
                    grams: 50,
                  })}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase hover:bg-primary/20 transition-all border border-primary/20"
                >
                  <Plus className="h-3 w-3" />
                  {t('addToDish')}
                </button>
              </div>
            ))}

            {/* Fallback: secondary suggestions */}
            {secondaryActions.length === 0 && secondarySuggestions.map((s) => (
              <div
                key={s.slug}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/10 hover:border-primary/30 hover:bg-primary/[0.02] transition-all group"
              >
                {s.image_url && (
                  <img src={s.image_url} alt={s.name}
                    className="w-9 h-9 rounded-lg object-cover shrink-0 border border-border/20" />
                )}
                <button
                  onClick={() => onSelectIngredient(s.slug, s.name)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                    {s.name}
                  </p>
                  {s.fills_gaps.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      + {s.fills_gaps.map(f => {
                        try { return t(`flavor.${f}` as any); } catch { return f; }
                      }).join(', ')}
                    </p>
                  )}
                </button>
                <span className="text-[10px] font-black text-primary tabular-nums">{s.score}</span>
                <button
                  onClick={() => onAddExtra({
                    slug: s.slug,
                    name: s.name,
                    image_url: s.image_url,
                    grams: s.suggested_grams || 50,
                  })}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase hover:bg-primary/20 transition-all border border-primary/20"
                >
                  <Plus className="h-3 w-3" />
                  {t('addToDish')}
                </button>
              </div>
            ))}

            {secondaryActions.length === 0 && secondarySuggestions.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground text-center py-4">
                {t('dishEmpty')}
              </p>
            )}
          </div>
        )}

        {/* ── Tab: Analysis ───────────────────────────────── */}
        {tab === 'analysis' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Diagnostics issues */}
            {diagnostics && diagnostics.issues.length > 0 && (
              <div className="space-y-1.5">
                {diagnostics.issues
                  .filter((i) => i.severity === 'critical' || i.severity === 'warning')
                  .slice(0, 4)
                  .map((issue, i) => {
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-[11px] leading-relaxed ${severityClass[issue.severity] ?? severityClass.info}`}
                      >
                        <Zap className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>{issue.message}</span>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Flavor vector */}
            {flavor && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {t('flavorProfile')}
                </p>
                <div className="space-y-1.5">
                  {Object.entries(flavor.vector).map(([dim, val]) => {
                    const label = (() => {
                      try { return t(`flavor.${dim}` as any); } catch { return dim; }
                    })();
                    return (
                      <div key={dim} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground w-20 text-right capitalize truncate">{label}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/60 transition-all duration-500"
                            style={{ width: `${Math.min(val * 10, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black tabular-nums text-muted-foreground w-6 text-right">{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confidence breakdown */}
            {confidence && (
              <div className="flex gap-3 pt-2 border-t border-border/30">
                {(['nutrition', 'pairings', 'flavor'] as const).map((key) => (
                  <div key={key} className="flex-1 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">{key}</p>
                    <p className={`text-sm font-black tabular-nums ${scoreColor(Math.round(confidence[key] * 100))}`}>
                      {Math.round(confidence[key] * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!diagnostics && !flavor && !loading && (
              <p className="text-xs text-muted-foreground text-center py-4">
                {t('dishEmpty')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Loading ───────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center gap-2 justify-center py-3 text-[11px] text-muted-foreground">
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="font-bold uppercase tracking-wider">Analyzing…</span>
        </div>
      )}

      {/* ── Engine badge ──────────────────────────────────── */}
      {smart?.meta && (
        <div className="flex items-center justify-between text-[9px] text-muted-foreground/40 pt-1">
          <span>v{smart.meta.engine_version}</span>
          <span>{smart.meta.timing_ms}ms{smart.meta.cached ? ' · cached' : ''}</span>
        </div>
      )}
    </div>
  );
}
