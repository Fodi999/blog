'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Loader2, Flame, CalendarDays, Sparkles, Fish, Leaf,
  Scale, FlaskConical, ExternalLink, X,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PairingBlock } from './PairingBlock';
import { MiniLab } from './MiniLab';
import { CookingStateSelector } from './CookingStateSelector';
import { ChefBotPanel, type DishIngredient } from './ChefBotPanel';
import { useSmartEngine } from '@/hooks/useSmartEngine';
import type { Goal, SmartResponse } from '@/types/smart';
import {
  fetchNutrition, fetchSeasonality, fetchEquivalents,
  type NutritionResult, type ProductSeasonality, type EquivalentsResult,
} from '@/lib/tools';
import { fetchIngredientStates, type ApiIngredientStateListItem } from '@/lib/api';

/* ── Status styling ─────────────────────────────────────────── */

const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  peak:    { bg: 'bg-green-500/15 border-green-500/30',   text: 'text-green-700 dark:text-green-400',   label: 'peak' },
  good:    { bg: 'bg-blue-500/15 border-blue-500/30',     text: 'text-blue-700 dark:text-blue-400',     label: 'good' },
  off:     { bg: 'bg-amber-500/15 border-amber-500/30',   text: 'text-amber-700 dark:text-amber-400',   label: 'off' },
  avoid:   { bg: 'bg-red-500/15 border-red-500/30',       text: 'text-red-700 dark:text-red-400',       label: 'avoid' },
  limited: { bg: 'bg-orange-500/15 border-orange-500/30', text: 'text-orange-700 dark:text-orange-400', label: 'limited' },
};

function safeStatusStyle(status: string) {
  return statusStyle[status] ?? statusStyle.off;
}

const monthKeys = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] as const;

/* ── Macro Ring ─────────────────────────────────────────────── */

function MacroRing({ value, max, color, label, unit }: {
  value: number; max: number; color: string; label: string; unit: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor"
            className="text-muted/30" strokeWidth="5" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={color}
            strokeWidth="5" strokeLinecap="round" strokeDasharray={circ}
            strokeDashoffset={offset} className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black tabular-nums">{value}</span>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-[10px] text-muted-foreground">{unit}</span>
    </div>
  );
}

/* ── Collapsible section ────────────────────────────────────── */

function CollapsibleSection({
  title, icon: Icon, iconColor, defaultOpen = false, children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor ?? 'text-primary'}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

/* ── Vitamins block ─────────────────────────────────────────── */

function VitaminsBlock({ vitamins, t }: { vitamins: Record<string, number | null>; t: (k: string) => string }) {
  const entries = Object.entries(vitamins).filter(([, v]) => v !== null && v > 0);
  if (!entries.length) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border/40">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        {t('vitamins')}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([k, v]) => (
          <span key={k} className="px-2 py-1 rounded-lg bg-muted/40 text-[10px] font-bold text-muted-foreground">
            {k.replace(/_/g, ' ')} <span className="text-foreground">{v}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────── */

type SmartResultProps = {
  slug: string;
  name: string;
  primaryImage?: string | null;
  dishExtras: DishIngredient[];
  /** Pre-fetched SmartResponse from text-based recipe analysis */
  fromTextResult?: SmartResponse | null;
  onAddExtra: (ing: DishIngredient) => void;
  onRemoveExtra: (slug: string) => void;
  onSelectIngredient: (slug: string, name: string, image?: string | null) => void;
  onClose?: () => void;
};

export function SmartResult({
  slug, name, primaryImage, dishExtras, fromTextResult, onAddExtra, onRemoveExtra, onSelectIngredient, onClose,
}: SmartResultProps) {
  const locale = useLocale();
  const t = useTranslations('chefTools.dashboard');

  const [nutrition, setNutrition]   = useState<NutritionResult | null>(null);
  const [season, setSeason]         = useState<ProductSeasonality | null>(null);
  const [loading, setLoading]       = useState(true);

  // Cooking states
  const [states, setStates]           = useState<ApiIngredientStateListItem[]>([]);
  const [cookingState, setCookingState] = useState<string>('raw');

  // Equivalents — lazy loaded
  const [equivalents, setEquivalents]   = useState<EquivalentsResult | null>(null);
  const [eqLoading, setEqLoading]       = useState(false);
  const eqRequestId = useRef(0);

  // ── SmartService v3 Decision Engine ──
  // Skip hook auto-fetch if we already have text-based result
  const { data: smartEngineData, loading: smartLoading } = useSmartEngine({
    slug,
    state: cookingState,
    extras: dishExtras.map((e) => e.slug),
    lang: locale,
  });

  // ── SINGLE DATA SOURCE: text result wins over engine result ──
  const smartData = fromTextResult ?? smartEngineData;

  /* ── Reset + fetch when slug changes ─────────────────────── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNutrition(null);
    setSeason(null);
    setStates([]);
    setCookingState('raw');
    setEquivalents(null);
    setEqLoading(false);
    eqRequestId.current = 0;

    Promise.all([
      fetchNutrition(slug, locale),
      fetchSeasonality(slug, locale),
      fetchIngredientStates(slug),
    ]).then(([n, s, st]) => {
      if (cancelled) return;
      setNutrition(n);
      setSeason(s);
      if (st?.states?.length) setStates(st.states);
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug, locale]);

  /* ── Equivalents loader ──────────────────────────────────── */
  const loadEquivalents = useCallback(() => {
    if (eqLoading || equivalents) return;
    const id = ++eqRequestId.current;
    setEqLoading(true);
    fetchEquivalents(slug, locale).then((d) => {
      if (id !== eqRequestId.current) return;
      setEquivalents(d);
    }).finally(() => {
      if (id === eqRequestId.current) setEqLoading(false);
    });
  }, [slug, locale, eqLoading, equivalents]);

  /* ── Loading state ───────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!nutrition) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    );
  }

  const { per_100g: n, macros_ratio: r } = nutrition;
  const currentMonth = new Date().getMonth();
  const currentSeason = season?.season?.[currentMonth];
  const currentStatus = currentSeason?.status ?? 'off';
  const style = safeStatusStyle(currentStatus);

  // Active cooking state data
  const rawState = states.find((s) => s.state === 'raw');
  const activeStateData = states.find((s) => s.state === cookingState);
  const displayN = activeStateData && cookingState !== 'raw'
    ? {
        calories:   activeStateData.calories_per_100g ?? n.calories,
        protein_g:  activeStateData.protein_per_100g  ?? n.protein_g,
        fat_g:      activeStateData.fat_per_100g      ?? n.fat_g,
        carbs_g:    activeStateData.carbs_per_100g    ?? n.carbs_g,
      }
    : { calories: n.calories, protein_g: n.protein_g, fat_g: n.fat_g, carbs_g: n.carbs_g };
  const displayR = (() => {
    const total = displayN.protein_g + displayN.fat_g + displayN.carbs_g || 1;
    return {
      protein_pct: Math.round((displayN.protein_g / total) * 100),
      fat_pct:     Math.round((displayN.fat_g     / total) * 100),
      carbs_pct:   Math.round((displayN.carbs_g   / total) * 100),
    };
  })();

  return (
    <section className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ══════════════════════════════════════════════════════════
          BLOCK 0 — Product header (compact)
          ══════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
        <div className="flex items-center gap-4 p-4">
          {nutrition.image_url ? (
            <img src={nutrition.image_url} alt={nutrition.name}
              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-border/40" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
              {nutrition.water_type
                ? <Fish className="h-6 w-6 text-muted-foreground" />
                : <Leaf className="h-6 w-6 text-muted-foreground" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-black uppercase tracking-tight text-foreground leading-tight truncate">
                {nutrition.name}
              </h2>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/chef-tools/nutrition/${slug}`}
                  className="p-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                  title={t('fullProfile')}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-all"
                    aria-label="Close"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="text-[11px] text-muted-foreground capitalize">
                {(() => { try { return t(`categories.${nutrition.product_type}` as any); } catch { return nutrition.product_type; } })()}
              </span>
              <span className="text-muted-foreground/30">·</span>
              <Badge variant="outline" className={`${style.bg} ${style.text} text-[10px] font-bold uppercase border`}>
                {t(`status.${style.label}`)}
              </Badge>
              {nutrition.sushi_grade && (
                <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary bg-primary/5">
                  🍣 Sushi
                </Badge>
              )}
              {nutrition.nutrition_score > 0 && (
                <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5">
                  ★ {nutrition.nutrition_score}/10
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Cooking state selector */}
        {states.length > 1 && (
          <div className="px-4 pb-4 pt-2 border-t border-border/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              {t('cookingState')}
            </p>
            <CookingStateSelector
              states={states}
              active={cookingState}
              onChange={setCookingState}
              rawState={rawState}
            />

            {/* What changed vs raw */}
            {activeStateData && cookingState !== 'raw' && rawState && (() => {
              const changes: Array<{ label: string; value: string; positive: boolean }> = [];

              const calDiff = activeStateData.calories_per_100g != null && rawState.calories_per_100g != null && rawState.calories_per_100g > 0
                ? Math.round(((activeStateData.calories_per_100g - rawState.calories_per_100g) / rawState.calories_per_100g) * 100) : null;
              if (calDiff != null && Math.abs(calDiff) >= 2)
                changes.push({ label: t('changeCalories'), value: `${calDiff > 0 ? '+' : ''}${calDiff}%`, positive: calDiff < 0 });

              const protDiff = activeStateData.protein_per_100g != null && rawState.protein_per_100g != null && rawState.protein_per_100g > 0
                ? Math.round(((activeStateData.protein_per_100g - rawState.protein_per_100g) / rawState.protein_per_100g) * 100) : null;
              if (protDiff != null && Math.abs(protDiff) >= 2)
                changes.push({ label: t('changeProtein'), value: `${protDiff > 0 ? '+' : ''}${protDiff}%`, positive: protDiff > 0 });

              if (activeStateData.water_loss_percent != null && activeStateData.water_loss_percent > 0)
                changes.push({ label: t('changeWaterLoss'), value: `-${activeStateData.water_loss_percent}%`, positive: false });

              if (activeStateData.weight_change_percent != null && Math.abs(activeStateData.weight_change_percent) >= 2)
                changes.push({ label: t('changeWeight'), value: `${activeStateData.weight_change_percent > 0 ? '+' : ''}${activeStateData.weight_change_percent}%`, positive: activeStateData.weight_change_percent > 0 });

              if (activeStateData.texture && rawState.texture && activeStateData.texture !== rawState.texture)
                changes.push({ label: t('changeTexture'), value: activeStateData.texture, positive: true });

              if (activeStateData.shelf_life_hours != null && rawState.shelf_life_hours != null && activeStateData.shelf_life_hours !== rawState.shelf_life_hours) {
                const shelfDiff = activeStateData.shelf_life_hours - rawState.shelf_life_hours;
                changes.push({ label: t('changeShelfLife'), value: `${shelfDiff > 0 ? '+' : ''}${shelfDiff}h`, positive: shelfDiff > 0 });
              }

              if (!changes.length) return null;
              return (
                <div className="mt-2 p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {t('whatChanged')}
                  </p>
                  {changes.map((c, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">{c.label}</span>
                      <span className={`text-[11px] font-black tabular-nums ${c.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {c.value}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          BLOCK 1 — 🧠 AI Sous Chef (FIRST! Most important)
          Dish composition + recommendations + balance + diagnosis
          ══════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/[0.02] overflow-hidden">
        <div className="px-5 py-4">
          <ChefBotPanel
            smart={smartData}
            loading={smartLoading}
            primarySlug={slug}
            primaryName={nutrition.name}
            primaryImage={primaryImage ?? nutrition.image_url}
            extras={dishExtras}
            onAddExtra={onAddExtra}
            onRemoveExtra={onRemoveExtra}
            onSelectIngredient={onSelectIngredient}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BLOCK 2 — 🥗 Pairings (always visible, clickable)
          ══════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
        <div className="px-5 pt-4 pb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('pairingsWith')}
          </span>
        </div>
        <div className="p-5 pt-3">
          <PairingBlock
            slug={slug}
            cookingState={cookingState}
            onSelectIngredient={onSelectIngredient}
            onAddToDish={onAddExtra}
            dishSlugs={new Set([slug, ...dishExtras.map((e) => e.slug)])}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BLOCK 3 — 📊 Nutrition (collapsible, secondary)
          ══════════════════════════════════════════════════════════ */}
      <CollapsibleSection title={t('nutritionPer100g')} icon={Flame} iconColor="text-orange-500">
        <div className="flex justify-around">
          <MacroRing value={Math.round(displayN.calories)}                      max={500} color="hsl(var(--primary))" label={t('calories')} unit="kcal" />
          <MacroRing value={Math.round(displayN.protein_g * 10) / 10}           max={50}  color="rgb(59,130,246)"     label={t('protein')}  unit="g" />
          <MacroRing value={Math.round(displayN.fat_g * 10) / 10}               max={50}  color="rgb(245,158,11)"     label={t('fat')}      unit="g" />
          <MacroRing value={Math.round(displayN.carbs_g * 10) / 10}             max={80}  color="rgb(16,185,129)"     label={t('carbs')}    unit="g" />
        </div>
        <div className="mt-4 flex h-1.5 rounded-full overflow-hidden bg-muted/30">
          <div className="bg-blue-500 transition-all duration-700"    style={{ width: `${displayR.protein_pct}%` }} />
          <div className="bg-amber-500 transition-all duration-700"   style={{ width: `${displayR.fat_pct}%` }} />
          <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${displayR.carbs_pct}%` }} />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] font-bold">
          <span className="text-blue-500">P {displayR.protein_pct}%</span>
          <span className="text-amber-500">F {displayR.fat_pct}%</span>
          <span className="text-emerald-500">C {displayR.carbs_pct}%</span>
        </div>
        {activeStateData && cookingState !== 'raw' && (() => {
          const notes =
            locale === 'ru' ? activeStateData.notes_ru :
            locale === 'pl' ? activeStateData.notes_pl :
            locale === 'uk' ? activeStateData.notes_uk :
            activeStateData.notes_en;
          if (!notes) return null;
          return (
            <p className="mt-3 text-[11px] text-muted-foreground italic border-t border-border/40 pt-3 leading-relaxed">
              {notes}
            </p>
          );
        })()}
        {Object.keys(nutrition.vitamins ?? {}).length > 0 && (
          <VitaminsBlock vitamins={nutrition.vitamins} t={t as unknown as (k: string) => string} />
        )}
      </CollapsibleSection>

      {/* ══════════════════════════════════════════════════════════
          BLOCK 4 — 📅 Seasonality (collapsible, secondary)
          ══════════════════════════════════════════════════════════ */}
      {season && season.season && season.season.length > 0 && (
        <CollapsibleSection title={t('seasonCalendar')} icon={CalendarDays}>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {season.season.map((m, i) => {
              const s = safeStatusStyle(m.status);
              const isCurrent = i === currentMonth;
              return (
                <div key={i} className={`rounded-lg p-2 text-center border ${s.bg} ${isCurrent ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}>
                  <span className={`block text-[10px] font-bold uppercase ${s.text}`}>
                    {t(`months.${monthKeys[i]}`)}
                  </span>
                  <span className={`block text-[9px] mt-0.5 font-semibold ${s.text} opacity-70`}>
                    {t(`status.${s.label}`)}
                  </span>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* ══════════════════════════════════════════════════════════
          BLOCK 5 — 🔧 Equivalents (collapsible)
          ══════════════════════════════════════════════════════════ */}
      <CollapsibleSection title={t('equivalents')} icon={Scale} iconColor="text-cyan-500">
        <EquivalentsInner
          slug={slug}
          locale={locale}
          loadEquivalents={loadEquivalents}
          equivalents={equivalents}
          eqLoading={eqLoading}
          t={t as unknown as (k: string) => string}
        />
      </CollapsibleSection>

      {/* ══════════════════════════════════════════════════════════
          BLOCK 6 — 🧪 Lab (collapsible)
          ══════════════════════════════════════════════════════════ */}
      <CollapsibleSection title={t('openInLab')} icon={FlaskConical} iconColor="text-emerald-500">
        <div className="flex justify-end mb-3">
          <Link
            href="/chef-tools/lab"
            className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            {t('fullLab')}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <MiniLab slug={slug} name={nutrition.name} cookingState={cookingState} onSelectIngredient={onSelectIngredient} />
      </CollapsibleSection>

    </section>
  );
}

/* ── Equivalents inner (triggers load on mount) ────────────── */

function EquivalentsInner({
  slug, locale, loadEquivalents, equivalents, eqLoading, t,
}: {
  slug: string;
  locale: string;
  loadEquivalents: () => void;
  equivalents: EquivalentsResult | null;
  eqLoading: boolean;
  t: (k: string) => string;
}) {
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadEquivalents();
    }
  }, [loadEquivalents]);

  if (eqLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center px-3 py-2.5 rounded-xl bg-muted/30 border border-border/40 animate-pulse">
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="h-3 w-8 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (equivalents && equivalents.equivalents.length > 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {equivalents.equivalents.map((eq) => (
          <div key={eq.unit} className="flex justify-between items-center px-3 py-2.5 rounded-xl bg-muted/30 border border-border/40">
            <span className="text-xs font-bold text-foreground">{eq.label}</span>
            <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 tabular-nums font-bold">{eq.value}g</span>
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-xs text-muted-foreground">{t('noData')}</p>;
}
