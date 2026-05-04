'use client';
/**
 * studio/panels/StudioBottomBar.tsx
 *
 * Plasticity-style bottom action bar.
 *
 * MVP actions:
 *   Fit · Snap · Grid · Duplicate · Delete · Undo · Redo
 *
 * Layout:
 *   [ Fit ] [ | ] [ Snap ] [ Grid 10cm ▾ ] [ | ] [ Duplicate ] [ Delete ]
 *                                                                 [ | ] [ Undo ] [ Redo ]
 */

import { useState } from 'react';
import {
  Maximize2,
  Magnet,
  Grid3X3,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  ChevronDown,
  type LucideProps,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudioStore, useRunner } from '../engine/StudioProvider';
import { makeAddCommand, makeRemoveCommand } from '../core/commands';

// ── Grid size options ─────────────────────────────────────────────────────────

const GRID_SIZES: { label: string; value: number }[] = [
  { label: '1 cm',  value: 0.01  },
  { label: '5 cm',  value: 0.05  },
  { label: '10 cm', value: 0.10  },
  { label: '25 cm', value: 0.25  },
  { label: '50 cm', value: 0.50  },
  { label: '1 m',   value: 1.00  },
];

// ── Separator ─────────────────────────────────────────────────────────────────

function Sep() {
  return <div className="h-5 w-px shrink-0 bg-white/10" />;
}

// ── Icon button ───────────────────────────────────────────────────────────────

interface BtnProps {
  Icon: React.FC<LucideProps>;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  shortcut?: string;
}

function Btn({ Icon, label, onClick, active, disabled, variant = 'default', shortcut }: BtnProps) {
  return (
    <button
      type="button"
      title={shortcut ? `${label} (${shortcut})` : label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative flex h-7 items-center gap-1.5 rounded-md px-2.5 font-mono text-[10px] transition-colors',
        // base
        !active && !disabled && variant === 'default' && 'text-white/45 hover:bg-white/8 hover:text-white/80',
        // active
        active && 'bg-white/10 text-white',
        // danger
        !disabled && variant === 'danger' && 'text-rose-400/50 hover:bg-rose-400/10 hover:text-rose-400',
        // disabled
        disabled && 'cursor-not-allowed opacity-25',
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StudioBottomBar() {
  const snapEnabled   = useStudioStore((s) => s.tool.snapEnabled);
  const gridSize      = useStudioStore((s) => s.tool.gridSize);
  const selectedId    = useStudioStore((s) => s.selection.objectId);
  const getObject     = useStudioStore((s) => s.getObject);
  const setSnapEnabled = useStudioStore((s) => s.setSnapEnabled);
  const patchToolState = useStudioStore((s) => s.patchToolState);
  const runner        = useRunner();

  const [gridOpen, setGridOpen] = useState(false);

  const hasSelection = !!selectedId;

  // ── Fit to view — placeholder until CameraRig exposes fitToView API ──
  const handleFit = () => {
    // TODO: emit a custom event / use a camera ref to trigger fitToView.
    // For now, dispatch a browser custom event that CameraRig can listen to.
    window.dispatchEvent(new CustomEvent('studio:fit-to-view'));
  };

  // ── Duplicate selected object ──
  const handleDuplicate = () => {
    if (!selectedId) return;
    const obj = getObject(selectedId);
    if (!obj) return;
    const clone = {
      ...obj,
      id: `${obj.id}_copy_${Date.now()}`,
      label: `${obj.label} copy`,
      transform: {
        ...obj.transform,
        position: [
          obj.transform.position[0] + 0.3,
          obj.transform.position[1],
          obj.transform.position[2] + 0.3,
        ] as [number, number, number],
      },
    };
    runner.run(makeAddCommand(clone));
  };

  // ── Delete selected object ──
  const handleDelete = () => {
    if (!selectedId) return;
    const obj = getObject(selectedId);
    if (!obj) return;
    runner.run(makeRemoveCommand(obj));
  };

  const currentGridLabel =
    GRID_SIZES.find((g) => Math.abs(g.value - gridSize) < 1e-6)?.label ?? `${gridSize * 100} cm`;

  return (
    <div className="pointer-events-auto flex h-9 shrink-0 items-center gap-1 border-t border-white/6 bg-[#0a0a0a] px-3">

      {/* ── Camera ── */}
      <Btn Icon={Maximize2} label="Fit" onClick={handleFit} shortcut="F" />

      <Sep />

      {/* ── Snap ── */}
      <Btn
        Icon={Magnet}
        label="Snap"
        onClick={() => setSnapEnabled(!snapEnabled)}
        active={snapEnabled}
        shortcut="X"
      />

      {/* ── Grid size ── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setGridOpen((o) => !o)}
          className={cn(
            'flex h-7 items-center gap-1 rounded-md px-2.5 font-mono text-[10px] transition-colors',
            gridOpen
              ? 'bg-white/10 text-white'
              : 'text-white/45 hover:bg-white/8 hover:text-white/80',
          )}
        >
          <Grid3X3 className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">{currentGridLabel}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>

        {gridOpen && (
          <div className="absolute bottom-full left-0 mb-1.5 z-50 overflow-hidden rounded-lg border border-white/10 bg-[#111] shadow-xl">
            {GRID_SIZES.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => {
                  patchToolState({ gridSize: g.value });
                  setGridOpen(false);
                }}
                className={cn(
                  'flex w-full items-center px-4 py-1.5 font-mono text-[10px] transition-colors',
                  Math.abs(g.value - gridSize) < 1e-6
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:bg-white/6 hover:text-white',
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <Sep />

      {/* ── Object actions ── */}
      <Btn
        Icon={Copy}
        label="Duplicate"
        onClick={handleDuplicate}
        disabled={!hasSelection}
        shortcut="⇧D"
      />
      <Btn
        Icon={Trash2}
        label="Delete"
        onClick={handleDelete}
        disabled={!hasSelection}
        variant="danger"
        shortcut="Del"
      />

      <Sep />

      {/* ── Undo / Redo ── */}
      <Btn
        Icon={Undo2}
        label="Undo"
        onClick={() => runner.undo()}
        disabled={!runner.canUndo()}
        shortcut="⌘Z"
      />
      <Btn
        Icon={Redo2}
        label="Redo"
        onClick={() => runner.redo()}
        disabled={!runner.canRedo()}
        shortcut="⌘⇧Z"
      />
    </div>
  );
}
