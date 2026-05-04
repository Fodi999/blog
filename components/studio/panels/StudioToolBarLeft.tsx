'use client';
/**
 * studio/panels/StudioToolBarLeft.tsx
 *
 * Vertical tool palette — left side of the viewport.
 *
 *   Select / Move / Rotate / Scale / Draw Wall / Extrude / Measure
 *   ──── separator ────
 *   Delete  (calls removeObject on selected, not setTransformMode)
 */

import {
  MousePointer2,
  Move3D,
  RotateCcw,
  Scaling,
  Ruler,
  Trash2,
  Box,
  PenLine,
  type LucideProps,
} from 'lucide-react';
import { useStudioStore } from '../engine/StudioProvider';
import { useRunner } from '../engine/StudioProvider';
import { makeRemoveCommand } from '../core/commands';
import type { TransformMode } from '../core/types';

// ── Tool definitions ──────────────────────────────────────────────────────────

type ToolEntry = {
  mode: TransformMode;
  label: string;
  Icon: React.FC<LucideProps>;
};

const TOOLS: ToolEntry[] = [
  { mode: 'select',    label: 'Select',    Icon: MousePointer2 },
  { mode: 'move',      label: 'Move',      Icon: Move3D        },
  { mode: 'rotate',    label: 'Rotate',    Icon: RotateCcw     },
  { mode: 'scale',     label: 'Scale',     Icon: Scaling       },
  { mode: 'draw_wall', label: 'Draw Wall', Icon: PenLine       },
  { mode: 'extrude',   label: 'Extrude',   Icon: Box           },
  { mode: 'measure',   label: 'Measure',   Icon: Ruler         },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function StudioToolBarLeft() {
  const transformMode    = useStudioStore((s) => s.tool.transformMode);
  const setTransformMode = useStudioStore((s) => s.setTransformMode);
  const selectedId       = useStudioStore((s) => s.selection.objectId);
  const getObject        = useStudioStore((s) => s.getObject);
  const runner           = useRunner();

  function handleDelete() {
    if (!selectedId) return;
    const obj = getObject(selectedId);
    if (!obj) return;
    runner.run(makeRemoveCommand(obj));
  }

  return (
    <div className="absolute left-3 top-16 z-20 flex flex-col rounded-xl bg-black/80 p-1 shadow-lg backdrop-blur-sm">
      {/* Transform tools */}
      {TOOLS.map(({ mode, label, Icon }) => {
        const active = transformMode === mode;
        return (
          <button
            key={mode}
            type="button"
            title={label}
            onClick={() => setTransformMode(mode)}
            className={[
              'mb-0.5 flex h-9 w-9 items-center justify-center rounded-lg transition-colors last:mb-0',
              active
                ? 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : 'text-zinc-400 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            <Icon size={16} />
          </button>
        );
      })}

      {/* Separator */}
      <div className="my-1 h-px w-full bg-white/10" />

      {/* Delete — separate action, not a transform mode */}
      <button
        type="button"
        title="Delete selected (Del)"
        onClick={handleDelete}
        disabled={!selectedId}
        className={[
          'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
          selectedId
            ? 'text-rose-400 hover:bg-rose-500/15 hover:text-rose-300'
            : 'cursor-not-allowed text-zinc-600',
        ].join(' ')}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
