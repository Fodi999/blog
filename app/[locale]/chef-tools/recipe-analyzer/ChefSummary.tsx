'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChefHat, Wand2, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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

function buildChefText(diagnosis: RuleDiagnosis, lang: string): string {
  const l = lang as 'en' | 'pl' | 'ru' | 'uk';

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

function collectAutoFixSlugs(issues: RuleIssue[]): string[] {
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

// ── Before/After delta component ─────────────────────────────────────────────

function DeltaRow({ label, before, after, unit, invert }: { label: string; before: number; after: number; unit: string; invert?: boolean }) {
  const diff = after - before;
  if (Math.abs(diff) < 0.5) return null;
  const improved = invert ? diff < 0 : diff > 0;
  return (
    <div className="flex items-center justify-between text-xs py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground/60 tabular-nums">{Math.round(before)}{unit}</span>
        <span className="text-muted-foreground/40">→</span>
        <span className={cn('font-bold tabular-nums', improved ? 'text-emerald-600' : 'text-red-500')}>
          {Math.round(after)}{unit}
        </span>
        {improved ? (
          <TrendingUp className="h-3 w-3 text-emerald-500" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-500" />
        )}
      </div>
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
}

export function ChefSummary({ diagnosis, score, locale, onAutoImprove, improving, previous, current }: ChefSummaryProps) {
  const t = useTranslations('chefTools.tools.recipeAnalyzer');
  const d = diagnosis;

  const chefText = buildChefText(d, locale);
  const actions = buildActions(d.issues, locale);
  const autoFixSlugs = collectAutoFixSlugs(d.issues);
  const isGood = d.issues.length === 0 || d.health_score >= 85;

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

  // Before/After delta for score
  const scoreDelta = previous ? d.health_score - previous.health_score : 0;

  return (
    <div className={cn('rounded-2xl border-2 overflow-hidden', scoreBorderColor, scoreBgGlow)}>
      <div className="px-5 py-5">
        {/* Chef avatar + voice */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <ChefHat className="h-7 w-7 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-base font-bold leading-snug">{chefText}</p>

            {/* Score bar */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-700', scoreBg)} style={{ width: `${d.health_score}%` }} />
              </div>
              <div className="flex items-center gap-1">
                <span className={cn('text-xl font-black tabular-nums', scoreColor)}>
                  {d.health_score}
                </span>
                {scoreDelta > 0 && (
                  <span className="text-xs font-bold text-emerald-600">+{scoreDelta}</span>
                )}
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

        {/* What to do — actions */}
        {actions.length > 0 && (
          <div className="mt-4 pl-16">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              {t('whatToDo')}
            </p>
            <ul className="space-y-1">
              {actions.map((action, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-primary font-bold">→</span>
                  <span className="font-medium">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Before/After comparison (shown after auto-improve) */}
        {previous && current && (
          <div className="mt-4 pl-16 p-3 rounded-xl bg-background/60 border border-border/40">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              {t('beforeAfter')}
            </p>
            <div className="space-y-0.5">
              <DeltaRow label={t('score')} before={previous.score} after={score} unit="" />
              <DeltaRow label="kcal" before={previous.calories} after={current.calories} unit="" />
              <DeltaRow label={t('protein')} before={previous.protein} after={current.protein} unit="g" />
              <DeltaRow label={t('fat')} before={previous.fat} after={current.fat} unit="g" invert />
              <DeltaRow label={t('fiber')} before={previous.fiber} after={current.fiber} unit="g" />
              <DeltaRow label={t('sugar')} before={previous.sugar} after={current.sugar} unit="g" invert />
            </div>
          </div>
        )}

        {/* Auto-improve button */}
        {autoFixSlugs.length > 0 && !isGood && (
          <div className="mt-4 pl-16">
            <button
              onClick={() => onAutoImprove(autoFixSlugs)}
              disabled={improving}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all',
                'bg-primary text-primary-foreground hover:brightness-110',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {improving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {t('autoImprove')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
