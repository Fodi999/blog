'use client';
/**
 * studio/panels/ExtrudePanel.tsx
 *
 * Floating HUD shown when:
 *   transformMode === 'extrude'   AND
 *   selection.sub?.mode === 'face'  AND
 *   selected object is a cube/box primitive.
 *
 * Lets the user type a distance (metres) and press Apply (or Enter).
 * Dispatches an ExtrudeBoxCommand through the CommandRunner — fully undo/redo-able.
 */

import { useState, useEffect, useRef } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { useStudioStore, useRunner } from '../engine/StudioProvider';
import { makeExtrudeBoxCommand } from '../core/commands';
import type { FaceId } from '../core/types';

const FACE_LABEL: Record<FaceId, string> = {
  top: '↑ Top', bottom: '↓ Bottom',
  front: '● Front', back: '◎ Back',
  right: '→ Right', left: '← Left',
};

export function ExtrudePanel() {
  const transformMode = useStudioStore((s) => s.tool.transformMode);
  const sub           = useStudioStore((s) => s.selection.sub);
  const selectedId    = useStudioStore((s) => s.selection.objectId);
  const getObject     = useStudioStore((s) => s.getObject);
  const runner        = useRunner();

  const [distance, setDistance] = useState('0.25');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when panel appears
  useEffect(() => {
    if (transformMode === 'extrude') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [transformMode]);

  // Only visible when: extrude mode + face selected + object is a cube
  if (transformMode !== 'extrude') return null;
  if (!sub || sub.mode !== 'face') return null;
  if (!selectedId) return null;

  const obj = getObject(selectedId);
  if (!obj || obj.shape.kind !== 'cube') return null;

  const faceId = sub.data.faceId;

  const apply = () => {
    const dist = parseFloat(distance);
    if (isNaN(dist) || dist === 0) return;

    runner.run(
      makeExtrudeBoxCommand(
        selectedId,
        faceId,
        dist,
        {
          scale:    [...obj.transform.scale]    as [number, number, number],
          position: [...obj.transform.position] as [number, number, number],
        },
      ),
    );
    // Reset for next extrude
    setDistance('0.25');
  };

  return (
    <div className="pointer-events-auto absolute bottom-16 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-[#111]/90 px-4 py-2.5 shadow-2xl backdrop-blur-md">
        {/* Icon */}
        <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-yellow-400" />

        {/* Label */}
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          Extrude
        </span>
        <span className="rounded-md bg-yellow-400/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-300">
          {FACE_LABEL[faceId]}
        </span>

        {/* Distance input */}
        <input
          ref={inputRef}
          type="number"
          step="0.05"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') apply();
            if (e.key === 'Escape') setDistance('0.25');
          }}
          className="w-20 rounded-md border border-white/10 bg-white/6 px-2 py-1 text-center font-mono text-[11px] text-white outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
        />
        <span className="font-mono text-[10px] text-white/30">m</span>

        {/* Apply */}
        <button
          type="button"
          onClick={apply}
          className="rounded-md bg-yellow-400/20 px-3 py-1 font-mono text-[10px] font-semibold text-yellow-300 transition-colors hover:bg-yellow-400/35"
        >
          Apply ↵
        </button>
      </div>
    </div>
  );
}
