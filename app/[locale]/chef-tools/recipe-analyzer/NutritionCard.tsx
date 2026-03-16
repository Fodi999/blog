'use client';

import { useTranslations } from 'next-intl';

type NutritionSummary = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
};

type MacrosSummary = {
  protein_pct: number;
  fat_pct: number;
  carbs_pct: number;
};

interface Props {
  nutrition: NutritionSummary;
  perPortion?: NutritionSummary;
  portions: number;
  macros: MacrosSummary;
  score: number;
  diet: string[];
}

export function NutritionCard({ nutrition, perPortion, portions, macros, score, diet }: Props) {
  const t = useTranslations('chefTools.tools.recipeAnalyzer');
  const display = perPortion || nutrition;
  const label = perPortion
    ? t('perPortion', { portions: String(portions) })
    : t('total');

  const scoreColor =
    score >= 70 ? 'text-green-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';

  const dietLabels: Record<string, string> = {
    vegan: '🌱 Vegan',
    vegetarian: '🥚 Vegetarian',
    keto: '🥑 Keto',
    paleo: '🦴 Paleo',
    gluten_free: '🌾 Gluten Free',
    mediterranean: '🫒 Mediterranean',
    low_carb: '📉 Low Carb',
  };

  return (
    <div className="border border-border/60 rounded-2xl p-5 bg-background">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {t('nutrition')}
        </h3>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">{t('score')}</span>
          <span className={`ml-2 text-lg font-black ${scoreColor}`}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Main calories */}
      <div className="text-center mb-5">
        <span className="text-4xl font-black tracking-tighter">{Math.round(display.calories)}</span>
        <span className="text-lg text-muted-foreground ml-1">kcal</span>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>

      {/* Macros bars */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <MacroBar label={t('protein')} value={display.protein} pct={macros.protein_pct} color="bg-blue-500" />
        <MacroBar label={t('fat')} value={display.fat} pct={macros.fat_pct} color="bg-amber-500" />
        <MacroBar label={t('carbs')} value={display.carbs} pct={macros.carbs_pct} color="bg-green-500" />
      </div>

      {/* Extra nutrition */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div className="flex justify-between px-2 py-1 bg-muted/30 rounded-lg">
          <span className="text-muted-foreground">{t('fiber')}</span>
          <span className="font-bold">{display.fiber}g</span>
        </div>
        <div className="flex justify-between px-2 py-1 bg-muted/30 rounded-lg">
          <span className="text-muted-foreground">{t('sugar')}</span>
          <span className="font-bold">{display.sugar}g</span>
        </div>
      </div>

      {/* Diet badges */}
      {diet.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {diet.map(d => (
            <span
              key={d}
              className="px-2 py-0.5 text-xs font-bold bg-primary/10 text-primary rounded-full border border-primary/20"
            >
              {dietLabels[d] || d}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MacroBar({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className="text-lg font-black">{Math.round(value)}g</div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{pct.toFixed(0)}%</div>
    </div>
  );
}
