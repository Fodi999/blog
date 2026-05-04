'use client';

/**
 * SimulationWorkspace — Blender-style timeline + integrated Lab (Photo → 3D).
 *
 * Tabs:
 *   Forecast — same 3D scene driven by virtual clock (DAY 0..+14)
 *   Lab      — Photo → 3D model generator (embedded LaboratoryClient)
 */

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, ChevronFirst, ChevronLast,
  FlaskConical, TrendingUp,
} from 'lucide-react';

import type { InventoryItem } from '@/lib/chefos-types';
import { buildInventoryScene } from '@/components/visual/builders/inventorySceneBuilder';
import type { SceneState } from '@/components/visual/sceneTypes';

const VisualSceneRenderer = dynamic(
  () => import('@/components/visual/VisualSceneRenderer').then((m) => m.VisualSceneRenderer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#070707] text-sm text-white/40">
        loading simulation engine…
      </div>
    ),
  },
);

const ModelViewer = dynamic(
  () => import('@/app/[locale]/app/laboratory/_components/ModelViewer').then((m) => m.ModelViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#070707] text-sm text-white/40">
        loading 3D viewer…
      </div>
    ),
  },
);

// GLB URLs — localhost in dev, Koyeb in production
const KOYEB_GLB_URL = 'https://ministerial-yetta-fodi999-c58d8823.koyeb.app/api/laboratory/debug-glb';
const BASE_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api/laboratory/debug-glb'
    : KOYEB_GLB_URL;

type SurfaceType = 'sci_fi_card' | 'organic_sphere';

const SURFACE_TYPES: { key: SurfaceType; label: string; sub: string; icon: string }[] = [
  { key: 'sci_fi_card',     label: 'Hard Surface', sub: 'Plasticity · sci_fi_card', icon: '⬛' },
  { key: 'organic_sphere',  label: 'Organic',      sub: 'ZBrush · organic_sphere',  icon: '⚫' },
];

// ── Simulation logic ─────────────────────────────────────────────────────────

const SIM_DAYS = 14;

/** Apply virtual +days to items: accelerate severity degradation. */
function applySimDay(items: InventoryItem[], day: number): InventoryItem[] {
  if (day === 0) return items;
  const now = Date.now();
  return items.map((item) => {
    // Items without expires_at don't change
    if (!item.expires_at) return item;
    const msPerDay = 86_400_000;
    const realDaysLeft = (new Date(item.expires_at).getTime() - now) / msPerDay;
    const futureExpiry = realDaysLeft - day;
    let severity: InventoryItem['severity'];
    if (futureExpiry < 0) severity = 'expired';
    else if (futureExpiry <= 2) severity = 'critical';
    else if (futureExpiry <= 5) severity = 'warning';
    else severity = 'ok';

    // Consumption simulation: -2% per day
    const consumptionFactor = Math.max(0, 1 - day * 0.02);
    return {
      ...item,
      severity,
      remaining_quantity: Math.max(0, +(item.remaining_quantity * consumptionFactor).toFixed(2)),
    };
  });
}

// ── Playback hook ─────────────────────────────────────────────────────────────

const SPEEDS = [0.5, 1, 2, 4] as const;
type Speed = typeof SPEEDS[number];

function useSimClock(totalDays: number) {
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const accRef = useRef<number>(0); // accumulated ms

  const MS_PER_DAY = 1200; // 1 day = 1.2s at 1×

  const tick = useCallback(
    (ts: number) => {
      const delta = ts - lastRef.current;
      lastRef.current = ts;
      accRef.current += delta * speed;
      if (accRef.current >= MS_PER_DAY) {
        const steps = Math.floor(accRef.current / MS_PER_DAY);
        accRef.current -= steps * MS_PER_DAY;
        setDay((d) => {
          const next = d + steps;
          if (next >= totalDays) {
            setPlaying(false);
            return totalDays;
          }
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [speed, totalDays],
  );

  useEffect(() => {
    if (playing) {
      lastRef.current = performance.now();
      accRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, tick]);

  const play = () => { if (day >= totalDays) setDay(0); setPlaying(true); };
  const pause = () => setPlaying(false);
  const jump = (d: number) => { setDay(Math.max(0, Math.min(totalDays, d))); };

  return { day, playing, speed, setSpeed, play, pause, jump };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  items: InventoryItem[];
}

export function SimulationWorkspace({ items }: Props) {
  const { day, playing, speed, setSpeed, play, pause, jump } = useSimClock(SIM_DAYS);
  const [tab, setTab] = useState<'forecast' | 'lab'>('forecast');
  const [surfaceType, setSurfaceType] = useState<SurfaceType>('sci_fi_card');

  const labGlbUrl = `${BASE_URL}/${surfaceType}`;

  const simItems = useMemo(() => applySimDay(items, day), [items, day]);

  const scene: SceneState = useMemo(
    () => buildInventoryScene(simItems, {}),
    [simItems],
  );

  // Compute delta stats for HUD overlay
  const expiredCount = simItems.filter((i) => i.severity === 'expired').length;
  const criticalCount = simItems.filter((i) => i.severity === 'critical').length;
  const warningCount = simItems.filter((i) => i.severity === 'warning').length;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#070707]">
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/8 px-5 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            ChefOS · Simulation
          </p>
          <h2 className="text-sm font-semibold text-white">
            {tab === 'forecast' ? (
              <>
                Inventory Forecast · Day{' '}
                <span className={day === 0 ? 'text-white/60' : day >= 10 ? 'text-rose-400' : day >= 5 ? 'text-amber-400' : 'text-emerald-400'}>
                  +{day}
                </span>
              </>
            ) : (
              'Lab · Photo → 3D'
            )}
          </h2>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setTab('forecast')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              tab === 'forecast'
                ? 'bg-white/15 text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            Forecast
          </button>
          <button
            type="button"
            onClick={() => setTab('lab')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              tab === 'lab'
                ? 'bg-white/15 text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <FlaskConical className="h-3 w-3" />
            Lab
          </button>
        </div>

        {/* Status badges (forecast only) */}
        {tab === 'forecast' && (
          <div className="flex items-center gap-3 text-xs text-white/60">
            {expiredCount > 0 && (
              <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-rose-400">
                {expiredCount} expired
              </span>
            )}
            {criticalCount > 0 && (
              <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-orange-400">
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                {warningCount} expiring
              </span>
            )}
            {expiredCount === 0 && criticalCount === 0 && warningCount === 0 && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
                all ok
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Tab content ── */}
      {tab === 'lab' ? (
        <div className="relative flex-1 overflow-hidden bg-[#070707]">
          {/* Surface type selector */}
          <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
            {SURFACE_TYPES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSurfaceType(s.key)}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all ${
                  surfaceType === s.key
                    ? 'border-sky-500/50 bg-sky-500/10 text-white'
                    : 'border-white/10 bg-black/40 text-white/50 hover:border-white/25 hover:text-white/80'
                }`}
              >
                <span className="text-lg leading-none">{s.icon}</span>
                <div>
                  <p className="text-xs font-semibold leading-tight">{s.label}</p>
                  <p className="text-[10px] text-white/40">{s.sub}</p>
                </div>
              </button>
            ))}
          </div>

          <ModelViewer
              modelUrl={labGlbUrl}
              className="h-full w-full"
              displayMode="grid"
              lightingPreset="cleanProduct"
              autoRotate={false}
              renderQuality="hd"
            />
        </div>
      ) : (
        <>
          {/* ── 3D Scene ── */}
          <div className="relative flex-1 overflow-hidden">
            <VisualSceneRenderer scene={scene} selectedEntityId={null} onSelectEntity={() => {}} />

            {/* Day badge overlay */}
            {playing && (
              <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2">
                <div className="rounded-full border border-white/15 bg-[#080a0f]/90 px-4 py-1.5 text-xs font-mono font-semibold text-white/70 backdrop-blur-sm">
                  DAY +{day} / +{SIM_DAYS}
                </div>
              </div>
            )}
          </div>

          {/* ── Timeline / Playback bar ── */}
          <div className="shrink-0 border-t border-white/8 bg-[#080a0f] px-5 py-3">
            {/* Scrubber */}
            <div className="mb-3 flex items-center gap-3">
              <span className="w-10 text-right font-mono text-[10px] text-white/40">+{day}d</span>
              <div className="relative flex-1">
                {/* Track */}
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all"
                    style={{ width: `${(day / SIM_DAYS) * 100}%` }}
                  />
                </div>
                {/* Day markers */}
                <div className="absolute top-0 flex w-full justify-between px-0">
                  {Array.from({ length: SIM_DAYS + 1 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => jump(i)}
                      className={`-mt-1 h-3 w-px rounded-full transition-all ${
                        i === day ? 'bg-white scale-y-150' : 'bg-white/20 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                {/* Clickable overlay */}
                <input
                  type="range"
                  min={0}
                  max={SIM_DAYS}
                  value={day}
                  onChange={(e) => jump(Number(e.target.value))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
              <span className="w-10 font-mono text-[10px] text-white/40">+{SIM_DAYS}d</span>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between">
              {/* Transport */}
              <div className="flex items-center gap-1">
                <SimBtn icon={ChevronFirst} label="Jump to start" onClick={() => jump(0)} />
                <SimBtn icon={SkipBack} label="−1 day" onClick={() => jump(day - 1)} />
                <button
                  type="button"
                  onClick={playing ? pause : play}
                  title={playing ? 'Pause' : 'Play'}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <SimBtn icon={SkipForward} label="+1 day" onClick={() => jump(day + 1)} />
                <SimBtn icon={ChevronLast} label="Jump to end" onClick={() => jump(SIM_DAYS)} />
              </div>

              {/* Speed selector */}
              <div className="flex items-center gap-1">
                <span className="mr-1 text-[10px] uppercase tracking-widest text-white/30">Speed</span>
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                      speed === s
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'text-white/35 hover:text-white/60'
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>

              {/* Frame info */}
              <div className="text-right font-mono text-[10px] text-white/25">
                FRAME {day * 24} / {SIM_DAYS * 24}h
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SimBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
