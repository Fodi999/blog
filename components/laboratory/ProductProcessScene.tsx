'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SceneEffect = {
  visual_token: string;
  effect_type: string;
  label: string;
  intensity: number; // 0..1
  message?: string | null;
};

export type SceneStep = {
  step_id: string;
  order_index: number;
  technique: string;
  temperature_c?: number | null;
  duration_min?: number | null;
  effects: SceneEffect[];
};

type Props = {
  steps: SceneStep[];
  /** Localised UI labels (all optional — Russian defaults baked in). */
  labels?: {
    title?: string;
    subtitle?: string;
    nextEffect?: string;
    noData?: string;
    noDataHint?: string;
    ofLabel?: string;
  };
};

// ── Token metadata ────────────────────────────────────────────────────────────

const TOKEN_META: Record<string, { label: string; emoji: string; color: string }> = {
  soften:          { label: 'Размягчение',           emoji: '🍑',  color: 'from-orange-400 to-red-400' },
  juice_release:   { label: 'Выделение сока',        emoji: '💧',  color: 'from-orange-300 to-amber-400' },
  browning:        { label: 'Карамелизация',         emoji: '🔥',  color: 'from-amber-600 to-orange-700' },
  smooth_mix:      { label: 'Однородная масса',      emoji: '🌀',  color: 'from-orange-300 to-red-300' },
  viscosity_up:    { label: 'Загущение',             emoji: '🥣',  color: 'from-red-400 to-orange-400' },
  split:           { label: 'Риск расслоения',       emoji: '⚠️',  color: 'from-orange-400 to-yellow-300' },
  bubbles:         { label: 'Ферментация',           emoji: '🫧',  color: 'from-amber-200 to-orange-200' },
  safety_shield:   { label: 'Пастеризация',          emoji: '🛡️',  color: 'from-green-400 to-emerald-500' },
  nutrition_loss:  { label: 'Потеря витаминов',      emoji: '📉',  color: 'from-zinc-400 to-zinc-500' },
  smoke:           { label: 'Точка дымления',        emoji: '💨',  color: 'from-zinc-600 to-zinc-700' },
  protein_change:  { label: 'Денатурация белка',     emoji: '🧬',  color: 'from-purple-400 to-violet-500' },
  maillard:        { label: 'Реакция Майяра',        emoji: '🍯',  color: 'from-amber-700 to-orange-800' },
  ice_crystals:    { label: 'Заморозка',             emoji: '❄️',  color: 'from-blue-200 to-sky-300' },
  stabilize:       { label: 'Стабилизация',          emoji: '✅',  color: 'from-teal-400 to-cyan-400' },
  shrink:          { label: 'Обезвоживание',         emoji: '🌵',  color: 'from-amber-300 to-yellow-400' },
  generic_change:  { label: 'Изменение продукта',   emoji: '🔬',  color: 'from-zinc-300 to-zinc-400' },
};

function metaFor(token: string) {
  return TOKEN_META[token] ?? TOKEN_META.generic_change;
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProductProcessScene({ steps, labels = {} }: Props) {
  const {
    title = 'Процесс в действии',
    subtitle = 'Посмотрите, как продукт меняется шаг за шагом.',
    nextEffect = 'Следующий эффект',
    noData = 'Процесс ещё не запущен',
    noDataHint = 'Добавьте ингредиенты, шаги процесса и нажмите «Добавить и анализировать».',
    ofLabel = 'из',
  } = labels;

  // Flat effect list across all steps (keep step context).
  const allEffects = useMemo(
    () =>
      steps.flatMap((s) =>
        (s.effects ?? []).map((e) => ({
          ...e,
          _stepTechnique: s.technique,
          _stepTemp: s.temperature_c,
        })),
      ),
    [steps],
  );

  const [activeStepIdx, setActiveStepIdx] = useState<number | null>(null);

  // Which effects to show: filtered by step or all.
  const visibleEffects = useMemo(() => {
    if (activeStepIdx === null) return allEffects;
    return (steps[activeStepIdx]?.effects ?? []).map((e) => ({
      ...e,
      _stepTechnique: steps[activeStepIdx].technique,
      _stepTemp: steps[activeStepIdx].temperature_c,
    }));
  }, [activeStepIdx, steps, allEffects]);

  const [effectIdx, setEffectIdx] = useState(0);
  const safeIdx = visibleEffects.length ? effectIdx % visibleEffects.length : 0;
  const active = visibleEffects[safeIdx] ?? null;

  function next() {
    setEffectIdx((i) => (visibleEffects.length ? (i + 1) % visibleEffects.length : 0));
  }
  function prev() {
    setEffectIdx((i) =>
      visibleEffects.length ? (i - 1 + visibleEffects.length) % visibleEffects.length : 0,
    );
  }

  const progress = visibleEffects.length
    ? ((safeIdx + 1) / visibleEffects.length) * 100
    : 0;

  // ── Empty state ────────────────────────────────────────────────────────────

  if (allEffects.length === 0) {
    return (
      <section className="rounded-[28px] border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{noDataHint}</p>
      </section>
    );
  }

  const meta = metaFor(active?.visual_token ?? 'generic_change');

  return (
    <section className="rounded-[28px] border border-red-100 bg-gradient-to-br from-white via-red-50/30 to-white shadow-sm dark:border-zinc-700 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-6">
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={next}
          className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
        >
          <SkipForward size={15} />
          {nextEffect}
        </button>
      </div>

      {/* Step pills */}
      {steps.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2 px-6">
          <button
            type="button"
            onClick={() => { setActiveStepIdx(null); setEffectIdx(0); }}
            className={[
              'rounded-full border px-3 py-1 text-xs font-semibold transition',
              activeStepIdx === null
                ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
            ].join(' ')}
          >
            Все шаги
          </button>
          {steps.map((s, i) => (
            <button
              key={s.step_id}
              type="button"
              onClick={() => { setActiveStepIdx(i); setEffectIdx(0); }}
              className={[
                'rounded-full border px-3 py-1 text-xs font-semibold transition',
                activeStepIdx === i
                  ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
              ].join(' ')}
            >
              {i + 1}. {s.technique}
              {s.temperature_c != null && ` · ${s.temperature_c}°C`}
            </button>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100 mx-6 dark:bg-zinc-700">
        <motion.div
          className="h-full rounded-full bg-red-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Scene + sidebar */}
      <div className="mt-4 grid gap-4 px-6 pb-6 lg:grid-cols-[1.5fr_1fr]">

        {/* Left: visual stage */}
        <div className="relative min-h-[280px] overflow-hidden rounded-[26px] border border-zinc-100 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <SceneBackground />

          {/* Central blob */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <SauceBlob
                key={active?.visual_token}
                token={active?.visual_token ?? 'generic_change'}
                intensity={active ? active.intensity * 100 : 0}
                color={meta.color}
              />
            </AnimatePresence>
          </div>

          {/* Overlay effects */}
          <AnimatePresence>
            {active?.visual_token === 'juice_release' && <JuiceDrops key="juice" />}
            {active?.visual_token === 'bubbles' && <Bubbles key="bubbles" />}
            {active?.visual_token === 'safety_shield' && <SafetyShield key="shield" />}
            {active?.visual_token === 'split' && <SplitWarning key="split" />}
            {active?.visual_token === 'smoke' && <SmokeCloud key="smoke" />}
            {active?.visual_token === 'ice_crystals' && <IceCrystals key="ice" />}
          </AnimatePresence>

          {/* Bottom HUD */}
          <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-zinc-700/80 dark:bg-zinc-900/80">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xl">{meta.emoji}</span>
              <span className="flex-1 text-sm font-bold leading-tight">
                {meta.label !== 'Изменение продукта' ? meta.label : active?.label ?? meta.label}
              </span>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-300">
                {Math.round((active?.intensity ?? 0) * 100)}%
              </span>
            </div>
          </div>

          {/* Prev / next arrows */}
          {visibleEffects.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-1.5 shadow backdrop-blur hover:bg-white dark:bg-zinc-800/70"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-1.5 shadow backdrop-blur hover:bg-white dark:bg-zinc-800/70"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* Counter */}
          <div className="absolute right-4 top-4 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-zinc-500 backdrop-blur dark:bg-zinc-800/80">
            {safeIdx + 1} {ofLabel} {visibleEffects.length}
          </div>
        </div>

        {/* Right: effect list */}
        <div className="flex flex-col gap-2">
          {/* Active detail card */}
          {active && (
            <div className="rounded-[20px] border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <div className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500 dark:border-zinc-600">
                <Play size={11} />
                {active.visual_token}
              </div>
              <h4 className="mt-3 font-bold leading-snug">{active.label}</h4>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {active.message ?? 'Продукт меняет структуру под влиянием технологии.'}
              </p>
            </div>
          )}

          {/* Clickable effect list */}
          <div className="flex flex-col gap-1.5">
            {visibleEffects.map((e, i) => {
              const m = metaFor(e.visual_token);
              return (
                <button
                  key={`${e.visual_token}-${i}`}
                  type="button"
                  onClick={() => setEffectIdx(i)}
                  className={[
                    'flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm transition',
                    i === safeIdx
                      ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200'
                      : 'border-zinc-100 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800',
                  ].join(' ')}
                >
                  <span className="text-lg leading-none">{m.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold">{e.label}</span>
                      <span className="shrink-0 text-xs opacity-60">
                        {Math.round(e.intensity * 100)}%
                      </span>
                    </div>
                    <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
                      <div
                        className="h-full rounded-full bg-red-400 transition-all"
                        style={{ width: `${e.intensity * 100}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Stage decorations ─────────────────────────────────────────────────────────

function SceneBackground() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Pan rim */}
      <div className="absolute left-1/2 top-8 h-10 w-44 -translate-x-1/2 rounded-full bg-zinc-100 dark:bg-zinc-700" />
      {/* Pan body */}
      <div className="absolute left-1/2 top-14 h-44 w-64 -translate-x-1/2 rounded-b-[70px] rounded-t-[20px] border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white shadow-inner dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-900" />
      {/* Heat glow */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-red-100/60 to-transparent dark:from-red-900/20" />
    </div>
  );
}

// ── Blob ──────────────────────────────────────────────────────────────────────

function SauceBlob({ token, color }: { token: string; intensity: number; color: string }) {
  const isSoft = token === 'soften' || token === 'texture_breakdown';
  const isSmooth = token === 'smooth_mix';
  const isBrown = token === 'browning' || token === 'maillard';
  const isSplit = token === 'split';

  const borderRadius = isSoft
    ? '42% 58% 55% 45% / 55% 45% 55% 45%'
    : isSmooth
      ? '50%'
      : isSplit
        ? '46% 54% 45% 55% / 40% 60% 40% 60%'
        : '46% 54% 45% 55% / 50% 44% 56% 50%';

  return (
    <motion.div
      className={`relative h-36 w-36 shadow-2xl bg-gradient-to-br ${color}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: isSoft ? 1.18 : isSmooth ? 1.1 : 1,
        borderRadius,
        rotate: isSmooth ? 360 : isBrown ? [0, 2, -2, 0] : [0, 3, -2, 0],
        opacity: 1,
      }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{
        duration: isSmooth ? 3 : isSoft ? 1.4 : 1.2,
        repeat: Infinity,
        repeatType: isSmooth ? 'loop' : 'mirror',
        ease: 'easeInOut',
      }}
    >
      <motion.div
        className="absolute inset-4 rounded-full bg-white/20 blur-sm"
        animate={{ opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
      {token === 'viscosity_up' && (
        <motion.div
          className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/30"
          animate={{ scale: [0.8, 1.15, 0.8] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

// ── Overlay particles ─────────────────────────────────────────────────────────

function JuiceDrops() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute h-3 w-3 rounded-full bg-orange-300"
          initial={{ left: `${42 + i * 4}%`, top: '46%', opacity: 0, scale: 0.5 }}
          animate={{ top: `${68 + (i % 2) * 4}%`, opacity: [0, 1, 0.7], scale: [0.5, 1, 0.9] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.3, delay: i * 0.13, repeat: Infinity, repeatType: 'loop' }}
        />
      ))}
    </div>
  );
}

function Bubbles() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="absolute h-4 w-4 rounded-full border border-white/70 bg-white/25"
          initial={{ left: `${34 + i * 6}%`, top: '68%', opacity: 0 }}
          animate={{ top: '28%', opacity: [0, 1, 0], scale: [0.6, 1.2, 0.8] }}
          transition={{ duration: 2.2, delay: i * 0.22, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

function SafetyShield() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center text-6xl"
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: [0.7, 1.1, 1], opacity: [0, 1, 0.9] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
    >
      🛡️
    </motion.div>
  );
}

function SplitWarning() {
  return (
    <motion.div
      className="absolute right-4 top-4 rounded-xl bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      ⚠️ Риск расслоения
    </motion.div>
  );
}

function SmokeCloud() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute h-8 w-8 rounded-full bg-zinc-400/30 blur-md"
          initial={{ left: `${42 + i * 6}%`, top: '50%', opacity: 0 }}
          animate={{ top: '18%', opacity: [0, 0.7, 0], scale: [0.5, 1.5] }}
          transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

function IceCrystals() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {['❄️', '❄️', '❄️', '❄️'].map((flake, i) => (
        <motion.span
          key={i}
          className="absolute text-xl"
          initial={{ left: `${25 + i * 15}%`, top: '20%', opacity: 0 }}
          animate={{ top: '60%', opacity: [0, 1, 0] }}
          transition={{ duration: 2.5, delay: i * 0.4, repeat: Infinity }}
        >
          {flake}
        </motion.span>
      ))}
    </div>
  );
}
