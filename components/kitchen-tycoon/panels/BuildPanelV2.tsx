/**
 * kitchen-tycoon/panels/BuildPanelV2.tsx
 * Game-style build menu — categorised equipment cards.
 */
'use client';

import { Hammer } from 'lucide-react';
import { useKitchen } from '../engine/StoreProvider';
import { ASSET_CATALOG } from '../core/catalog';
import type { KitchenAssetType } from '../core/types';

const CATEGORIES: Array<{ title: string; items: KitchenAssetType[] }> = [
  {
    title: 'Kitchen',
    items: ['prep_table', 'stove', 'oven', 'sink', 'fridge', 'freezer', 'shelf'],
  },
  {
    title: 'Service',
    items: ['packing_station', 'delivery_counter'],
  },
  {
    title: 'Production',
    items: ['sauce_machine', 'vacuum_machine', 'blast_chiller'],
  },
];

export function BuildPanelV2() {
  const buildType    = useKitchen((s) => s.buildType);
  const cash         = useKitchen((s) => s.finance.cash);
  const setBuildType = useKitchen((s) => s.setBuildType);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col gap-3 overflow-y-auto border-r border-white/10 bg-black/70 p-3 backdrop-blur">
      <div className="flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
        <Hammer size={12} />
        Build
      </div>

      {CATEGORIES.map((cat) => (
        <div key={cat.title}>
          <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            {cat.title}
          </div>
          <div className="flex flex-col gap-1">
            {cat.items.map((type) => {
              const spec = ASSET_CATALOG[type];
              const affordable = cash >= spec.price;
              const active = buildType === type;
              return (
                <button
                  key={type}
                  disabled={!affordable}
                  onClick={() => setBuildType(active ? null : type)}
                  className={[
                    'flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors',
                    active
                      ? 'border-yellow-400/60 bg-yellow-400/10 text-white'
                      : affordable
                      ? 'border-white/10 bg-white/5 text-zinc-200 hover:border-white/30 hover:bg-white/10'
                      : 'cursor-not-allowed border-white/5 bg-white/[0.02] text-zinc-500',
                  ].join(' ')}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl"
                    style={{
                      background: `linear-gradient(135deg, ${spec.color}66, ${spec.color}22)`,
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)',
                    }}
                  >
                    {spec.glyph}
                  </span>
                  <div className="flex flex-1 flex-col leading-tight">
                    <span className="text-[12px] font-medium">{spec.name}</span>
                    <span className="text-[10px] text-zinc-500">
                      {spec.capacityPerHour > 0 ? `${spec.capacityPerHour}/h` : 'storage'}
                      {spec.qualityBonus > 0 && ` · +${(spec.qualityBonus * 100).toFixed(0)}% qual`}
                    </span>
                  </div>
                  <span
                    className={[
                      'shrink-0 font-mono text-xs font-semibold',
                      affordable ? 'text-emerald-300' : 'text-red-400',
                    ].join(' ')}
                  >
                    {spec.price}
                    <span className="text-zinc-500"> zł</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
