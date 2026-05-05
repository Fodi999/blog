'use client';

import { useState } from 'react';
import { CITY_BUILD_ITEMS, CITY_BUILD_CATEGORIES, type CityBuildCategory } from '../data/city-build-items';
import { useKitchen } from '../../engine/StoreProvider';

export function CityBuildPanel() {
  const selectedBuildItemId = useKitchen((s) => s.cityUi.selectedBuildItemId);
  const selectCityBuildItem = useKitchen((s) => s.selectCityBuildItem);
  const setCityTool         = useKitchen((s) => s.setCityTool);
  const cash                = useKitchen((s) => s.finance.cash);
  const playerLevel         = useKitchen((s) => s.game.stage);

  const [activeCategory, setActiveCategory] = useState<CityBuildCategory>('Food');

  const filtered = CITY_BUILD_ITEMS.filter((i) => i.category === activeCategory);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/8 bg-[#07090d]/95">
      {/* Header */}
      <div className="border-b border-white/8 px-4 py-3">
        <p className="text-[10px] font-bold tracking-[0.25em] text-yellow-400/80 uppercase">
          Build Menu
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex border-b border-white/8">
        {CITY_BUILD_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={[
              'flex-1 py-2 text-[10px] font-semibold transition-colors',
              activeCategory === cat
                ? 'border-b-2 border-yellow-400 text-yellow-400'
                : 'text-white/30 hover:text-white/60',
            ].join(' ')}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filtered.map((item) => {
          const active     = selectedBuildItemId === item.id;
          const locked     = playerLevel < item.requiredLevel;
          const cantAfford = cash < item.price;

          return (
            <button
              key={item.id}
              disabled={locked}
              onClick={() => {
                if (locked) return;
                selectCityBuildItem(item.id);
                setCityTool('build');
              }}
              className={[
                'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all',
                locked
                  ? 'cursor-not-allowed border-white/5 bg-white/[0.01]'
                  : active
                    ? 'border-yellow-400/60 bg-yellow-400/8'
                    : 'border-white/8 bg-white/[0.02] hover:border-yellow-400/30 hover:bg-white/5',
              ].join(' ')}
            >
              {/* Icon */}
              <div className={['flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-black/50 text-base', locked ? 'opacity-30' : ''].join(' ')}>
                {item.icon}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className={['text-[11px] font-semibold leading-tight', locked ? 'text-white/25' : 'text-white/90'].join(' ')}>
                  {item.name}
                </p>
                {locked ? (
                  <p className="text-[9px] text-orange-400/60 font-medium">
                    🔒 Requires Level {item.requiredLevel}
                  </p>
                ) : (
                  <p className="text-[9px] text-white/30">
                    {item.size[0]}×{item.size[1]} · Lvl {item.requiredLevel}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className={['text-[10px] font-bold', locked ? 'text-white/15' : cantAfford ? 'text-red-400' : 'text-emerald-400'].join(' ')}>
                {locked ? `L${item.requiredLevel}` : `${item.price}zł`}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected item preview */}
      {selectedBuildItemId && (() => {
        const item = CITY_BUILD_ITEMS.find((i) => i.id === selectedBuildItemId);
        if (!item) return null;
        return (
          <div className="border-t border-white/8 p-3 text-[10px]">
            <p className="font-semibold text-white/70">{item.icon} {item.name}</p>
            <p className="mt-0.5 text-white/35 leading-tight">{item.description}</p>
            <div className="mt-2 flex justify-between text-white/40">
              <span>+{item.revenuePerDay}zł/day</span>
              <span>-{item.maintenancePerDay}zł/day</span>
            </div>
          </div>
        );
      })()}
    </aside>
  );
}
