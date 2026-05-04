'use client';
/**
 * studio/panels/StudioSelectionBar.tsx
 *
 * Plasticity-style floating selection mode switcher.
 * Renders as an overlay in the top-left corner of the viewport.
 *
 *   Object | Face | Edge | Vertex
 *
 * Each button calls setSelectionMode() in the store.
 * Active mode is highlighted in emerald.
 *
 * Also exports SelectionModeSync — a headless component that listens for
 * `studio:set-selection-mode` custom events dispatched from outside the
 * StudioProvider context (e.g. keyboard shortcuts in SceneClient).
 */

import { useEffect } from 'react';
import { Box, Square, Minus, CircleDot, type LucideProps } from 'lucide-react';
import { useStudioStore } from '../engine/StudioProvider';
import type { SelectionMode } from '../core/types';

// ── Mode definitions ──────────────────────────────────────────────────────────

const MODES: Array<{
  mode: SelectionMode;
  label: string;
  Icon: React.FC<LucideProps>;
}> = [
  { mode: 'object', label: 'Object', Icon: Box       },
  { mode: 'face',   label: 'Face',   Icon: Square    },
  { mode: 'edge',   label: 'Edge',   Icon: Minus     },
  { mode: 'vertex', label: 'Vertex', Icon: CircleDot },
];

// ── SelectionModeSync ─────────────────────────────────────────────────────────
// Headless component — bridges keyboard shortcuts from outside StudioProvider.
// Must be rendered INSIDE StudioProvider so it can call useStudioStore.

export function SelectionModeSync() {
  const setSelectionMode = useStudioStore((s) => s.setSelectionMode);
  useEffect(() => {
    const handler = (e: Event) => {
      const mode = (e as CustomEvent<SelectionMode>).detail;
      if (mode) setSelectionMode(mode);
    };
    window.addEventListener('studio:set-selection-mode', handler);
    return () => window.removeEventListener('studio:set-selection-mode', handler);
  }, [setSelectionMode]);
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StudioSelectionBar() {
  const selectionMode    = useStudioStore((s) => s.tool.selectionMode);
  const setSelectionMode = useStudioStore((s) => s.setSelectionMode);

  return (
    <div className="absolute left-3 top-3 z-20 flex rounded-xl bg-black/80 p-1 shadow-lg backdrop-blur-sm">
      {MODES.map(({ mode, label, Icon }, i) => {
        const active = selectionMode === mode;
        return (
          <button
            key={mode}
            type="button"
            title={`${label} (${i + 1})`}
            onClick={() => setSelectionMode(mode)}
            className={[
              'flex h-8 w-9 items-center justify-center rounded-lg transition-colors',
              active
                ? 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : 'text-zinc-400 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}
