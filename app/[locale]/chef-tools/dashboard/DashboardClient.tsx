'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { HeroSearch } from './HeroSearch';
import { SeasonNow } from './SeasonNow';
import { IngredientGrid } from './IngredientGrid';
import { SmartResult } from './SmartResult';
import { useTranslations } from 'next-intl';
import type { DishIngredient } from './ChefBotPanel';

export function DashboardClient() {
  const t = useTranslations('chefTools.dashboard');

  /* ── Central state: selected product drives everything ───── */
  const [selected, setSelected] = useState<{ slug: string; name: string; image?: string | null } | null>(null);
  /* ── Extra dish ingredients — lifted here so they persist across panel changes ── */
  const [dishExtras, setDishExtras] = useState<DishIngredient[]>([]);
  const smartPanelRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((slug: string, name: string, image?: string | null) => {
    setSelected({ slug, name, image });
    // Clear extras when primary ingredient changes
    setDishExtras([]);
  }, []);

  const handleAddExtra = useCallback((ing: DishIngredient) => {
    setDishExtras((prev) => prev.find((e) => e.slug === ing.slug) ? prev : [...prev, ing]);
  }, []);

  const handleRemoveExtra = useCallback((slug: string) => {
    setDishExtras((prev) => prev.filter((e) => e.slug !== slug));
  }, []);

  const handleClear = useCallback(() => {
    setSelected(null);
    setDishExtras([]);
  }, []);

  /* Scroll SmartResult into view on mobile when a product is selected */
  useEffect(() => {
    if (selected && smartPanelRef.current) {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        smartPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [selected]);

  return (
    <div className="space-y-8">

      {/* ── Hero search — full width, always visible ─────────── */}
      <section className="text-center pt-4 pb-2">
        <p className="text-sm font-bold uppercase tracking-widest text-primary mb-6">
          {t('tagline')}
        </p>
        <HeroSearch
          onSelect={handleSelect}
          onClear={handleClear}
          selectedName={selected?.name}
        />
      </section>

      {/* ── Split layout ─────────────────────────────────────────
          Desktop: [Catalog 40%] | [SmartResult 60%]
          Mobile:  Catalog → SmartResult stacked
      ──────────────────────────────────────────────────────── */}
      <div className={`flex gap-6 items-start transition-all duration-500 ${selected ? 'lg:flex-row' : 'flex-col'}`}>

        {/* LEFT — Catalog: compact single-column list when product open */}
        <div className={`transition-all duration-500 min-w-0 ${selected ? 'lg:w-[28%] lg:shrink-0' : 'w-full'}`}>
          {/* Season strip — only when nothing selected */}
          {!selected && (
            <div className="mb-8">
              <SeasonNow onSelect={handleSelect} />
            </div>
          )}
          <IngredientGrid onSelect={handleSelect} activeSlug={selected?.slug} compact={!!selected} />
        </div>

        {/* RIGHT — Smart Panel: the main workspace */}
        {selected && (
          <div
            ref={smartPanelRef}
            className="flex-1 min-w-0 animate-in fade-in slide-in-from-right-4 duration-400 lg:sticky lg:top-4"
          >
            <SmartResult
              slug={selected.slug}
              name={selected.name}
              primaryImage={selected.image}
              dishExtras={dishExtras}
              onAddExtra={handleAddExtra}
              onRemoveExtra={handleRemoveExtra}
              onSelectIngredient={handleSelect}
              onClose={handleClear}
            />
          </div>
        )}
      </div>
    </div>
  );
}
