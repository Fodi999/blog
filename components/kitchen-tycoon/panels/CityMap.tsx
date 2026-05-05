'use client';

import { useState } from 'react';
import { DISTRICTS, DISTRICT_LIST, type DistrictId, type District } from '../world/city-map';
import { cn } from '@/lib/utils';

// ── Grid constants ────────────────────────────────────────────────────────────
const CELL_W = 152;
const CELL_H = 96;
const GAP    = 8;
const COLS   = 3;
const ROWS   = 2;
const PAD    = 16;

function cellCenter(col: number, row: number) {
  return {
    x: PAD + col * (CELL_W + GAP) + CELL_W / 2,
    y: PAD + row * (CELL_H + GAP) + CELL_H / 2,
  };
}

const SVG_W = PAD * 2 + COLS * CELL_W + (COLS - 1) * GAP;
const SVG_H = PAD * 2 + ROWS * CELL_H + (ROWS - 1) * GAP;

// ── Connections between adjacent districts ────────────────────────────────────
function buildEdges(): Array<{ from: [number, number]; to: [number, number] }> {
  const seen = new Set<string>();
  const edges: Array<{ from: [number, number]; to: [number, number] }> = [];
  for (const d of DISTRICT_LIST) {
    for (const nid of d.neighbors) {
      const n = DISTRICTS[nid];
      const key = [d.id, nid].sort().join('|');
      if (!seen.has(key)) {
        seen.add(key);
        edges.push({ from: d.gridPos, to: n.gridPos });
      }
    }
  }
  return edges;
}
const EDGES = buildEdges();

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  selectedId?: DistrictId;
  onSelect?: (id: DistrictId) => void;
  playerLevel?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CityMap({ selectedId, onSelect, playerLevel = 1 }: Props) {
  const [hoverId, setHoverId] = useState<DistrictId | null>(null);

  // Build grid lookup
  const grid: Record<string, District> = {};
  for (const d of DISTRICT_LIST) {
    grid[`${d.gridPos[0]},${d.gridPos[1]}`] = d;
  }

  const hovered = hoverId ? DISTRICTS[hoverId] : null;

  return (
    <div className="flex flex-col gap-0" style={{ userSelect: 'none' }}>
      {/* City title */}
      <div className="flex items-center justify-between px-4 pb-2 pt-1">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
            Veridian City
          </p>
          <p className="text-[9px] text-white/20">Choose your location</p>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-white/25">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-green-500/60" />
            Unlocked
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-white/10" />
            Locked
          </span>
        </div>
      </div>

      {/* SVG map */}
      <div className="relative mx-auto" style={{ width: SVG_W, height: SVG_H }}>
        <svg
          width={SVG_W}
          height={SVG_H}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Connection lines */}
          {EDGES.map(({ from, to }, i) => {
            const a = cellCenter(from[0], from[1]);
            const b = cellCenter(to[0], to[1]);
            return (
              <line
                key={i}
                x1={a.x} y1={a.y}
                x2={b.x} y2={b.y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            );
          })}
        </svg>

        {/* District cells */}
        {DISTRICT_LIST.map((d) => {
          const [col, row] = d.gridPos;
          const isLocked   = playerLevel < d.unlockLevel;
          const isSelected = selectedId === d.id;
          const isHovered  = hoverId === d.id;

          const left = PAD + col * (CELL_W + GAP);
          const top  = PAD + row * (CELL_H + GAP);

          return (
            <button
              key={d.id}
              style={{
                position: 'absolute',
                left,
                top,
                width: CELL_W,
                height: CELL_H,
                borderTop: isLocked ? undefined : `2px solid ${d.color}`,
                boxShadow: isSelected
                  ? `0 0 20px ${d.color}50, inset 0 0 0 1px ${d.color}60`
                  : isHovered && !isLocked
                    ? `0 0 10px ${d.color}30`
                    : undefined,
              }}
              className={cn(
                'flex flex-col items-start justify-between rounded-lg border p-2.5 text-left transition-all duration-150 outline-none',
                isLocked
                  ? 'cursor-not-allowed border-white/5 bg-zinc-900/80 opacity-40'
                  : isSelected
                    ? 'cursor-pointer border-white/20 bg-zinc-800/90'
                    : 'cursor-pointer border-white/8 bg-zinc-900/70 hover:bg-zinc-800/80',
              )}
              onMouseEnter={() => setHoverId(d.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => !isLocked && onSelect?.(d.id)}
              disabled={isLocked}
            >
              {/* Top row */}
              <div className="flex w-full items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg leading-none">{d.icon}</span>
                  <div>
                    <p className={cn(
                      'text-[11px] font-semibold leading-tight',
                      isLocked ? 'text-white/25' : 'text-white/90',
                    )}>
                      {d.name}
                    </p>
                    <p className="text-[8px] text-white/30 leading-tight">{d.subtitle}</p>
                  </div>
                </div>

                {/* Selected checkmark */}
                {isSelected && (
                  <span className="text-xs text-yellow-400">✓</span>
                )}

                {/* Lock icon */}
                {isLocked && (
                  <span className="text-sm text-white/20">🔒</span>
                )}
              </div>

              {/* Bottom stats */}
              {isLocked ? (
                <p className="text-[9px] text-white/20">Requires Level {d.unlockLevel}</p>
              ) : (
                <div className="flex w-full items-center justify-between">
                  <span className="text-[9px] text-white/35">
                    👥 {d.demand.peakCustomers}/h
                  </span>
                  <span
                    className="rounded px-1 py-0.5 text-[9px] font-semibold"
                    style={{
                      background: d.color + '25',
                      color: d.color,
                    }}
                  >
                    ×{d.demand.priceMultiplier.toFixed(1)}
                  </span>
                  <span className="text-[9px] text-white/25">
                    {d.rent.perTilePerDay}zł/t
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Hover info strip */}
      <div className="mx-4 mb-3 mt-1 min-h-[36px] rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-[10px] transition-all">
        {hovered && playerLevel >= hovered.unlockLevel ? (
          <div className="flex items-center gap-3">
            <span style={{ color: hovered.color }} className="font-semibold">
              {hovered.icon} {hovered.name}
            </span>
            <span className="text-white/40">{hovered.description.slice(0, 80)}…</span>
          </div>
        ) : hovered && playerLevel < hovered.unlockLevel ? (
          <p className="text-white/30">🔒 Requires Level {hovered.unlockLevel} to unlock</p>
        ) : (
          <p className="text-white/20">Hover over a district to see details</p>
        )}
      </div>
    </div>
  );
}
