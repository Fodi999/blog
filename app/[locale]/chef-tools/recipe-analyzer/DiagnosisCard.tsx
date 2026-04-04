'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types (mirrors backend rule_engine::RuleDiagnosis) ───────────────────────

export type RuleIssue = {
  category: string;
  severity: string;
  rule: string;
  title_key: string;
  description_key: string;
  fix_slugs: string[];
  fix_keys: string[];
  value?: number;
  threshold?: number;
  impact: number;
};

export type CategoryScores = {
  flavor: number;
  nutrition: number;
  dominance: number;
  structure: number;
};

export type RuleDiagnosis = {
  health_score: number;
  category_scores: CategoryScores;
  issues: RuleIssue[];
  critical_count: number;
  warning_count: number;
  info_count: number;
};

// ── i18n maps ────────────────────────────────────────────────────────────────

const RULE_TITLES: Record<string, Record<string, string>> = {
  'rules.lowAcidity':        { en: 'Low acidity', pl: 'Niska kwasowość', ru: 'Мало кислотности', uk: 'Мало кислотності' },
  'rules.lowUmami':          { en: 'Low umami', pl: 'Niskie umami', ru: 'Мало умами', uk: 'Мало умамі' },
  'rules.lowFat':            { en: 'Low fat flavors', pl: 'Niski tłuszcz', ru: 'Мало жирности', uk: 'Мало жирності' },
  'rules.lowAroma':          { en: 'Weak aroma', pl: 'Słaby aromat', ru: 'Слабый аромат', uk: 'Слабкий аромат' },
  'rules.lowSweetness':      { en: 'Low sweetness', pl: 'Niska słodycz', ru: 'Мало сладости', uk: 'Мало солодкості' },
  'rules.lowBitterness':     { en: 'Low bitterness', pl: 'Niska goryczka', ru: 'Мало горечи', uk: 'Мало гіркоти' },
  'rules.highCarbs':         { en: 'Too many carbs', pl: 'Za dużo węglowodanów', ru: 'Слишком много углеводов', uk: 'Занадто багато вуглеводів' },
  'rules.lowProtein':        { en: 'Not enough protein', pl: 'Za mało białka', ru: 'Недостаточно белка', uk: 'Недостатньо білка' },
  'rules.highFatRatio':      { en: 'High fat ratio', pl: 'Wysoki udział tłuszczu', ru: 'Много жиров', uk: 'Багато жирів' },
  'rules.lowFiber':          { en: 'Low fiber', pl: 'Mało błonnika', ru: 'Мало клетчатки', uk: 'Мало клітковини' },
  'rules.highSugar':         { en: 'High sugar', pl: 'Dużo cukru', ru: 'Много сахара', uk: 'Багато цукру' },
  'rules.dominance':         { en: 'One ingredient dominates', pl: 'Jeden składnik dominuje', ru: 'Один ингредиент доминирует', uk: 'Один інгредієнт домінує' },
  'rules.missingFat':        { en: 'No fat source', pl: 'Brak źródła tłuszczu', ru: 'Нет источника жиров', uk: 'Немає джерела жирів' },
  'rules.missingAromatics':  { en: 'No aromatics', pl: 'Brak aromatów', ru: 'Нет ароматики', uk: 'Немає ароматики' },
  'rules.missingVegetables': { en: 'No vegetables', pl: 'Brak warzyw', ru: 'Нет овощей', uk: 'Немає овочів' },
  'rules.missingProtein':    { en: 'No protein source', pl: 'Brak źródła białka', ru: 'Нет источника белка', uk: 'Немає джерела білка' },
  'rules.missingAcid':       { en: 'No acid source', pl: 'Brak źródła kwasu', ru: 'Нет источника кислоты', uk: 'Немає джерела кислоти' },
};

const FIX_SUGGESTIONS: Record<string, Record<string, string>> = {
  'rules.fixAddAcid':          { en: 'Add lemon, tomato, or vinegar', pl: 'Dodaj cytrynę, pomidor lub ocet', ru: 'Добавь лимон, помидор или уксус', uk: 'Додай лимон, помідор або оцет' },
  'rules.fixAddUmami':         { en: 'Add hard cheese, soy sauce, or mushrooms', pl: 'Dodaj ser, sos sojowy lub grzyby', ru: 'Добавь сыр, соевый соус или грибы', uk: 'Додай сир, соєвий соус або гриби' },
  'rules.fixAddFat':           { en: 'Add butter, olive oil, or cream', pl: 'Dodaj masło, oliwę lub śmietanę', ru: 'Добавь масло, оливковое масло или сливки', uk: 'Додай масло, оливкову олію або вершки' },
  'rules.fixAddAroma':         { en: 'Add garlic, basil, or black pepper', pl: 'Dodaj czosnek, bazylię lub pieprz', ru: 'Добавь чеснок, базилик или чёрный перец', uk: 'Додай часник, базилік або чорний перець' },
  'rules.fixAddSweet':         { en: 'Add honey, onion, or carrot', pl: 'Dodaj miód, cebulę lub marchewkę', ru: 'Добавь мёд, лук или морковь', uk: 'Додай мед, цибулю або моркву' },
  'rules.fixAddBitter':        { en: 'Add black pepper, spinach, or walnuts', pl: 'Dodaj pieprz, szpinak lub orzechy', ru: 'Добавь чёрный перец, шпинат или грецкие', uk: 'Додай чорний перець, шпинат або горіхи' },
  'rules.fixReduceCarbs':      { en: 'Add protein: chicken, salmon, or eggs', pl: 'Dodaj białko: kurczak, łosoś lub jajka', ru: 'Добавь белок: курица, лосось или яйца', uk: 'Додай білок: курка, лосось або яйця' },
  'rules.fixAddProtein':       { en: 'Add chicken, eggs, cheese, or lentils', pl: 'Dodaj kurczaka, jajka, ser lub soczewicę', ru: 'Добавь курицу, яйца, сыр или чечевицу', uk: 'Додай курку, яйця, сир або сочевицю' },
  'rules.fixReduceFat':        { en: 'Reduce oil or butter portions', pl: 'Zmniejsz porcję oleju lub masła', ru: 'Уменьши порцию масла', uk: 'Зменши порцію олії або масла' },
  'rules.fixAddFiber':         { en: 'Add broccoli, lentils, or oatmeal', pl: 'Dodaj brokuły, soczewicę lub owsiankę', ru: 'Добавь брокколи, чечевицу или овсянку', uk: 'Додай брокколі, сочевицю або вівсянку' },
  'rules.fixReduceSugar':      { en: 'Reduce sugar-heavy ingredients', pl: 'Zmniejsz składniki bogate w cukier', ru: 'Уменьши продукты с сахаром', uk: 'Зменши продукти з цукром' },
  'rules.fixAddVariety':       { en: 'Add more diverse ingredients', pl: 'Dodaj bardziej zróżnicowane składniki', ru: 'Добавь больше разнообразных ингредиентов', uk: 'Додай більше різноманітних інгредієнтів' },
  'rules.fixAddFatSource':     { en: 'Add olive oil or butter', pl: 'Dodaj oliwę lub masło', ru: 'Добавь оливковое масло или масло', uk: 'Додай оливкову олію або масло' },
  'rules.fixAddAromatics':     { en: 'Add garlic, basil, or pepper', pl: 'Dodaj czosnek, bazylię lub pieprz', ru: 'Добавь чеснок, базилик или перец', uk: 'Додай часник, базилік або перець' },
  'rules.fixAddVegetables':    { en: 'Add tomato, onion, or broccoli', pl: 'Dodaj pomidor, cebulę lub brokuły', ru: 'Добавь помидор, лук или брокколи', uk: 'Додай помідор, цибулю або брокколі' },
  'rules.fixAddProteinSource': { en: 'Add chicken, eggs, or salmon', pl: 'Dodaj kurczaka, jajka lub łososia', ru: 'Добавь курицу, яйца или лосось', uk: 'Додай курку, яйця або лосось' },
  'rules.fixAddAcidSource':    { en: 'Add lemon, tomato, or vinegar', pl: 'Dodaj cytrynę, pomidor lub ocet', ru: 'Добавь лимон, помидор или уксус', uk: 'Додай лимон, помідор або оцет' },
};

// ── Severity config ──────────────────────────────────────────────────────────

const SEV = {
  critical: { icon: AlertTriangle, text: 'text-red-600 dark:text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
  warning:  { icon: AlertCircle,   text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  info:     { icon: Info,          text: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
} as const;

// ── Group related issues → problem + solution ────────────────────────────────

type IssueGroup = {
  severity: string;
  titles: string[];
  solution: string;
  slugs: string[];
  impact: number;
};

function groupIssues(issues: RuleIssue[], lang: string): IssueGroup[] {
  const l = lang as 'en' | 'pl' | 'ru' | 'uk';
  const byCategory = new Map<string, RuleIssue[]>();
  for (const issue of issues) {
    const cat = issue.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(issue);
  }

  const groups: IssueGroup[] = [];

  for (const [, catIssues] of byCategory) {
    const bySev = new Map<string, RuleIssue[]>();
    for (const issue of catIssues) {
      const sev = issue.severity;
      if (!bySev.has(sev)) bySev.set(sev, []);
      bySev.get(sev)!.push(issue);
    }

    for (const [sev, sevIssues] of bySev) {
      const titles = sevIssues.map(i =>
        RULE_TITLES[i.title_key]?.[l] || RULE_TITLES[i.title_key]?.en || i.rule
      );
      const allFixKeys = [...new Set(sevIssues.flatMap(i => i.fix_keys))];
      const allFixSlugs = [...new Set(sevIssues.flatMap(i => i.fix_slugs))];
      const solution = allFixKeys
        .map(k => FIX_SUGGESTIONS[k]?.[l] || FIX_SUGGESTIONS[k]?.en || '')
        .filter(Boolean)
        .join('. ');
      const totalImpact = sevIssues.reduce((sum, i) => sum + i.impact, 0);
      groups.push({ severity: sev, titles, solution, slugs: allFixSlugs, impact: totalImpact });
    }
  }

  const order: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  groups.sort((a, b) => {
    const d = (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
    if (d !== 0) return d;
    return b.impact - a.impact;
  });

  return groups;
}

// ── Component ────────────────────────────────────────────────────────────────

interface DiagnosisCardProps {
  diagnosis: RuleDiagnosis;
  locale: string;
}

export function DiagnosisCard({ diagnosis, locale }: DiagnosisCardProps) {
  const t = useTranslations('chefTools.tools.recipeAnalyzer');
  const d = diagnosis;
  const groups = groupIssues(d.issues, locale);

  const mainGroups = groups.filter(g => g.severity !== 'info');
  const infoGroups = groups.filter(g => g.severity === 'info');
  const [showInfo, setShowInfo] = useState(false);

  if (d.issues.length === 0) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
        <ChefHat className="h-6 w-6 text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-bold text-emerald-600">{t('perfectRecipe')}</p>
          <p className="text-xs text-muted-foreground">{t('noIssuesFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {mainGroups.map((group, i) => {
        const sev = SEV[group.severity as keyof typeof SEV] || SEV.info;
        const SevIcon = sev.icon;
        return (
          <div key={i} className={cn('rounded-xl border px-4 py-3', sev.bg)}>
            <div className="flex items-start gap-3">
              <SevIcon className={cn('h-4 w-4 mt-0.5 shrink-0', sev.text)} />
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-bold', sev.text)}>
                  {group.titles.join(' · ')}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {infoGroups.length > 0 && (
        <div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-1 py-1"
          >
            <ChevronDown className={cn('h-3 w-3 transition-transform', showInfo && 'rotate-180')} />
            � {infoGroups.length} {t('tips')}
          </button>
          {showInfo && (
            <div className="space-y-1.5 mt-1">
              {infoGroups.map((group, i) => (
                <div key={i} className="rounded-lg border bg-blue-500/5 border-blue-500/15 px-3 py-2">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {group.titles.join(' · ')}
                    {group.solution && <span className="text-foreground/60"> — {group.solution}</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
