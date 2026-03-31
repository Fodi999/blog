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
      <div className="flex justify-center mb-10">
        <div className="inline-flex rounded-full bg-muted/20 backdrop-blur-md border border-border/40 p-1.5 gap-1.5 shadow-sm">
          {([
            { id: 'sous-chef' as Tab, label: t('sousChef') },
            { id: 'recipe-builder' as Tab, label: t('recipeBuilder') },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                'px-5 py-2 sm:px-8 sm:py-3 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500',
                active === tab.id
                  ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105 mx-1'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
