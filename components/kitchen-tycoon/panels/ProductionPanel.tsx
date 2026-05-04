/**
 * kitchen-tycoon/panels/ProductionPanel.tsx
 * Aggregated view of placed equipment by type — capacity and station count.
 */
'use client';

import { Factory } from 'lucide-react';
import { useKitchen } from '../engine/StoreProvider';
import { ASSET_CATALOG } from '../core/catalog';
import type { KitchenAssetType } from '../core/types';

export function ProductionPanel() {
  const assets = useKitchen((s) => s.assets);

  const byType = assets.reduce<Record<KitchenAssetType, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {} as Record<KitchenAssetType, number>);

  const lines = Object.entries(byType)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
        <Factory size={12} />
        Production
      </div>
      {lines.length === 0 ? (
        <div className="text-[11px] text-zinc-500">
          Place equipment to start production.
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {lines.map(([type, n]) => {
            const spec = ASSET_CATALOG[type as KitchenAssetType];
            const cap = spec.capacityPerHour * n;
            return (
              <div
                key={type}
                className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1 text-[11px]"
              >
                <span className="flex items-center gap-2">
                  <span>{spec.glyph}</span>
                  <span className="text-zinc-300">{spec.name}</span>
                  <span className="text-zinc-500">×{n}</span>
                </span>
                <span className="font-mono text-zinc-400">
                  {cap > 0 ? `${cap}/h` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
