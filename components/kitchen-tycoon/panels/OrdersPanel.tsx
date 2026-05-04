/**
 * kitchen-tycoon/panels/OrdersPanel.tsx
 * Pending orders + accept button + recipe stats.
 */
'use client';

import { useKitchen } from '../engine/StoreProvider';
import { RECIPES, recipeMargin } from '../core/catalog';

export function OrdersPanel() {
  const orders      = useKitchen((s) => s.orders);
  const acceptOrder = useKitchen((s) => s.acceptOrder);

  const pending = orders.filter((o) => o.status === 'pending').slice(0, 8);
  const recent  = orders.filter((o) => o.status !== 'pending').slice(-3).reverse();

  return (
    <div className="flex h-full w-72 shrink-0 flex-col gap-4 rounded-2xl border border-white/10 bg-black/70 p-4 text-sm text-zinc-200 backdrop-blur">
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Incoming Orders
        </div>
        {pending.length === 0 ? (
          <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-4 text-center text-xs text-zinc-500">
            Waiting for customers…
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {pending.map((o) => {
              const recipe = RECIPES.find((r) => r.id === o.recipeId);
              if (!recipe) return null;
              const m = recipeMargin(recipe);
              return (
                <div
                  key={o.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white">
                      {recipe.name} ×{o.qty}
                    </span>
                    <span className="font-mono text-xs text-emerald-300">
                      {o.payout} zł
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>margin {m.marginPct.toFixed(0)}%</span>
                    <span>due day {o.dueDay}</span>
                  </div>
                  <button
                    onClick={() => acceptOrder(o.id)}
                    className="mt-2 w-full rounded-md bg-emerald-500/90 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-400"
                  >
                    Cook & Sell
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {recent.length > 0 && (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Recent
          </div>
          <div className="flex flex-col gap-1">
            {recent.map((o) => {
              const recipe = RECIPES.find((r) => r.id === o.recipeId);
              return (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1 text-[11px]"
                >
                  <span className="text-zinc-400">{recipe?.name} ×{o.qty}</span>
                  <span
                    className={
                      o.status === 'done' ? 'text-emerald-400' : 'text-red-400'
                    }
                  >
                    {o.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
