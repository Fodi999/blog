'use client';
/**
 * studio/panels/StudioHierarchy.tsx
 *
 * Left-side outliner panel — list of all scene objects with
 * visibility toggle, lock, and selection.
 */

import React from 'react';
import type { SceneObject } from '../core/types';

export interface StudioHierarchyProps {
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRemove: (id: string) => void;
}

export function StudioHierarchy({
  objects,
  selectedId,
  onSelect,
  onToggleVisible,
  onToggleLock,
  onRemove,
}: StudioHierarchyProps) {
  return (
    <div className="flex h-full flex-col border-r border-white/6 bg-[#090909]">
      <div className="border-b border-white/6 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
        Hierarchy
      </div>
      <div className="flex-1 overflow-y-auto">
        {objects.length === 0 && (
          <p className="p-3 text-[11px] text-white/20">Empty scene</p>
        )}
        {objects.map((obj) => (
          <div
            key={obj.id}
            onClick={() => onSelect(obj.id)}
            className={`group flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[11px] transition-colors ${
              selectedId === obj.id
                ? 'bg-sky-500/10 text-white'
                : 'text-white/50 hover:bg-white/4 hover:text-white/80'
            } ${obj.visible === false ? 'opacity-40' : ''}`}
          >
            {/* Kind icon */}
            <span className="text-[10px] text-white/25">
              {kindIcon(obj.kind)}
            </span>
            {/* Label */}
            <span className="flex-1 truncate">{obj.label}</span>
            {/* Actions — appear on hover */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                title={obj.visible === false ? 'Show' : 'Hide'}
                onClick={(e) => { e.stopPropagation(); onToggleVisible(obj.id); }}
                className="text-[10px] text-white/30 hover:text-white"
              >
                {obj.visible === false ? '○' : '●'}
              </button>
              <button
                type="button"
                title={obj.locked ? 'Unlock' : 'Lock'}
                onClick={(e) => { e.stopPropagation(); onToggleLock(obj.id); }}
                className="text-[10px] text-white/30 hover:text-white"
              >
                {obj.locked ? '🔒' : '🔓'}
              </button>
              <button
                type="button"
                title="Remove"
                onClick={(e) => { e.stopPropagation(); onRemove(obj.id); }}
                className="text-[10px] text-rose-400/40 hover:text-rose-400"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function kindIcon(kind: SceneObject['kind']): string {
  const map: Record<string, string> = {
    cube: '⬛', sphere: '⚫', cylinder: '⬤', cone: '▲', torus: '◎',
    square: '■', rectangle: '▬', circle: '●', triangle: '▴', line: '─',
  };
  return map[kind] ?? '?';
}
