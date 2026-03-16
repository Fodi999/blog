'use client';

import { useTranslations } from 'next-intl';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

type FlavorSummary = {
  sweetness: number;
  acidity: number;
  bitterness: number;
  umami: number;
  fat: number;
  aroma: number;
  balance_score: number;
  weak: string[];
  strong: string[];
};

export function FlavorRadar({ flavor }: { flavor: FlavorSummary }) {
  const t = useTranslations('chefTools.tools.recipeAnalyzer');

  const data = [
    { dimension: t('sweetness'), value: flavor.sweetness, fullMark: 10 },
    { dimension: t('acidity'), value: flavor.acidity, fullMark: 10 },
    { dimension: t('umami'), value: flavor.umami, fullMark: 10 },
    { dimension: t('fatDimension'), value: flavor.fat, fullMark: 10 },
    { dimension: t('aroma'), value: flavor.aroma, fullMark: 10 },
    { dimension: t('bitterness'), value: flavor.bitterness, fullMark: 10 },
  ];

  // Mapping for weak/strong badges (API returns English keys)
  const dimensionLabels: Record<string, string> = {
    sweetness: t('sweetness'),
    acidity: t('acidity'),
    bitterness: t('bitterness'),
    umami: t('umami'),
    fat: t('fatDimension'),
    aroma: t('aroma'),
  };

  const scoreColor =
    flavor.balance_score >= 70
      ? 'text-green-500'
      : flavor.balance_score >= 40
        ? 'text-amber-500'
        : 'text-red-500';

  return (
    <div className="border border-border/60 rounded-2xl p-5 bg-background">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {t('flavorProfile')}
        </h3>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">{t('balance')}</span>
          <span className={`ml-2 text-lg font-black ${scoreColor}`}>
            {flavor.balance_score}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid
              stroke="hsl(var(--border))"
              strokeOpacity={0.4}
            />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11,
                fontWeight: 700,
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Flavor"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
              }}
              formatter={(value: any) => [Number(value).toFixed(1), t('score')]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Weak & Strong indicators */}
      <div className="flex flex-wrap gap-2 mt-3">
        {flavor.weak.map(d => (
          <span
            key={d}
            className="px-2 py-0.5 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20"
          >
            ↓ {dimensionLabels[d] || d}
          </span>
        ))}
        {flavor.strong.map(d => (
          <span
            key={d}
            className="px-2 py-0.5 text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 rounded-full border border-green-500/20"
          >
            ↑ {dimensionLabels[d] || d}
          </span>
        ))}
      </div>
    </div>
  );
}
