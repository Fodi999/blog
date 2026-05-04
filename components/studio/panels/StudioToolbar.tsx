'use client';
/**
 * studio/panels/StudioToolbar.tsx
 *
 * Top horizontal toolbar:
 *   [Add ▾] [Select] [Move] [Rotate] [Scale]  |  [1 Object] [2 Face] [3 Edge] [4 Vertex]  |  [Solid] [Wire+] [Wire]
 */

import React from 'react';
import type { TransformMode, SelectionMode, ViewMode } from '../core/types';

// ── Icons (text-based, no dependency) ────────────────────────────────────────

const T_ICONS: Record<TransformMode, string> = {
  select:    '▣',
  translate: '↔',
  rotate:    '↻',
  scale:     '⤢',
};

const SEL_ICONS: Record<SelectionMode, string> = {
  object: '□',
  face:   '◧',
  edge:   '─',
  vertex: '·',
};

const VIEW_LABELS: Record<ViewMode, string> = {
  solid:       'Solid',
  'solid-wire':'Solid+W',
  wire:        'Wire',
};

// ── Toolbar ───────────────────────────────────────────────────────────────────

export interface StudioToolbarProps {
  transformMode: TransformMode;
  onTransformMode: (m: TransformMode) => void;
  selectionMode: SelectionMode;
  onSelectionMode: (m: SelectionMode) => void;
  viewMode: ViewMode;
  onViewMode: (m: ViewMode) => void;
  onAdd?: () => void;
}

export function StudioToolbar({
  transformMode,
  onTransformMode,
  selectionMode,
  onSelectionMode,
  viewMode,
  onViewMode,
  onAdd,
}: StudioToolbarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-white/8 bg-[#0a0a0a] px-3 py-1.5">
      {/* Add */}
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1 rounded-md border border-white/12 bg-white/6 px-2.5 py-1 text-[11px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        + Add
      </button>

      <div className="h-4 w-px bg-white/10" />

      {/* Transform modes */}
      <div className="flex items-center gap-0.5 rounded-lg border border-white/8 bg-white/3 p-0.5">
        {(['select', 'translate', 'rotate', 'scale'] as TransformMode[]).map((m) => (
          <button
            key={m}
            type="button"
            title={`${m} (${m === 'select' ? 'Q' : m === 'translate' ? 'W' : m === 'rotate' ? 'E' : 'R'})`}
            onClick={() => onTransformMode(m)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              transformMode === m
                ? 'bg-white/15 text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <span>{T_ICONS[m]}</span>
            <span className="capitalize">{m}</span>
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-white/10" />

      {/* Selection modes */}
      <div className="flex items-center gap-0.5 rounded-lg border border-white/8 bg-white/3 p-0.5">
        {(['object', 'face', 'edge', 'vertex'] as SelectionMode[]).map((m, i) => (
          <button
            key={m}
            type="button"
            title={`${m} (${i + 1})`}
            onClick={() => onSelectionMode(m)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              selectionMode === m
                ? 'bg-sky-500/20 text-sky-300'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <span>{SEL_ICONS[m]}</span>
            <span className="capitalize">{m}</span>
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-white/10" />

      {/* View mode */}
      <div className="flex items-center gap-0.5 rounded-lg border border-white/8 bg-white/3 p-0.5">
        {(['solid', 'solid-wire', 'wire'] as ViewMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onViewMode(m)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              viewMode === m
                ? 'bg-white/15 text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {VIEW_LABELS[m]}
          </button>
        ))}
      </div>
    </div>
  );
}
