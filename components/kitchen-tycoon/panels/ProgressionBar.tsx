/**
 * kitchen-tycoon/panels/ProgressionBar.tsx
 * Bottom strip showing the 5-stage growth path.
 */
'use client';

import { ChevronRight } from 'lucide-react';
import { useKitchen } from '../engine/StoreProvider';

const STAGES = [
  { n: 1, label: 'Small Kitchen' },
  { n: 2, label: 'Dark Kitchen' },
  { n: 3, label: 'Restaurant' },
  { n: 4, label: 'Production' },
  { n: 5, label: 'Food Factory' },
] as const;

export function ProgressionBar() {
  const stage = useKitchen((s) => s.game.stage);

  return (
    <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-black/60 px-3 py-2 backdrop-blur">
      {STAGES.map(({ n, label }, i) => {
        const isCurrent = n === stage;
        const isDone    = n < stage;
        return (
          <div key={n} className="flex items-center gap-1">
            <div
              className={[
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] transition-colors',
                isCurrent
                  ? 'bg-yellow-400 font-semibold text-black'
                  : isDone
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-white/5 text-zinc-500',
              ].join(' ')}
            >
              <span className="font-mono">{n}</span>
              <span>{label}</span>
            </div>
            {i < STAGES.length - 1 && (
              <ChevronRight size={12} className="text-zinc-600" />
            )}
          </div>
        );
      })}
    </div>
  );
}
