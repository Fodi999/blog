'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type Tab = 'sous-chef' | 'recipe-builder';

export function ChefToolsTabs({
  sousChef,
  recipeBuilder,
}: {
  sousChef: ReactNode;
  recipeBuilder: ReactNode;
}) {
  const t = useTranslations('chefTools.tabs');
  const [active, setActive] = useState<Tab>('sous-chef');

  return (
    <div>
      {/* Tab selector */}
      <div className="flex justify-center mb-8">
        <select
          value={active}
          onChange={(e) => setActive(e.target.value as Tab)}
          className={cn(
            'w-full max-w-xs rounded-xl border border-border/50 bg-muted/30 px-4 py-2.5',
            'text-sm font-bold text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50',
            'transition-all duration-200 cursor-pointer appearance-none',
          )}
        >
          <option value="sous-chef">{t('sousChef')}</option>
          <option value="recipe-builder">{t('recipeBuilder')}</option>
        </select>
      </div>

      {/* Content */}
      <div className={cn(active === 'sous-chef' ? 'block' : 'hidden')}>
        {sousChef}
      </div>
      <div className={cn(active === 'recipe-builder' ? 'block' : 'hidden')}>
        {recipeBuilder}
      </div>
    </div>
  );
}
