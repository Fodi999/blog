/**
 * kitchen-tycoon/panels/ActionBar.tsx
 * Big bottom-center action buttons: tool switcher with icons + labels.
 */
'use client';

import { Hammer, MousePointer2, Move, RotateCw, Trash2, Zap } from 'lucide-react';
import { useKitchen } from '../engine/StoreProvider';
import type { ToolMode } from '../core/types';

const ACTIONS: Array<{ id: ToolMode; label: string; Icon: typeof Hammer; hotkey: string }> = [
  { id: 'select', label: 'Select', Icon: MousePointer2, hotkey: 'V' },
  { id: 'build',  label: 'Build',  Icon: Hammer,        hotkey: 'B' },
  { id: 'move',   label: 'Move',   Icon: Move,          hotkey: 'M' },
  { id: 'rotate', label: 'Rotate', Icon: RotateCw,      hotkey: 'R' },
  { id: 'delete', label: 'Delete', Icon: Trash2,        hotkey: 'X' },
];

export function ActionBar() {
  const tool    = useKitchen((s) => s.tool);
  const setTool = useKitchen((s) => s.setTool);

  return (
    <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-black/70 px-2 py-1.5 backdrop-blur">
      {ACTIONS.map(({ id, label, Icon, hotkey }) => {
        const active = tool === id;
        return (
          <button
            key={id}
            onClick={() => setTool(id)}
            title={`${label} (${hotkey})`}
            className={[
              'group flex items-center gap-2 rounded-xl px-3 py-2 transition-colors',
              active
                ? 'bg-yellow-400 text-black shadow'
                : 'text-zinc-300 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            <Icon size={15} />
            <span className="text-xs font-medium">{label}</span>
            <kbd
              className={[
                'rounded px-1 text-[9px] font-mono',
                active ? 'bg-black/20 text-black/60' : 'bg-white/10 text-zinc-500',
              ].join(' ')}
            >
              {hotkey}
            </kbd>
          </button>
        );
      })}

      <div className="mx-1 h-6 w-px bg-white/10" />

      <button
        className="flex items-center gap-2 rounded-xl bg-emerald-500/90 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-400"
        title="Run a production cycle (coming soon)"
      >
        <Zap size={14} />
        Start Production
      </button>
    </div>
  );
}
