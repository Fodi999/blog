'use client';

/**
 * ProductProcessScene — визуальная сцена "Процесс в действии".
 *
 * Принимает step_effects из backend analysis.process_effects.step_effects
 * и превращает visual_token в анимированные карточки эффектов.
 *
 * Интерактивность:
 *  - Клик по шагу → показывает только его эффекты
 *  - Кнопки Play / Назад / Вперёд — автоплей с 2-сек интервалом
 *  - Каждый эффект: emoji + цветной фон + сообщение
 */

import { useEffect, useRef, useState } from 'react';
import { PlayCircle, PauseCircle, ChevronLeft, ChevronRight, Thermometer, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LabStepEffect, LabEffect } from '@/lib/laboratory-api';

// ── Animation map ────────────────────────────────────────────────────────────

type AnimEntry = {
  label: string;
  emoji: string;
  bg: string;         // Tailwind bg class for the stage
  particle: string;   // Extra particle emoji / symbol
  cssClass: string;
};

const ANIM: Record<string, AnimEntry> = {
  soften: {
    label: 'Размягчение',
    emoji: '🍑',
    bg: 'from-orange-50 to-amber-50',
    particle: '✨',
    cssClass: 'animate-pulse',
  },
  juice_release: {
    label: 'Выделение сока',
    emoji: '💧',
    bg: 'from-blue-50 to-cyan-50',
    particle: '💧',
    cssClass: 'animate-bounce',
  },
  browning: {
    label: 'Карамелизация',
    emoji: '🔥',
    bg: 'from-amber-50 to-orange-100',
    particle: '🔶',
    cssClass: 'animate-pulse',
  },
  smooth_mix: {
    label: 'Однородная масса',
    emoji: '🌀',
    bg: 'from-violet-50 to-purple-50',
    particle: '〰️',
    cssClass: 'animate-spin',
  },
  viscosity_up: {
    label: 'Загущение',
    emoji: '🥣',
    bg: 'from-yellow-50 to-amber-50',
    particle: '▲',
    cssClass: 'animate-bounce',
  },
  split: {
    label: 'Расслоение',
    emoji: '⚠️',
    bg: 'from-red-50 to-orange-50',
    particle: '↕️',
    cssClass: 'animate-ping',
  },
  bubbles: {
    label: 'Ферментация',
    emoji: '🫧',
    bg: 'from-green-50 to-emerald-50',
    particle: '○',
    cssClass: 'animate-bounce',
  },
  safety_shield: {
    label: 'Безопасность',
    emoji: '🛡️',
    bg: 'from-sky-50 to-blue-50',
    particle: '✓',
    cssClass: 'animate-pulse',
  },
  protein_change: {
    label: 'Изменение белка',
    emoji: '🧬',
    bg: 'from-pink-50 to-rose-50',
    particle: '⟳',
    cssClass: 'animate-pulse',
  },
  nutrition_loss: {
    label: 'Потеря витаминов',
    emoji: '📉',
    bg: 'from-gray-50 to-slate-50',
    particle: '↓',
    cssClass: 'animate-pulse',
  },
  smoke: {
    label: 'Перегрев',
    emoji: '💨',
    bg: 'from-gray-100 to-zinc-100',
    particle: '~',
    cssClass: 'animate-bounce',
  },
  stabilize: {
    label: 'Стабилизация',
    emoji: '❄️',
    bg: 'from-slate-50 to-sky-50',
    particle: '●',
    cssClass: 'animate-pulse',
  },
  ice_crystals: {
    label: 'Замораживание',
    emoji: '🧊',
    bg: 'from-sky-50 to-blue-100',
    particle: '❅',
    cssClass: 'animate-spin',
  },
  shrink: {
    label: 'Потеря влаги',
    emoji: '🌬️',
    bg: 'from-stone-50 to-amber-50',
    particle: '↘',
    cssClass: 'animate-pulse',
  },
  generic_change: {
    label: 'Изменение',
    emoji: '⚗️',
    bg: 'from-slate-50 to-gray-50',
    particle: '→',
    cssClass: 'animate-pulse',
  },
};

function getAnim(visual_token: string): AnimEntry {
  return ANIM[visual_token] ?? ANIM['generic_change'];
}

// ── Intensity bar ─────────────────────────────────────────────────────────────

function IntensityBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80
      ? 'bg-red-500'
      : pct >= 50
      ? 'bg-amber-500'
      : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-[11px] text-muted-foreground">{pct}%</span>
    </div>
  );
}

// ── Particles overlay ─────────────────────────────────────────────────────────

function Particles({ visual_token }: { visual_token: string }) {
  const anim = getAnim(visual_token);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[20, 40, 60, 80].map((left, i) => (
        <span
          key={i}
          className={cn(
            'absolute bottom-6 text-xl opacity-70',
            anim.cssClass,
          )}
          style={{
            left: `${left}%`,
            animationDelay: `${i * 0.18}s`,
            animationDuration: '1.4s',
          }}
        >
          {anim.particle}
        </span>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export type ProcessSceneProps = {
  stepEffects: LabStepEffect[];
};

export function ProductProcessScene({ stepEffects }: ProcessSceneProps) {
  // Flatten all effects with their step context.
  type FlatEffect = LabEffect & { stepTechnique: string; stepTemp: number | null; stepDuration: number | null; stepOrder: number };

  const flatEffects: FlatEffect[] = stepEffects.flatMap((s) =>
    s.effects.map((e) => ({
      ...e,
      stepTechnique: s.technique,
      stepTemp: s.temperature_c,
      stepDuration: s.duration_min,
      stepOrder: s.order_index,
    })),
  );

  const [activeStep, setActiveStep] = useState<number | null>(null); // null = all
  const [effectIdx, setEffectIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visibleEffects =
    activeStep === null
      ? flatEffects
      : flatEffects.filter((e) => e.stepOrder === activeStep);

  const safeIdx = Math.min(effectIdx, Math.max(0, visibleEffects.length - 1));
  const active = visibleEffects[safeIdx] ?? null;

  // Reset idx when filter changes.
  useEffect(() => {
    setEffectIdx(0);
    setPlaying(false);
  }, [activeStep]);

  // Autoplay.
  useEffect(() => {
    if (!playing || visibleEffects.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setEffectIdx((i) => (i + 1) % visibleEffects.length);
    }, 2200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, visibleEffects.length]);

  if (flatEffects.length === 0) return null;

  const anim = active ? getAnim(active.visual_token) : ANIM['generic_change'];

  return (
    <div className="overflow-hidden rounded-2xl border shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-5 py-3">
        <div>
          <h3 className="font-semibold">Процесс в действии</h3>
          <p className="text-xs text-muted-foreground">
            {visibleEffects.length} эффект{visibleEffects.length === 1 ? '' : 'а'}
            {activeStep !== null ? ` · шаг ${activeStep + 1}` : ''}
          </p>
        </div>

        {/* Step filter tabs */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveStep(null)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              activeStep === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            Все
          </button>
          {stepEffects.map((s) => (
            <button
              key={s.step_id}
              type="button"
              onClick={() => setActiveStep(s.order_index)}
              className={cn(
                'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                activeStep === s.order_index
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {s.technique}
              {s.temperature_c != null && (
                <span className="opacity-70">{s.temperature_c}°</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stage */}
      <div
        className={cn(
          'relative flex min-h-[200px] items-center justify-center bg-gradient-to-br transition-colors duration-700',
          active ? anim.bg : 'from-muted/40 to-muted/20',
        )}
      >
        {/* Big central emoji */}
        <div
          key={safeIdx} // re-mount on change → triggers CSS transition
          className="relative z-10 select-none text-8xl transition-all duration-500"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.12))' }}
        >
          {active ? anim.emoji : '⚗️'}
        </div>

        {/* Particles */}
        {active && <Particles visual_token={active.visual_token} />}

        {/* Step context badge */}
        {active && (
          <div className="absolute right-3 top-3 flex gap-1.5">
            {active.stepTemp != null && (
              <Badge variant="secondary" className="gap-1 text-[11px]">
                <Thermometer className="h-3 w-3" />
                {active.stepTemp}°C
              </Badge>
            )}
            {active.stepDuration != null && (
              <Badge variant="secondary" className="gap-1 text-[11px]">
                <Clock className="h-3 w-3" />
                {active.stepDuration} мин
              </Badge>
            )}
          </div>
        )}

        {/* Effect counter */}
        {visibleEffects.length > 1 && (
          <div className="absolute bottom-3 right-3 text-[11px] text-muted-foreground">
            {safeIdx + 1} / {visibleEffects.length}
          </div>
        )}
      </div>

      {/* Active effect card */}
      {active && (
        <div className="border-t bg-background px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{active.label || anim.label}</span>
                {active.ingredient_name && (
                  <Badge variant="outline" className="text-[11px]">
                    {active.ingredient_name}
                  </Badge>
                )}
              </div>
              <IntensityBar value={active.intensity} />
              <p className="pt-1 text-sm text-muted-foreground">{active.message}</p>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1 pt-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={visibleEffects.length <= 1}
                onClick={() =>
                  setEffectIdx((i) => (i - 1 + visibleEffects.length) % visibleEffects.length)
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant={playing ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                disabled={visibleEffects.length <= 1}
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? (
                  <PauseCircle className="h-4 w-4" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={visibleEffects.length <= 1}
                onClick={() =>
                  setEffectIdx((i) => (i + 1) % visibleEffects.length)
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Effects strip — quick overview */}
      {visibleEffects.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-t bg-muted/30 px-4 py-3">
          {visibleEffects.map((e, i) => {
            const a = getAnim(e.visual_token);
            return (
              <button
                key={i}
                type="button"
                onClick={() => { setEffectIdx(i); setPlaying(false); }}
                className={cn(
                  'flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs transition-colors',
                  i === safeIdx
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                    : 'bg-background text-muted-foreground hover:bg-muted',
                )}
              >
                <span className="text-xl">{a.emoji}</span>
                <span className="max-w-[64px] truncate">{e.label || a.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
