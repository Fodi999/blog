/**
 * kitchen-tycoon/panels/BuildPanel.tsx
 * Catalog of buyable equipment + tool selector.
 */
'use client';

import { MousePointer2, Hammer, Trash2, RotateCw } from 'lucide-react';
import { useKitchen } from '../engine/StoreProvider';
import { ASSET_CATALOG } from '../core/catalog';
import type { KitchenAssetType, ToolMode } from '../core/types';

const TOOLS: Array<{ id: ToolMode; label: string; Icon: typeof MousePointer2 }> = [
  { id: 'select', label: 'Select', Icon: MousePointer2 },
  { id: 'build',  label: 'Build',  Icon: Hammer },
  { id: 'rotate', label: 'Rotate', Icon: RotateCw },
  { id: 'delete', label: 'Delete', Icon: Trash2 },
];

const STAGE_1_ASSETS: KitchenAssetType[] = [
  'prep_table', 'stove', 'oven', 'fridge', 'freezer', 'sink',
  'shelf', 'packing_station', 'delivery_counter',
];

export function BuildPanel() {
  const tool         = useKitchen((s) => s.tool);
  const buildType    = useKitchen((s) => s.buildType);
  const cash         = useKitchen((s) => s.finance.cash);
  const setTool      = useKitchen((s) => s.setTool);
  const setBuildType = useKitchen((s) => s.setBuildType);

  return (
    <div className="flex h-full w-72 shrink-0 flex-col gap-4 rounded-2xl border border-white/10 bg-black/70 p-4 text-sm text-zinc-200 backdrop-blur">
      {/* Tools */}
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Tools
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {TOOLS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              title={label}
              className={[
                'flex h-10 items-center justify-center rounded-lg transition-colors',
                tool === id
                  ? 'bg-yellow-400 text-black'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10',
              ].join(' ')}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Catalog */}
      <div className="flex-1 overflow-y-auto">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Equipment
        </div>
        <div className="flex flex-col gap-1.5">
          {STAGE_1_ASSETS.map((type) => {
            const spec = ASSET_CATALOG[type];
            const affordable = cash >= spec.price;
            const active = buildType === type;
            return (
              <button
                key={type}
                disabled={!affordable}
                onClick={() => setBuildType(active ? null : type)}
                className={[
                  'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
                  active
                    ? 'border-yellow-400/60 bg-yellow-400/10 text-white'
                    : affordable
                    ? 'border-white/10 bg-white/5 text-zinc-200 hover:border-white/20 hover:bg-white/10'
                    : 'border-white/5 bg-white/5 text-zinc-500',
                ].join(' ')}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{spec.glyph}</span>
                  <span className="text-xs">{spec.name}</span>
                </span>
                <span
                  className={[
                    'font-mono text-xs',
                    affordable ? 'text-emerald-300' : 'text-red-400',
                  ].join(' ')}
                >
                  {spec.price} zł
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
