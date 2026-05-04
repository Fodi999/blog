/**
 * kitchen-tycoon/panels/MissionPanel.tsx
 * Stage objective + progress toward next stage.
 */
'use client';

import { Target } from 'lucide-react';
import { useKitchen } from '../engine/StoreProvider';

const STAGE_GOAL: Record<number, { target: number; nextLabel: string; description: string }> = {
  1: { target: 3000, nextLabel: 'Dark Kitchen',  description: 'Earn 3000 zł in 7 days' },
  2: { target: 12000, nextLabel: 'Restaurant',   description: 'Earn 12 000 zł, rating ≥ 4.0' },
  3: { target: 50000, nextLabel: 'Production',   description: 'Earn 50 000 zł, waste ≤ 10%' },
  4: { target: 200000, nextLabel: 'Food Factory', description: 'Earn 200 000 zł, B2B contracts' },
  5: { target: 1000000, nextLabel: '—',          description: 'Build a profitable food factory' },
};

export function MissionPanel() {
  const stage  = useKitchen((s) => s.game.stage);
  const day    = useKitchen((s) => s.game.day);
  const cash   = useKitchen((s) => s.finance.cash);
  const goal   = STAGE_GOAL[stage];
  const pct    = Math.max(0, Math.min(100, (cash / goal.target) * 100));

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 to-zinc-900/80 p-3 shadow-inner">
      <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-amber-300/80">
        <Target size={12} />
        Mission · Stage {stage}
      </div>
      <div className="text-xs text-white">{goal.description}</div>

      <div className="mt-2.5">
        <div className="relative h-2 overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-zinc-400">
          <span>{Math.round(cash)} / {goal.target} zł</span>
          <span>day {day}</span>
        </div>
      </div>

      {goal.nextLabel !== '—' && (
        <div className="mt-2 text-[10px] text-zinc-500">
          Next: <span className="text-amber-300">{goal.nextLabel}</span>
        </div>
      )}
    </div>
  );
}
