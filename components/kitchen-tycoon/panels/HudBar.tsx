/**
 * kitchen-tycoon/panels/HudBar.tsx
 * Top status bar: cash, day, hour, rating, pause/speed.
 */
'use client';

import { Pause, Play, FastForward } from 'lucide-react';
import { useKitchen } from '../engine/StoreProvider';

function format(v: number): string {
  return v.toLocaleString('pl-PL', { maximumFractionDigits: 0 });
}

export function HudBar() {
  const cash         = useKitchen((s) => s.finance.cash);
  const rating       = useKitchen((s) => s.finance.rating);
  const day          = useKitchen((s) => s.game.day);
  const hour         = useKitchen((s) => s.game.hour);
  const paused       = useKitchen((s) => s.game.paused);
  const speed        = useKitchen((s) => s.game.speed);
  const orderCount   = useKitchen((s) => s.orders.filter((o) => o.status === 'pending').length);
  const togglePause  = useKitchen((s) => s.togglePause);
  const setSpeed     = useKitchen((s) => s.setSpeed);

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/70 px-5 py-3 text-sm text-zinc-200 backdrop-blur">
      <div className="flex items-center gap-6 font-mono">
        <span className={cash < 0 ? 'text-red-400' : 'text-emerald-300'}>
          {format(cash)} zł
        </span>
        <span className="text-zinc-400">
          Day <span className="text-white">{day}</span>
        </span>
        <span className="text-zinc-400">
          {String(hour).padStart(2, '0')}:00
        </span>
        <span className="text-zinc-400">
          Orders <span className="text-yellow-300">{orderCount}</span>
        </span>
        <span className="text-zinc-400">
          ★ <span className="text-white">{rating.toFixed(1)}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={togglePause}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/15"
          title={paused ? 'Resume' : 'Pause'}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
        </button>
        {[1, 2, 4].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s as 1 | 2 | 4)}
            className={[
              'flex h-8 w-10 items-center justify-center rounded-lg text-xs font-mono',
              speed === s ? 'bg-yellow-400 text-black' : 'bg-white/10 hover:bg-white/15',
            ].join(' ')}
          >
            {s === 1 ? '1×' : s === 2 ? '2×' : <FastForward size={12} />}
          </button>
        ))}
      </div>
    </div>
  );
}
