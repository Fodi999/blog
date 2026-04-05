'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChefHat, Wand2, Loader2, TrendingUp, TrendingDown,
  ArrowDown, ArrowUp, Plus, Flame, Zap, CheckCircle,
  AlertTriangle, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RuleDiagnosis, RuleIssue } from './DiagnosisCard';

// ── Types ────────────────────────────────────────────────────────────────────

export type NutritionSnapshot = {
  score: number;
  health_score: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
};

export type ChangeLogEntry = {
  type: 'added' | 'reduced';
  slug: string;
  name: string;
  grams: number;
  delta?: number;
};

// ── Chef personality — dynamic, based on actual issues found ─────────────────

const ISSUE_PHRASES: Record<string, Record<string, string>> = {
  high_sugar:             { en: 'overloaded with sugar', pl: 'przeładowany cukrem', ru: 'перегружен сахаром', uk: 'перевантажений цукром' },
  high_carbs:             { en: 'too carb-heavy', pl: 'za dużo węglowodanów', ru: 'слишком много углеводов', uk: 'занадто багато вуглеводів' },
  high_fat_ratio:         { en: 'heavy on fats', pl: 'za dużo tłuszczu', ru: 'перегружен жирами', uk: 'перевантажений жирами' },
  low_protein:            { en: 'lacks protein', pl: 'brakuje białka', ru: 'мало белка', uk: 'мало білка' },
  low_fiber:              { en: 'almost no fiber', pl: 'prawie bez błonnika', ru: 'почти без клетчатки', uk: 'майже без клітковини' },
  low_acidity:            { en: 'needs brightness', pl: 'potrzebuje kwasowości', ru: 'не хватает кислотности', uk: 'бракує кислотності' },
  low_umami:              { en: 'flat, no umami depth', pl: 'płaski, brak umami', ru: 'плоский, нет умами', uk: 'плаский, немає умамі' },
  low_aroma:              { en: 'weak aroma', pl: 'słaby aromat', ru: 'слабый аромат', uk: 'слабкий аромат' },
  missing_vegetables:     { en: 'no vegetables at all', pl: 'zupełnie bez warzyw', ru: 'совсем без овощей', uk: 'зовсім без овочів' },
  missing_fat_source:     { en: 'no fat to carry flavor', pl: 'brak tłuszczu dla smaku', ru: 'нет жира для вкуса', uk: 'немає жиру для смаку' },
  missing_protein_source: { en: 'no protein source', pl: 'brak źródła białka', ru: 'нет источника белка', uk: 'немає джерела білка' },
  ingredient_dominance:   { en: 'one ingredient dominates', pl: 'jeden składnik dominuje', ru: 'один ингредиент доминирует', uk: 'один інгредієнт домінує' },
};

const CHEF_INTRO: Record<string, Record<string, string>> = {
  critical: {
    en: "As a chef I'll be honest —",
    pl: 'Jako szef powiem szczerze —',
    ru: 'Как шеф скажу честно —',
    uk: 'Як шеф скажу чесно —',
  },
  warning: {
    en: "Good base, but —",
    pl: 'Dobra baza, ale —',
    ru: 'Хорошая база, но —',
    uk: 'Гарна база, але —',
  },
  perfect: {
    en: "Chef's verdict — excellent balance. Well done!",
    pl: 'Werdykt szefa — doskonały balans. Świetna robota!',
    ru: 'Вердикт шефа — отличный баланс. Молодец!',
    uk: 'Вердикт шефа — чудовий баланс. Молодець!',
  },
};

/** Post-improvement chef voice */
const CHEF_POST_IMPROVE: Record<string, Record<string, string>> = {
  great: {
    en: 'Much better! The balance leveled out nicely.',
    pl: 'Znacznie lepiej! Balans się wyrównał.',
    ru: 'Стало лучше! Баланс выровнялся.',
    uk: 'Стало краще! Баланс вирівнявся.',
  },
  good: {
    en: 'Solid improvement! The recipe is becoming well-rounded.',
    pl: 'Solidna poprawa! Przepis staje się zrównoważony.',
    ru: 'Хорошее улучшение! Рецепт становится сбалансированнее.',
    uk: 'Гарне покращення! Рецепт стає збалансованішим.',
  },
  minor: {
    en: 'Small tweaks applied. Try once more for better results.',
    pl: 'Drobne poprawki. Spróbuj jeszcze raz.',
    ru: 'Небольшие правки. Попробуй ещё раз для лучшего результата.',
    uk: 'Невеликі правки. Спробуй ще раз.',
  },
};

function buildChefText(diagnosis: RuleDiagnosis, lang: string, hasImproved: boolean, scoreDelta: number): string {
  const l = lang as 'en' | 'pl' | 'ru' | 'uk';

  if (hasImproved) {
    // Remaining non-info issues sorted by impact
    const remaining = [...diagnosis.issues]
      .filter(i => i.severity !== 'info')
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3);

    const phrases = remaining
      .map(i => ISSUE_PHRASES[i.rule]?.[l] || ISSUE_PHRASES[i.rule]?.en)
      .filter(Boolean);

    // Pick base sentence: if critical issues remain, never say "great"
    const hasCriticalLeft = remaining.some(i => i.severity === 'critical');
    const base = (!hasCriticalLeft && scoreDelta >= 15)
      ? (CHEF_POST_IMPROVE.great[l] || CHEF_POST_IMPROVE.great.en)
      : (!hasCriticalLeft && scoreDelta >= 5)
      ? (CHEF_POST_IMPROVE.good[l] || CHEF_POST_IMPROVE.good.en)
      : (CHEF_POST_IMPROVE.minor[l] || CHEF_POST_IMPROVE.minor.en);

    // ALWAYS append remaining issues if they exist — makes text specific
    if (phrases.length > 0) {
      const BUT: Record<string, string> = { en: 'Still:', pl: 'Jeszcze:', ru: 'Ещё:', uk: 'Ще:' };
      return `${base} ${BUT[l] || BUT.en} ${phrases.join(', ')}.`;
    }

    // No remaining issues → truly great
    return CHEF_POST_IMPROVE.great[l] || CHEF_POST_IMPROVE.great.en;
  }

  if (diagnosis.issues.length === 0 || diagnosis.health_score >= 85) {
    return CHEF_INTRO.perfect[l] || CHEF_INTRO.perfect.en;
  }

  // Pick top 2 most impactful non-info issues
  const topIssues = [...diagnosis.issues]
    .filter(i => i.severity !== 'info')
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 2);

  const phrases = topIssues
    .map(i => ISSUE_PHRASES[i.rule]?.[l] || ISSUE_PHRASES[i.rule]?.en)
    .filter(Boolean);

  const intro = diagnosis.critical_count > 0
    ? (CHEF_INTRO.critical[l] || CHEF_INTRO.critical.en)
    : (CHEF_INTRO.warning[l] || CHEF_INTRO.warning.en);

  if (phrases.length === 0) return intro;

  const joined = phrases.length === 2
    ? `${phrases[0]} ${l === 'en' ? 'and' : l === 'pl' ? 'i' : l === 'ru' ? 'и' : 'та'} ${phrases[1]}`
    : phrases[0];

  return `${intro} ${joined}.`;
}

// ── Build concise action list from issues ────────────────────────────────────

const ACTION_LABELS: Record<string, Record<string, string>> = {
  low_protein:            { en: 'Add protein source', pl: 'Dodaj źródło białka', ru: 'Добавь белок', uk: 'Додай білок' },
  high_carbs:             { en: 'Reduce carbs ratio', pl: 'Zmniejsz udział węglowodanów', ru: 'Уменьши углеводы', uk: 'Зменши вуглеводи' },
  high_fat_ratio:         { en: 'Reduce fat portions', pl: 'Zmniejsz porcje tłuszczu', ru: 'Уменьши жиры', uk: 'Зменши жири' },
  low_fiber:              { en: 'Add vegetables or legumes', pl: 'Dodaj warzywa lub rośliny strączkowe', ru: 'Добавь овощи или бобовые', uk: 'Додай овочі або бобові' },
  high_sugar:             { en: 'Cut sugar', pl: 'Ogranicz cukier', ru: 'Уменьши сахар', uk: 'Зменши цукор' },
  low_acidity:            { en: 'Brighten with acid', pl: 'Rozjaśnij kwasem', ru: 'Добавь кислотности', uk: 'Додай кислотності' },
  low_umami:              { en: 'Boost umami depth', pl: 'Wzmocnij umami', ru: 'Усиль умами', uk: 'Підсиль умамі' },
  low_aroma:              { en: 'Add aromatics', pl: 'Dodaj aromaty', ru: 'Добавь ароматики', uk: 'Додай ароматики' },
  low_fat:                { en: 'Add fat for flavor', pl: 'Dodaj tłuszcz dla smaku', ru: 'Добавь жир для вкуса', uk: 'Додай жир для смаку' },
  ingredient_dominance:   { en: 'Add variety', pl: 'Dodaj różnorodność', ru: 'Добавь разнообразие', uk: 'Додай різноманіття' },
  missing_fat_source:     { en: 'Add a fat source', pl: 'Dodaj źródło tłuszczu', ru: 'Добавь источник жиров', uk: 'Додай джерело жирів' },
  missing_aromatics:      { en: 'Add herbs & spices', pl: 'Dodaj zioła i przyprawy', ru: 'Добавь травы и специи', uk: 'Додай трави та спеції' },
  missing_vegetables:     { en: 'Add vegetables', pl: 'Dodaj warzywa', ru: 'Добавь овощи', uk: 'Додай овочі' },
  missing_protein_source: { en: 'Add protein source', pl: 'Dodaj źródło białka', ru: 'Добавь белок', uk: 'Додай білок' },
  missing_acid_source:    { en: 'Add acid source', pl: 'Dodaj źródło kwasu', ru: 'Добавь кислоту', uk: 'Додай кислоту' },
};

function buildActions(issues: RuleIssue[], lang: string): string[] {
  const l = lang as 'en' | 'pl' | 'ru' | 'uk';
  const seen = new Set<string>();
  const actions: string[] = [];
  const sorted = [...issues]
    .filter(i => i.severity !== 'info')
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, warning: 1 };
      return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
    });
  for (const issue of sorted) {
    if (seen.has(issue.rule)) continue;
    seen.add(issue.rule);
    const label = ACTION_LABELS[issue.rule]?.[l] || ACTION_LABELS[issue.rule]?.en;
    if (label) actions.push(label);
    if (actions.length >= 4) break;
  }
  return actions;
}

// ── Collect unique fix slugs for auto-improve ────────────────────────────────

export function collectAutoFixSlugs(issues: RuleIssue[]): string[] {
  const seen = new Set<string>();
  const slugs: string[] = [];
  const sorted = [...issues]
    .filter(i => i.severity !== 'info' && i.fix_slugs.length > 0)
    .sort((a, b) => b.impact - a.impact);
  for (const issue of sorted) {
    for (const slug of issue.fix_slugs) {
      if (!seen.has(slug)) { seen.add(slug); slugs.push(slug); }
      if (slugs.length >= 3) return slugs;
    }
  }
  return slugs;
}

/** Detect which rules need grams REDUCTION (not addition) */
export function collectReduceRules(issues: RuleIssue[]): string[] {
  const REDUCE_RULES = new Set(['high_sugar', 'high_fat_ratio', 'high_carbs']);
  return issues
    .filter(i => REDUCE_RULES.has(i.rule) && i.severity !== 'info')
    .sort((a, b) => b.impact - a.impact)
    .map(i => i.rule);
}

// ── Animated counter hook ────────────────────────────────────────────────────

function useAnimatedNumber(target: number, duration = 800): number {
  const [value, setValue] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = target;
    if (from === to) { setValue(to); return; }

    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

// ── Big Delta Row — the WOW numbers ──────────────────────────────────────────

function BigDelta({ label, before, after, unit, invert, emoji, highlight }: {
  label: string; before: number; after: number; unit: string;
  invert?: boolean; emoji?: string; highlight?: boolean;
}) {
  const diff = after - before;
  // Always show score row (highlight=true); skip others if diff < 0.5
  if (!highlight && Math.abs(diff) < 0.5) return null;
  const improved = Math.abs(diff) < 0.5 ? true : invert ? diff < 0 : diff > 0;
  const animatedAfter = useAnimatedNumber(Math.round(after));
  const absDiff = Math.abs(Math.round(diff));

  return (
    <div className={cn(
      'flex items-center justify-between rounded-lg transition-all duration-500',
      highlight ? 'py-3 px-4' : 'py-2 px-3',
      improved ? 'bg-emerald-500/8' : 'bg-red-500/8',
      highlight && 'bg-emerald-500/15 border border-emerald-500/20',
    )}>
      <div className="flex items-center gap-2">
        {emoji && <span className={highlight ? 'text-lg' : 'text-sm'}>{emoji}</span>}
        <span className={cn(
          'font-bold text-muted-foreground uppercase tracking-wider',
          highlight ? 'text-sm' : 'text-xs',
        )}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-muted-foreground/50 tabular-nums line-through decoration-1',
          highlight ? 'text-base' : 'text-sm',
        )}>
          {Math.round(before)}{unit}
        </span>
        <span className={cn('text-muted-foreground/30', highlight && 'text-lg')}>→</span>
        <span className={cn(
          'font-black tabular-nums transition-all duration-700',
          highlight ? 'text-2xl' : 'text-lg',
          improved ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
        )}>
          {animatedAfter}{unit}
        </span>
        {absDiff > 0 && (
          <span className={cn(
            'inline-flex items-center gap-0.5 font-black rounded-md',
            highlight ? 'text-sm px-2 py-1' : 'text-xs px-1.5 py-0.5',
            improved ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-600',
          )}>
            {improved
              ? (invert
                  ? <><ArrowDown className="h-3 w-3" />{absDiff}{unit}</>
                  : <><ArrowUp className="h-3 w-3" />+{absDiff}{unit}</>)
              : (invert
                  ? <><ArrowUp className="h-3 w-3" />+{absDiff}{unit}</>
                  : <><ArrowDown className="h-3 w-3" />-{absDiff}{unit}</>)
            }
          </span>
        )}
      </div>
    </div>
  );
}

// ── What We Changed — changelog block ────────────────────────────────────────

const CHANGE_VERBS: Record<string, Record<string, string>> = {
  added:   { en: 'Added',   pl: 'Dodano',      ru: 'Добавили',  uk: 'Додали' },
  reduced: { en: 'Reduced', pl: 'Zmniejszono',  ru: 'Уменьшили', uk: 'Зменшили' },
};

function deduplicateChangelog(changes: ChangeLogEntry[]): ChangeLogEntry[] {
  const map = new Map<string, ChangeLogEntry>();
  for (const c of changes) {
    const key = `${c.type}:${c.slug}`;
    const existing = map.get(key);
    if (existing) {
      // Merge: accumulate delta, keep latest grams
      map.set(key, {
        ...existing,
        grams: c.grams,
        delta: (existing.delta || 0) + (c.delta || 0),
      });
    } else {
      map.set(key, { ...c });
    }
  }
  return Array.from(map.values());
}

function ChangeLogBlock({ changes, locale }: { changes: ChangeLogEntry[]; locale: string }) {
  const t = useTranslations('chefTools.tools.recipeAnalyzer');
  const l = locale as 'en' | 'pl' | 'ru' | 'uk';
  const deduped = deduplicateChangelog(changes);
  if (deduped.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {t('whatWeChanged')}
      </p>
      {deduped.map((c, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-lg border',
            c.type === 'added'
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400',
          )}
        >
          {c.type === 'added' ? (
            <Plus className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="font-bold">
            {CHANGE_VERBS[c.type]?.[l] || CHANGE_VERBS[c.type]?.en}
          </span>
          <span className="font-medium">{c.name}</span>
          <span className="text-muted-foreground ml-auto tabular-nums shrink-0 flex items-center gap-1">
            {c.type === 'reduced' && c.delta ? (
              <>
                <span className="line-through decoration-1 opacity-50">{c.grams + c.delta}g</span>
                <span>→</span>
                <span className="font-black">{c.grams}g</span>
                <span className="text-amber-600 dark:text-amber-400 font-black">(−{c.delta}g)</span>
              </>
            ) : (
              <span className="font-black text-emerald-600 dark:text-emerald-400">+{c.grams}g</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

interface ChefSummaryProps {
  diagnosis: RuleDiagnosis;
  score: number;
  locale: string;
  onAutoImprove: (slugs: string[]) => void;
  improving: boolean;
  previous?: NutritionSnapshot | null;
  current?: NutritionSnapshot | null;
  changeLog?: ChangeLogEntry[];
  /** How many times user has clicked improve (hard limit = 3) */
  improveCount?: number;
  /** True when last improve attempt changed nothing */
  improveExhausted?: boolean;
}

export function ChefSummary({
  diagnosis, score, locale, onAutoImprove, improving,
  previous, current, changeLog = [],
  improveCount = 0, improveExhausted = false,
}: ChefSummaryProps) {
  const t = useTranslations('chefTools.tools.recipeAnalyzer');
  const d = diagnosis;

  const hasImproved = !!previous && !!current;
  const scoreDelta = previous ? d.health_score - previous.health_score : 0;

  const chefText = buildChefText(d, locale, hasImproved, scoreDelta);
  const actions = buildActions(d.issues, locale);
  const autoFixSlugs = collectAutoFixSlugs(d.issues);
  const reduceRules = collectReduceRules(d.issues);
  const canAutoImprove = autoFixSlugs.length > 0 || reduceRules.length > 0;
  const isGood = d.issues.length === 0 || d.health_score >= 85;

  const animatedScore = useAnimatedNumber(d.health_score);

  const scoreBorderColor = d.health_score >= 80
    ? 'border-emerald-500/30' : d.health_score >= 60
    ? 'border-green-500/30' : d.health_score >= 40
    ? 'border-amber-500/30' : 'border-red-500/30';

  const scoreBgGlow = d.health_score >= 80
    ? 'bg-emerald-500/5' : d.health_score >= 60
    ? 'bg-green-500/5' : d.health_score >= 40
    ? 'bg-amber-500/5' : 'bg-red-500/5';

  const scoreColor = d.health_score >= 80
    ? 'text-emerald-600 dark:text-emerald-400' : d.health_score >= 60
    ? 'text-green-600 dark:text-green-400' : d.health_score >= 40
    ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

  const scoreBg = d.health_score >= 80
    ? 'bg-emerald-500' : d.health_score >= 60
    ? 'bg-green-500' : d.health_score >= 40
    ? 'bg-amber-500' : 'bg-red-500';

  // Improvement percentage for badge
  const improvePct = previous && previous.health_score > 0
    ? Math.round(((d.health_score - previous.health_score) / previous.health_score) * 100)
    : 0;

  return (
    <div className={cn(
      'rounded-2xl border-2 overflow-hidden transition-all duration-700 relative',
      scoreBorderColor, scoreBgGlow,
    )}>
      {/* ── Shimmer overlay during improving ── */}
      {improving && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" />
        </div>
      )}

      <div className="px-5 py-5">
        {/* ── Score improvement hero badge (after auto-improve) ── */}
        {hasImproved && scoreDelta > 0 && (
          <div className="mb-4 flex flex-col items-center gap-2 py-4 px-5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-emerald-500/15 border-2 border-emerald-500/30 chef-fade-in">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-emerald-500 animate-pulse" />
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                🟢 +{scoreDelta}
              </span>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                {previous.health_score} → {d.health_score}
              </span>
            </div>
            {improvePct > 0 && (
              <span className="text-sm font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{improvePct}% {locale === 'ru' ? 'улучшение' : locale === 'uk' ? 'покращення' : locale === 'pl' ? 'poprawa' : 'improvement'}
              </span>
            )}
          </div>
        )}

        {/* Chef avatar + voice */}
        <div className="flex items-start gap-4">
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500',
            hasImproved && scoreDelta >= 5 ? 'bg-emerald-500/15' : 'bg-primary/10',
          )}>
            <ChefHat className={cn(
              'h-7 w-7 transition-colors duration-500',
              hasImproved && scoreDelta >= 5 ? 'text-emerald-600' : 'text-primary',
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-base font-bold leading-snug transition-all duration-500',
              hasImproved && scoreDelta >= 5 && 'text-emerald-700 dark:text-emerald-300',
            )}>
              {chefText}
            </p>

            {/* Score bar with animated number */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden relative">
                <div
                  className={cn('h-full rounded-full transition-all duration-[1200ms] ease-out relative', scoreBg)}
                  style={{ width: `${d.health_score}%` }}
                >
                  {/* Pulse glow on the leading edge */}
                  <div className="absolute right-0 top-0 bottom-0 w-4 rounded-full bg-white/30 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn('text-2xl font-black tabular-nums', scoreColor)}>
                  {animatedScore}
                </span>
              </div>
            </div>

            {/* Category mini-scores */}
            <div className="flex gap-4 mt-2">
              {(['flavor', 'nutrition', 'dominance', 'structure'] as const).map(cat => {
                const s = d.category_scores[cat];
                const c = s >= 80 ? 'text-emerald-600' : s >= 60 ? 'text-green-600' : s >= 40 ? 'text-amber-600' : 'text-red-600';
                return (
                  <span key={cat} className="text-[10px] text-muted-foreground">
                    {t(`cat_${cat}`)} <span className={cn('font-black', c)}>{s}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
           BEFORE → AFTER — the WOW block (shown after auto-improve)
           ══════════════════════════════════════════════════════════════════ */}
        {previous && current && (
          <div className="mt-5 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 overflow-hidden chef-fade-in">
            {/* Header */}
            <div className="px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  {t('beforeAfter')}
                </span>
              </div>
            </div>

            {/* Delta rows */}
            <div className="p-3 space-y-1">
              <BigDelta label={t('score')}   emoji="🎯" before={previous.health_score} after={d.health_score} unit="" highlight />
              <BigDelta label="kcal"         emoji="🔥" before={previous.calories} after={current.calories} unit="" />
              <BigDelta label={t('protein')} emoji="💪" before={previous.protein} after={current.protein} unit="g" />
              <BigDelta label={t('fiber')}   emoji="🥦" before={previous.fiber} after={current.fiber} unit="g" />
              <BigDelta label={t('sugar')}   emoji="🍬" before={previous.sugar} after={current.sugar} unit="g" invert />
              <BigDelta label={t('fat')}     emoji="🧈" before={previous.fat} after={current.fat} unit="g" invert />
              <BigDelta label={t('carbs')}   emoji="🍞" before={previous.carbs} after={current.carbs} unit="g" invert />
            </div>

            {/* What we changed — changelog */}
            {changeLog.length > 0 && (
              <div className="px-4 pb-4 pt-1">
                <ChangeLogBlock changes={changeLog} locale={locale} />
              </div>
            )}
          </div>
        )}

        {/* What to do — prioritized numbered actions (only when NOT just improved) */}
        {!hasImproved && actions.length > 0 && (
          <div className="mt-4 pl-16">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              {t('whatToDo')}
            </p>
            <ol className="space-y-1">
              {actions.map((action, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className={cn(
                    'flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black shrink-0',
                    i === 0
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}>
                    {i + 1}
                  </span>
                  <span className={cn(
                    'font-medium',
                    i === 0 ? 'text-foreground' : 'text-foreground/70',
                  )}>
                    {action}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Auto-improve button — unified canMeaningfullyImprove logic */}
        {(() => {
          const MAX_IMPROVES = 3;
          const reachedLimit = improveCount >= MAX_IMPROVES;

          // ── SINGLE SOURCE OF TRUTH: canMeaningfullyImprove ──
          // Unifies backend (hasFixableIssues) + frontend (noOp, limit) logic
          const hasFixableIssues = autoFixSlugs.length > 0 || reduceRules.length > 0;
          const canMeaningfullyImprove = hasFixableIssues && !improveExhausted && !reachedLimit;
          const isTerminal = isGood || !canMeaningfullyImprove;

          // Remaining critical+warning issues (not info)
          const remainingIssues = d.issues.filter(i => i.severity !== 'info');
          const hasCriticalRemaining = remainingIssues.some(i => i.severity === 'critical');
          const hasWarningRemaining = remainingIssues.length > 0;

          // ── 3-state classification ──
          // 1. PERFECT — score ≥ 85 and no meaningful issues
          // 2. NEEDS_MANUAL — terminal but still has critical/warning issues
          // 3. OPTIMIZED — terminal, no critical issues (technical limit)
          type TerminalClass = 'perfect' | 'needs_manual' | 'optimized';

          const terminalClass: TerminalClass = isGood
            ? 'perfect'
            : (hasCriticalRemaining || hasWarningRemaining)
            ? 'needs_manual'
            : 'optimized';

          // ── Terminal states ──
          if (hasImproved && isTerminal) {
            // Blockers list — remaining issues as actionable text
            const blockers = buildActions(remainingIssues, locale);

            if (terminalClass === 'perfect') {
              // ✅ State 1: Perfect — green celebration
              return (
                <div className="mt-4 flex flex-col items-center gap-1.5 chef-fade-in">
                  <div className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/30">
                    <CheckCircle className="h-5 w-5" />
                    <span>{t('perfectBalance')}</span>
                  </div>
                </div>
              );
            }

            if (terminalClass === 'needs_manual') {
              // 🧠 State 3: Needs manual intervention — still has problems
              return (
                <div className="mt-4 space-y-3 chef-fade-in">
                  {/* Main badge — amber/orange warning */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={cn(
                      'flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider border-2',
                      hasCriticalRemaining
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
                    )}>
                      <AlertTriangle className="h-5 w-5" />
                      <span>{t('needsManualFix')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground/70 italic">
                      {t('changeConcept')}
                    </p>
                  </div>

                  {/* Blocker list — "What prevents further improvement" */}
                  {blockers.length > 0 && (
                    <div className={cn(
                      'rounded-xl border p-4 space-y-2',
                      hasCriticalRemaining
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-amber-500/5 border-amber-500/20',
                    )}>
                      <p className={cn(
                        'text-[10px] font-bold uppercase tracking-widest',
                        hasCriticalRemaining
                          ? 'text-red-600/70 dark:text-red-400/70'
                          : 'text-amber-600/70 dark:text-amber-400/70',
                      )}>
                        {t('whatBlocks')}
                      </p>
                      <ul className="space-y-1">
                        {blockers.map((b, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <span className={cn(
                              'flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black shrink-0',
                              i === 0
                                ? (hasCriticalRemaining ? 'bg-red-500 text-white' : 'bg-amber-500 text-white')
                                : 'bg-muted text-muted-foreground',
                            )}>
                              {i + 1}
                            </span>
                            <span className="font-medium text-foreground/80">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            }

            // ⚙️ State 2: Optimized — technical limit, no critical issues
            return (
              <div className="mt-4 flex flex-col items-center gap-1.5 chef-fade-in">
                <div className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border-2 border-blue-500/25">
                  <Info className="h-5 w-5" />
                  <span>{t('technicalLimit')}</span>
                </div>
                <p className="text-xs text-muted-foreground/70 italic">
                  {t('changeConcept')}
                </p>
              </div>
            );
          }

          // ── Not terminal but nothing to auto-fix on first analysis ──
          if (!hasImproved && !canMeaningfullyImprove) return null;
          if (!hasImproved && isGood) return null;

          // ── Active: can meaningfully improve ──
          if (canMeaningfullyImprove && !isGood) {
            return (
              <div className={cn('mt-4', !hasImproved && 'pl-16')}>
                <button
                  onClick={() => onAutoImprove(autoFixSlugs)}
                  disabled={improving}
                  className={cn(
                    'flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                    hasImproved
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/30 hover:bg-emerald-500/20 hover:scale-[1.02]'
                      : 'bg-primary text-primary-foreground hover:brightness-110 hover:scale-[1.02]',
                  )}
                >
                  {improving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t('improving')}</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      {hasImproved
                        ? `${t('improveMore')} (${improveCount}/${MAX_IMPROVES})`
                        : t('autoImprove')}
                    </>
                  )}
                </button>
              </div>
            );
          }

          return null;
        })()}
      </div>

      {/* Shimmer + entrance animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes chefFadeIn {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .chef-fade-in {
          animation: chefFadeIn 0.7s ease-out both;
        }
      `}</style>
    </div>
  );
}