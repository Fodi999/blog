/**
 * kitchen-tycoon/panels/GameHeader.tsx
 * Top "Food Empire" status bar — owns the game brand + headline metrics.
 */
'use client';

import { ChefHat, Coins, CalendarDays, ShoppingBag, TrendingUp, Star, Pause, Play, FastForward } from 'lucide-react';
import { useKitchen } from '../engine/StoreProvider';

function fmt(v: number): string {
  return v.toLocaleString('pl-PL', { maximumFractionDigits: 0 });
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  tone?: 'default' | 'good' | 'bad' | 'warn';
}) {
  const toneCls =
    tone === 'good' ? 'text-emerald-300' :
    tone === 'bad'  ? 'text-red-400'      :
    tone === 'warn' ? 'text-yellow-300'   :
                      'text-white';
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5">
      <Icon size={14} className="text-zinc-400" />
      <div className="flex flex-col leading-none">
        <span className="text-[9px] uppercase tracking-widest text-zinc-500">{label}</span>
        <span className={`font-mono text-sm font-semibold ${toneCls}`}>{value}</span>
      </div>
    </div>
  );
}

export function GameHeader() {
  const cash         = useKitchen((s) => s.finance.cash);
  const rating       = useKitchen((s) => s.finance.rating);
  const revenueToday = useKitchen((s) => s.finance.revenueToday);
  const costToday    = useKitchen((s) => s.finance.costToday);
  const day          = useKitchen((s) => s.game.day);
  const hour         = useKitchen((s) => s.game.hour);
  const paused       = useKitchen((s) => s.game.paused);
  const speed        = useKitchen((s) => s.game.speed);
  const orderCount   = useKitchen((s) => s.orders.filter((o) => o.status === 'pending').length);
  const togglePause  = useKitchen((s) => s.togglePause);
  const setSpeed     = useKitchen((s) => s.setSpeed);

  const profitToday = revenueToday - costToday;

  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-amber-950/40 via-zinc-950 to-zinc-950 px-5 py-2.5">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 text-black shadow-lg">
          <ChefHat size={18} />
        </div>
        <div className="leading-tight">
          <div className="text-[10px] uppercase tracking-[0.25em] text-amber-400/80">
            ChefOS · Tycoon
          </div>
          <div className="font-display text-base font-bold tracking-wide text-white">
            FOOD EMPIRE
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="flex flex-1 items-center justify-center gap-2">
        <Metric icon={Coins}        label="Cash"   value={`${fmt(cash)} zł`}  tone={cash < 0 ? 'bad' : 'good'} />
        <Metric icon={CalendarDays} label="Day"    value={`${day} · ${String(hour).padStart(2, '0')}:00`} />
        <Metric icon={ShoppingBag}  label="Orders" value={`${orderCount}`}    tone={orderCount > 0 ? 'warn' : 'default'} />
        <Metric icon={TrendingUp}   label="Profit" value={`${fmt(profitToday)} zł`} tone={profitToday >= 0 ? 'good' : 'bad'} />
        <Metric icon={Star}         label="Rating" value={rating.toFixed(1)} />
      </div>

      {/* Time controls */}
      <div className="flex items-center gap-1.5">
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
    </header>
  );
}
