/**
 * kitchen-tycoon/panels/FinancePanel.tsx
 * Stock + day-level finance summary.
 */
'use client';

import { useKitchen } from '../engine/StoreProvider';
import { INGREDIENTS } from '../core/catalog';

export function FinancePanel() {
  const stock         = useKitchen((s) => s.stock);
  const revenueToday  = useKitchen((s) => s.finance.revenueToday);
  const costToday     = useKitchen((s) => s.finance.costToday);
  const foodCostRatio = useKitchen((s) => s.finance.foodCostRatio);
  const wastePct      = useKitchen((s) => s.finance.wastePct);

  const profitToday = revenueToday - costToday;

  return (
    <div className="flex w-72 flex-col gap-3 rounded-2xl border border-white/10 bg-black/70 p-4 text-sm text-zinc-200 backdrop-blur">
      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Today
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs">
          <dt className="text-zinc-400">Revenue</dt>
          <dd className="text-right text-emerald-300">{revenueToday.toFixed(0)} zł</dd>
          <dt className="text-zinc-400">Cost</dt>
          <dd className="text-right text-red-300">{costToday.toFixed(0)} zł</dd>
          <dt className="text-zinc-400">Profit</dt>
          <dd className={`text-right ${profitToday >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {profitToday.toFixed(0)} zł
          </dd>
          <dt className="text-zinc-400">Food cost</dt>
          <dd className="text-right text-zinc-200">{(foodCostRatio * 100).toFixed(0)}%</dd>
          <dt className="text-zinc-400">Waste</dt>
          <dd className="text-right text-zinc-200">{(wastePct * 100).toFixed(0)}%</dd>
        </dl>
      </div>

      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Stock
        </div>
        <div className="flex flex-col gap-0.5 text-[11px]">
          {Object.entries(stock).map(([id, qty]) => {
            const ing = INGREDIENTS[id];
            if (!ing) return null;
            const low = qty < 100;
            return (
              <div
                key={id}
                className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1"
              >
                <span className="text-zinc-400">{ing.name}</span>
                <span className={`font-mono ${low ? 'text-red-400' : 'text-zinc-200'}`}>
                  {Math.round(qty)} {ing.unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
