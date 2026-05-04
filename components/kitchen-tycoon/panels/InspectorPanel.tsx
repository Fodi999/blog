/**
 * kitchen-tycoon/panels/InspectorPanel.tsx
 * Bottom-right inspector for the selected asset.
 */
'use client';

import { ArrowUpRight, RotateCw, Trash2 } from 'lucide-react';
import { useKitchen } from '../engine/StoreProvider';
import { ASSET_CATALOG } from '../core/catalog';

export function InspectorPanel() {
  const id          = useKitchen((s) => s.selectedAssetId);
  const asset       = useKitchen((s) => s.assets.find((a) => a.id === id) ?? null);
  const cash        = useKitchen((s) => s.finance.cash);
  const rotate      = useKitchen((s) => s.rotateAsset);
  const upgrade     = useKitchen((s) => s.upgradeAsset);
  const remove      = useKitchen((s) => s.removeAsset);

  if (!asset) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/70 p-4 text-xs text-zinc-500 backdrop-blur">
        Select an asset to inspect.
      </div>
    );
  }

  const spec = ASSET_CATALOG[asset.type];
  const upCost = Math.round(spec.price * (asset.level === 1 ? 0.6 : 1.0));
  const canUp = asset.level < 3 && cash >= upCost;

  return (
    <div className="flex w-72 flex-col gap-2 rounded-2xl border border-white/10 bg-black/70 p-4 text-sm text-zinc-200 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="text-lg">{spec.glyph}</span>
          <span className="font-medium">{spec.name}</span>
        </span>
        <span className="text-xs text-yellow-300">★{asset.level}</span>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-zinc-400">
        <dt>Capacity</dt>
        <dd className="text-right text-zinc-200">{spec.capacityPerHour}/h</dd>
        <dt>Power</dt>
        <dd className="text-right text-zinc-200">{spec.powerKw} kW</dd>
        <dt>Maint.</dt>
        <dd className="text-right text-zinc-200">{spec.maintenancePerDay} zł/day</dd>
        <dt>Speed</dt>
        <dd className="text-right text-zinc-200">×{spec.speedMultiplier}</dd>
        <dt>Quality</dt>
        <dd className="text-right text-zinc-200">+{(spec.qualityBonus * 100).toFixed(0)}%</dd>
      </dl>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <button
          onClick={() => rotate(asset.id)}
          className="flex h-8 items-center justify-center rounded-lg bg-white/10 text-xs hover:bg-white/15"
          title="Rotate"
        >
          <RotateCw size={14} />
        </button>
        <button
          onClick={() => upgrade(asset.id)}
          disabled={!canUp}
          className={[
            'flex h-8 items-center justify-center gap-1 rounded-lg text-xs font-medium',
            canUp
              ? 'bg-yellow-400 text-black hover:bg-yellow-300'
              : 'bg-white/5 text-zinc-500',
          ].join(' ')}
          title={`Upgrade for ${upCost} zł`}
        >
          <ArrowUpRight size={14} /> {upCost}
        </button>
        <button
          onClick={() => remove(asset.id)}
          className="flex h-8 items-center justify-center rounded-lg bg-red-500/80 text-xs text-white hover:bg-red-500"
          title="Sell back (50%)"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
