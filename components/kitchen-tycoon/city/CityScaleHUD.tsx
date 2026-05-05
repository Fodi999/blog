'use client';

/**
 * CityScaleHUD — overlay showing city dimensions, scale bar and terrain debug info.
 *
 * Positioned bottom-right of the 3D viewport.
 * All numbers come from the live CityMap so they reflect real backend data.
 */

import { useCityMap } from '@/hooks/useCityMap';

function fmt(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${Math.round(m)} m`;
}

function fmtSigned(m: number): string {
  const s = Math.round(m);
  return s >= 0 ? `+${s} m` : `${s} m`;
}

/** Picks the nearest "nice" scale-bar length (in metres) for a given city width. */
function niceBar(cityWidthM: number): number {
  const candidates = [10, 25, 50, 100, 200, 250, 500];
  const target = cityWidthM / 5;
  return candidates.reduce((best, c) =>
    Math.abs(c - target) < Math.abs(best - target) ? c : best, candidates[0]);
}

export function CityScaleHUD() {
  const { map } = useCityMap();

  if (!map) return null;

  const W = map.bounds.width;
  const D = map.bounds.depth;
  const districtCount = map.districts?.length ?? 0;
  const buildingCount = map.districts?.reduce((s, d) => s + (d.buildings?.length ?? 0), 0) ?? 0;

  const terrain = map.terrain;
  const minH    = terrain?.minHeight ?? null;
  const maxH    = terrain?.maxHeight ?? null;
  const amplitude = (minH !== null && maxH !== null) ? maxH - minH : null;
  // max slope estimate: dH over cell_size (rough, for display)
  const cellSize  = terrain?.cellSize ?? 4;
  const maxSlope  = amplitude !== null ? ((amplitude / 2) / (W / 2)) * 100 : null;

  // Constants mirrored from backend terrain.rs
  const EDGE_SINK_Y = -30;
  const BASE_Y      = -50;

  // Scale bar
  const barM      = niceBar(W);
  const BAR_MAX_PX = 120;
  const barPx     = (barM / W) * BAR_MAX_PX;

  return (
    <div
      className="pointer-events-none absolute bottom-4 right-3 z-20 flex flex-col items-end gap-2"
      aria-label="City scale information"
    >
      {/* ── Terrain debug panel ─────────────────────────────────── */}
      <div className="rounded-lg bg-black/60 px-3 py-2 backdrop-blur-sm text-[10px] font-mono tabular-nums">
        <div className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/40">
          Карта / Рельеф
        </div>
        <div className="flex flex-col gap-0.5">
          <Row label="Map Size"      value={`${Math.round(W)} × ${Math.round(D)} m`} />
          {minH !== null && maxH !== null && <>
            <Row label="Relief Range"  value={`${fmtSigned(minH)} .. ${fmtSigned(maxH)}`} />
            <Row label="Amplitude"     value={`${Math.round(amplitude!)} m`}
              color={amplitude! < 30 ? 'text-amber-400' : 'text-emerald-400'} />
            {maxSlope !== null &&
              <Row label="Max Slope"   value={`~${maxSlope.toFixed(1)}%`} />}
          </>}
          <Row label="Cell Size"     value={`${cellSize} m`} />
          <div className="my-1 h-px bg-white/10" />
          <Row label="Terrain Base"  value={`${BASE_Y} m`} />
          <Row label="Edge Sink"     value={`${EDGE_SINK_Y} m`} />
          <div className="my-1 h-px bg-white/10" />
          <Row label="Districts"     value={String(districtCount)} />
          <Row label="Buildings"     value={String(buildingCount)} />
        </div>
      </div>

      {/* ── Visual scale bar ────────────────────────────────────── */}
      <div
        className="rounded bg-black/55 px-2 py-1.5 backdrop-blur"
        style={{ width: `${BAR_MAX_PX + 16}px` }}
      >
        <div className="flex items-center">
          <div className="h-2 w-px bg-white/60" />
          <div className="h-px bg-white/60" style={{ width: `${barPx}px` }} />
          <div className="h-2 w-px bg-white/60" />
        </div>
        <div
          className="mt-0.5 text-center text-[9px] font-semibold text-white/70"
          style={{ width: `${barPx + 2}px` }}
        >
          {fmt(barM)}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color = 'text-white/80' }: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-white/40">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}
