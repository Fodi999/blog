'use client';

/**
 * VisualStoryPlayer — main "wow block" of the Laboratory.
 *
 * Turns a `LaboratoryVisualStory` (raw → … → ready) into a story-player with:
 *   • current frame display (image when available, animated fallback otherwise)
 *   • Prev / Next controls
 *   • Autoplay with pause-on-hover
 *   • Progress timeline (clickable)
 *
 * When `image_url` is null we render a layered fallback driven by `scene_key`
 * + `visual_tokens`, reusing the same Framer Motion vocabulary as
 * `ProductProcessScene`. Once the backend fills `image_url` (Gemini step), we
 * just swap the fallback for a `<Image>` with the same crossfade.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';

import type {
  LaboratorySceneFrame,
  LaboratoryVisualStory,
} from '@/lib/laboratory-api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Scene visual presets
// ─────────────────────────────────────────────────────────────────────────────

type ScenePreset = {
  /** Tailwind gradient classes for the backdrop. */
  bg: string;
  /** Emoji used as a soft glyph badge in the corner. */
  emoji: string;
};

const SCENE_PRESETS: Record<string, ScenePreset> = {
  raw:          { bg: 'from-emerald-100 via-emerald-50 to-amber-50',       emoji: '🥕' },
  softening:    { bg: 'from-amber-100 via-rose-100 to-orange-100',          emoji: '🍯' },
  juicing:      { bg: 'from-orange-100 via-amber-100 to-rose-100',          emoji: '💧' },
  heated:       { bg: 'from-rose-100 via-orange-100 to-amber-100',          emoji: '🔥' },
  browning:     { bg: 'from-orange-200 via-amber-200 to-yellow-100',        emoji: '🍞' },
  thickening:   { bg: 'from-amber-200 via-orange-100 to-rose-100',          emoji: '🥄' },
  blended:      { bg: 'from-pink-100 via-rose-100 to-orange-100',           emoji: '🌀' },
  strained:     { bg: 'from-sky-100 via-cyan-50 to-blue-50',                emoji: '⚗️' },
  chilled:      { bg: 'from-sky-100 via-blue-100 to-indigo-100',            emoji: '❄️' },
  frozen:       { bg: 'from-cyan-100 via-sky-100 to-blue-200',              emoji: '🧊' },
  fermenting:   { bg: 'from-amber-100 via-yellow-100 to-orange-100',        emoji: '🫧' },
  drying:       { bg: 'from-yellow-100 via-amber-100 to-orange-50',         emoji: '☀️' },
  pasteurized:  { bg: 'from-emerald-100 via-teal-50 to-cyan-50',            emoji: '🛡️' },
  split:        { bg: 'from-zinc-100 via-stone-100 to-amber-50',            emoji: '⚠️' },
  transforming: { bg: 'from-purple-100 via-pink-100 to-amber-100',          emoji: '✨' },
  ready:        { bg: 'from-rose-200 via-orange-100 to-amber-100',          emoji: '🍽️' },
};

function presetFor(sceneKey: string): ScenePreset {
  return SCENE_PRESETS[sceneKey] ?? SCENE_PRESETS.transforming;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export type StoryLabels = {
  title?: string;        // "Visual story"
  subtitle?: string;     // "From raw ingredients to ready product"
  prev?: string;
  next?: string;
  play?: string;
  pause?: string;
  placeholder?: string;  // shown over the fallback when no image
  ofLabel?: string;      // "1 of 4"
  empty?: string;        // shown when scenes.length === 0
};

type Props = {
  story: LaboratoryVisualStory | null;
  labels?: StoryLabels;
  /** Autoplay interval in ms. Default 3500. Set to 0 to disable autoplay by default. */
  autoplayMs?: number;
};

export function VisualStoryPlayer({ story, labels = {}, autoplayMs = 3500 }: Props) {
  const scenes = story?.scenes ?? [];
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [playing, setPlaying] = useState<boolean>(autoplayMs > 0 && scenes.length > 1);
  const hoverRef = useRef(false);

  // Reset to first frame when the story object changes.
  useEffect(() => {
    setIndex(0);
    setDirection(1);
    setPlaying(autoplayMs > 0 && (story?.scenes.length ?? 0) > 1);
  }, [story, autoplayMs]);

  const total = scenes.length;
  const safeIndex = total === 0 ? 0 : Math.min(index, total - 1);
  const current: LaboratorySceneFrame | null = scenes[safeIndex] ?? null;

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      const wrapped = ((next % total) + total) % total;
      setDirection(wrapped > safeIndex ? 1 : -1);
      setIndex(wrapped);
    },
    [safeIndex, total],
  );
  const next = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex]);
  const prev = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex]);

  // Autoplay timer (paused on hover).
  useEffect(() => {
    if (!playing || total < 2 || autoplayMs <= 0) return;
    const id = window.setInterval(() => {
      if (hoverRef.current) return;
      setIndex((i) => (i + 1) % total);
      setDirection(1);
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [playing, total, autoplayMs]);

  // Keyboard navigation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  if (!story || total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        {labels.empty ?? 'No story yet — analyze the project to generate scenes.'}
      </div>
    );
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
      onMouseEnter={() => {
        hoverRef.current = true;
      }}
      onMouseLeave={() => {
        hoverRef.current = false;
      }}
    >
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-primary/5 via-transparent to-transparent px-5 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {labels.title ?? 'Visual story'}
          </div>
          <h3 className="mt-0.5 truncate text-base font-semibold">
            {story.headline}
          </h3>
          {labels.subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{labels.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={prev}
            aria-label={labels.prev ?? 'Previous'}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? labels.pause ?? 'Pause' : labels.play ?? 'Play'}
            className="h-8 w-8"
            disabled={total < 2}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            aria-label={labels.next ?? 'Next'}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Stage */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/40">
        <AnimatePresence mode="wait" custom={direction}>
          {current && (
            <motion.div
              key={current.order_index}
              custom={direction}
              initial={{ opacity: 0, scale: 1.04, x: direction > 0 ? 24 : -24 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.98, x: direction > 0 ? -24 : 24 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {current.image_url ? (
                <ImageStage frame={current} />
              ) : (
                <FallbackStage frame={current} placeholderText={labels.placeholder} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom caption (always over the stage) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent p-4 text-white">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider opacity-80">
            <span className="rounded bg-white/15 px-1.5 py-0.5">
              {current?.scene_key}
            </span>
            <span>
              {(safeIndex + 1)} {labels.ofLabel ?? '/'} {total}
            </span>
          </div>
          <h4 className="mt-1 text-lg font-semibold leading-tight drop-shadow">
            {current?.title}
          </h4>
          {current?.description && (
            <p className="mt-1 line-clamp-2 max-w-2xl text-sm opacity-90 drop-shadow">
              {current.description}
            </p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-2 px-5 py-3">
        {scenes.map((s, i) => (
          <button
            key={s.order_index}
            onClick={() => goTo(i)}
            className={cn(
              'group flex flex-1 flex-col items-start gap-1 rounded-lg p-1 text-left transition',
              i === safeIndex
                ? 'bg-primary/10'
                : 'hover:bg-muted/60',
            )}
            aria-label={s.title}
          >
            <div
              className={cn(
                'h-1.5 w-full rounded-full transition-all',
                i === safeIndex
                  ? 'bg-primary'
                  : i < safeIndex
                  ? 'bg-primary/40'
                  : 'bg-muted-foreground/20',
              )}
            />
            <span
              className={cn(
                'truncate text-[11px] font-medium',
                i === safeIndex ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {presetFor(s.scene_key).emoji} {s.scene_key}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage variants
// ─────────────────────────────────────────────────────────────────────────────

function ImageStage({ frame }: { frame: LaboratorySceneFrame }) {
  // Simple image stage with a Ken Burns-style slow zoom.
  return (
    <motion.div
      initial={{ scale: 1.05 }}
      animate={{ scale: 1.12 }}
      transition={{ duration: 6, ease: 'easeOut' }}
      className="absolute inset-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frame.image_url ?? undefined}
        alt={frame.title}
        className="h-full w-full object-cover"
        draggable={false}
      />
    </motion.div>
  );
}

function FallbackStage({
  frame,
  placeholderText,
}: {
  frame: LaboratorySceneFrame;
  placeholderText?: string;
}) {
  const preset = presetFor(frame.scene_key);
  const tokens = frame.visual_tokens;

  return (
    <div className={cn('relative h-full w-full bg-gradient-to-br', preset.bg)}>
      {/* Big soft blob — represents the product mass */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-[42%] bg-white/40 backdrop-blur-sm"
        initial={{ scale: 0.9, rotate: 0 }}
        animate={{
          scale: [0.95, 1.02, 0.97, 1.01, 0.95],
          rotate: [0, 2, -1, 1, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Inner glow */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 blur-2xl"
        animate={{ opacity: [0.5, 0.75, 0.55] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Token-driven particle layers */}
      {tokens.includes('juice_release') && <JuiceLayer />}
      {tokens.includes('bubbles') && <BubbleLayer />}
      {tokens.includes('ice_crystals') && <IceLayer />}
      {tokens.includes('browning') && <HeatGlow />}
      {tokens.includes('maillard') && <HeatGlow />}
      {tokens.includes('smooth_mix') && <SwirlLayer />}
      {tokens.includes('soften') && <SwirlLayer />}
      {tokens.includes('viscosity_up') && <SwirlLayer />}
      {tokens.includes('safety_shield') && <ShieldLayer />}
      {tokens.includes('split') && <SplitLayer />}
      {(tokens.includes('plated') || frame.scene_key === 'ready') && <PlateRing />}

      {/* Big emoji glyph in the corner */}
      <div className="absolute right-4 top-4 text-4xl drop-shadow-md opacity-80">
        {preset.emoji}
      </div>

      {/* Tiny "no image yet" hint */}
      {placeholderText && (
        <div className="absolute left-4 top-4 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground/70 shadow-sm backdrop-blur">
          {placeholderText}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Token particle layers (lightweight; no external deps)
// ─────────────────────────────────────────────────────────────────────────────

function JuiceLayer() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-2 w-1.5 rounded-full bg-orange-400/80"
          style={{ left: `${15 + i * 9}%`, top: '40%' }}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: [0, 80, 90], opacity: [0, 1, 0] }}
          transition={{
            duration: 2 + (i % 3) * 0.4,
            delay: i * 0.18,
            repeat: Infinity,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}

function BubbleLayer() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-white/60 bg-white/30"
          style={{
            left: `${10 + i * 8}%`,
            bottom: '20%',
            width: 6 + (i % 3) * 4,
            height: 6 + (i % 3) * 4,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [-10, -120], opacity: [0, 0.9, 0] }}
          transition={{
            duration: 3 + (i % 3) * 0.5,
            delay: i * 0.25,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

function IceLayer() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rotate-45 bg-sky-300"
          style={{ left: `${(i * 7) % 100}%`, top: `${(i * 13) % 100}%` }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{
            duration: 2.4,
            delay: (i % 5) * 0.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function HeatGlow() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(251,146,60,0.45),transparent_60%)]"
      animate={{ opacity: [0.5, 0.85, 0.55] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function SwirlLayer() {
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 h-[55%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[6px] border-white/40 border-dashed"
      animate={{ rotate: 360 }}
      transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
    />
  );
}

function ShieldLayer() {
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-400/70"
      animate={{ scale: [0.9, 1.05, 0.95], opacity: [0.5, 0.9, 0.6] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function SplitLayer() {
  return (
    <div className="pointer-events-none absolute inset-x-12 top-1/2 -translate-y-1/2">
      <motion.div
        className="h-[2px] w-full rounded-full bg-zinc-500/60"
        animate={{ scaleY: [1, 2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function PlateRing() {
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[8px] border-white/70 shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  );
}
