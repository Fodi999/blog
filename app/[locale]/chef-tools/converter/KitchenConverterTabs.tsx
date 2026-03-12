'use client';

import { useState } from 'react';
import { Salad, Scale, Droplets } from 'lucide-react';
import { IngredientConverterClient, type IngredientOption, type I18nIngConverter } from './IngredientConverterClient';
import ConverterClient, { type UnitGroups } from './ConverterClient';

interface Props {
  groups: UnitGroups | undefined;
  ingredients: IngredientOption[];
  i18n: I18nIngConverter;
  labels: {
    tabIngredients: string;
    tabMass: string;
    tabVolume: string;
  };
}

const TABS = ['ingredients', 'mass', 'volume'] as const;
type Tab = typeof TABS[number];

export function KitchenConverterTabs({ groups, ingredients, i18n, labels }: Props) {
  const [active, setActive] = useState<Tab>('ingredients');

  const tabConfig: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'ingredients', label: labels.tabIngredients, icon: <Salad className="w-4 h-4" /> },
    { id: 'mass',        label: labels.tabMass,        icon: <Scale className="w-4 h-4" /> },
    { id: 'volume',      label: labels.tabVolume,      icon: <Droplets className="w-4 h-4" /> },
  ];

  return (
    <div>
      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 rounded-2xl bg-muted/40 border border-border/40 w-fit mb-8">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-200 ${
              active === tab.id
                ? 'bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab panels ── */}
      <div>
        {active === 'ingredients' && (
          <IngredientConverterClient ingredients={ingredients} i18n={i18n} />
        )}
        {active === 'mass' && (
          <ConverterClient groups={groups} mode="mass" />
        )}
        {active === 'volume' && (
          <ConverterClient groups={groups} mode="volume" />
        )}
      </div>
    </div>
  );
}
