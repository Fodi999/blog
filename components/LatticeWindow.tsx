'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Dict, Locale } from '@/lib/i18n';
import { evaluate, type BuildName, type LatticeKind, type Overall, type Profile } from '@/lib/lattices';

/* THE PRINT WINDOW of a kind: every (cell, wall) pair in mm checked against the chosen process — the same pure
   evaluate() the explorer uses, nothing of its own. The wall and the cell depend on each other: the passport is read
   at τ = wall / cell, the limits are in mm, the reach at the process's layer over the cell; so the window is a shape,
   not a box. A point is within (every criterion within), outside (one fails), unknown (none fails, one lacks data) or
   has no passport row (τ outside the kind's range). Status is carried by texture and words too, never by colour alone. */

type T = Dict['latticesPage'];
type Cellv = Overall | 'none';

const X0 = 1; // cell, mm
const X1 = 20;
const DX = 0.25;
const Y0 = 0.05; // wall, mm
const Y1 = 3;
const DY = 0.05;

// the plot's margins, in px: the viewBox follows the figure's width, so text and marks keep their size on a phone
const M = { l: 54, r: 12, t: 10, b: 44 };

const FILL: Record<Cellv, string> = {
  within: 'url(#lw-within)',
  unknown: 'url(#lw-unknown)',
  outside: 'url(#lw-outside)',
  none: 'transparent',
};

export function LatticeWindow({
  kind,
  profile,
  build,
  cellMm,
  wallMm,
  locale,
  t,
  onPick,
}: {
  kind: LatticeKind;
  profile: Profile;
  build: BuildName | undefined;
  cellMm: number | null;
  wallMm: number | null;
  locale: Locale;
  t: T;
  onPick: (cell: number, wall: number) => void;
}) {
  const w = t.window;
  const uid = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(320, Math.min(760, Math.round(e.contentRect.width)))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = Math.max(300, Math.round(W * 0.56));
  const nx = Math.round((X1 - X0) / DX) + 1;
  const ny = Math.round((Y1 - Y0) / DY) + 1;
  // every square of the grid: the WORST verdict of its four corners (a green square holds no failing point at its
  // corners, so the map never looks better than the check), with the criteria that held them back
  const grid = useMemo(() => {
    type P = { v: Cellv; fail: string[]; unknown: string[] };
    const at = (cell: number, wall: number): P => {
      const tau = wall / cell;
      if (wall <= 0 || tau < kind.tau_min - 1e-9 || tau > kind.tau_max + 1e-9) return { v: 'none', fail: [], unknown: [] };
      const v = evaluate(kind, tau, cell, profile, build).verdict;
      return v
        ? { v: v.overall, fail: v.criteria.filter((c) => c.status === 'fail').map((c) => c.key), unknown: v.criteria.filter((c) => c.status === 'unknown').map((c) => c.key) }
        : { v: 'none', fail: [], unknown: [] };
    };
    const corners: P[] = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) corners.push(at(X0 + (i - 0.5) * DX, Y0 + (j - 0.5) * DY));
    const RANK: Record<Cellv, number> = { none: 0, within: 1, unknown: 2, outside: 3 };
    const out: P[] = [];
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const four = [corners[j * (nx + 1) + i], corners[j * (nx + 1) + i + 1], corners[(j + 1) * (nx + 1) + i], corners[(j + 1) * (nx + 1) + i + 1]];
        const worst = four.reduce((a, b) => (RANK[b.v] > RANK[a.v] ? b : a));
        out.push({ v: worst.v, fail: [...new Set(four.flatMap((x) => x.fail))], unknown: [...new Set(four.flatMap((x) => x.unknown))] });
      }
    }
    return out;
  }, [kind, profile, build, nx, ny]);
  // the same window as text, for every other cell size: the wall ranges in mm of each verdict
  const columns = useMemo(() => {
    const out: { cell: number; runs: Record<'within' | 'unknown' | 'outside', string[]> }[] = [];
    const fmt = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    for (let cell = 2; cell <= X1; cell += 2) {
      const i = Math.round((cell - X0) / DX);
      const runs: Record<'within' | 'unknown' | 'outside', string[]> = { within: [], unknown: [], outside: [] };
      let j = 0;
      while (j < ny) {
        const v = grid[j * nx + i].v;
        let k = j + 1;
        while (k < ny && grid[k * nx + i].v === v) k++;
        if (v !== 'none') runs[v].push(`${fmt(Math.max(Y0 + (j - 0.5) * DY, 0))}–${fmt(Y0 + (k - 0.5) * DY)}`);
        j = k;
      }
      out.push({ cell, runs });
    }
    return out;
  }, [grid, nx, ny, locale]);

  const sx = (cell: number) => M.l + ((cell - X0 + DX / 2) / (X1 - X0 + DX)) * (W - M.l - M.r);
  const sy = (wall: number) => H - M.b - ((wall - Y0 + DY / 2) / (Y1 - Y0 + DY)) * (H - M.t - M.b);
  const cw = (W - M.l - M.r) / nx;
  const ch = (H - M.t - M.b) / ny;
  const num = (v: number, d: number) => v.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });

  const svgRef = useRef<SVGSVGElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [tipW, setTipW] = useState(200);
  const [hover, setHover] = useState<{ i: number; j: number } | null>(null);
  useEffect(() => {
    if (hover && tipRef.current) setTipW(tipRef.current.offsetWidth);
  }, [hover]);
  const at = (e: React.MouseEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    const i = Math.floor((x - M.l) / cw);
    const j = Math.floor((H - M.b - y) / ch);
    return i >= 0 && i < nx && j >= 0 && j < ny ? { i, j } : null;
  };

  const counts = useMemo(() => {
    const c: Record<Cellv, number> = { within: 0, unknown: 0, outside: 0, none: 0 };
    for (const g of grid) c[g.v]++;
    return c;
  }, [grid]);

  const tip = hover ? grid[hover.j * nx + hover.i] : null;
  const hc = hover ? X0 + hover.i * DX : 0;
  const hw = hover ? Y0 + hover.j * DY : 0;
  const names = (keys: string[]) => keys.map((k) => t.verdict.criteria[k as keyof T['verdict']['criteria']]).join(', ');
  const xt = W < 480 ? [4, 8, 12, 16, 20] : [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
  const yt = [0.5, 1, 1.5, 2, 2.5, 3];
  const here = cellMm !== null && wallMm !== null && cellMm >= X0 && cellMm <= X1 && wallMm >= Y0 && wallMm <= Y1 ? { x: sx(cellMm), y: sy(wallMm) } : null;
  const legend: [Cellv, string][] = [
    ['within', t.verdict.overall.within],
    ['unknown', t.verdict.overall.unknown],
    ['outside', t.verdict.overall.outside],
    ['none', w.none],
  ];

  return (
    <figure className="mt-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-on-ink-muted" aria-hidden="true">
        {legend.map(([k, label]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 14 14" className="size-3.5">
              <rect x="0.5" y="0.5" width="13" height="13" rx="2" fill={FILL[k]} stroke="#3a4350" />
            </svg>
            {label}
          </span>
        ))}
      </div>
      <div ref={boxRef} className="relative mt-2">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full touch-pan-y select-none" role="img" aria-label={w.aria} aria-describedby={`${uid}-table`}>
          <defs>
            <pattern id="lw-within" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#c4ff4d" fillOpacity="0.55" />
            </pattern>
            <pattern id="lw-unknown" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#ffb648" fillOpacity="0.16" />
              <rect width="2.2" height="6" fill="#ffb648" fillOpacity="0.75" />
            </pattern>
            <pattern id="lw-outside" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#ff6b5b" fillOpacity="0.22" />
              <circle cx="3" cy="3" r="1.2" fill="#ff6b5b" fillOpacity="0.85" />
            </pattern>
          </defs>
          {/* the grid of verdicts; runs of one verdict along a row are one rect */}
          {Array.from({ length: ny }, (_, j) => {
            const rects: React.ReactNode[] = [];
            let i = 0;
            while (i < nx) {
              const v = grid[j * nx + i].v;
              let k = i + 1;
              while (k < nx && grid[j * nx + k].v === v) k++;
              if (v !== 'none') rects.push(<rect key={`${j}-${i}`} x={M.l + i * cw} y={H - M.b - (j + 1) * ch} width={(k - i) * cw + 0.2} height={ch + 0.2} fill={FILL[v]} />);
              i = k;
            }
            return rects;
          })}
          {/* axes: recessive */}
          <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} stroke="#3a4350" />
          <line x1={M.l} x2={M.l} y1={M.t} y2={H - M.b} stroke="#3a4350" />
          {xt.map((x) => (
            <g key={`x${x}`}>
              <line x1={sx(x)} x2={sx(x)} y1={H - M.b} y2={H - M.b + 4} stroke="#3a4350" />
              <text x={sx(x)} y={H - M.b + 17} textAnchor="middle" fontSize="11" fill="#8d99aa">
                {x}
              </text>
            </g>
          ))}
          {yt.map((y) => (
            <g key={`y${y}`}>
              <line x1={M.l - 4} x2={M.l} y1={sy(y)} y2={sy(y)} stroke="#3a4350" />
              <text x={M.l - 7} y={sy(y) + 3.5} textAnchor="end" fontSize="11" fill="#8d99aa">
                {num(y, 1)}
              </text>
            </g>
          ))}
          <text x={(M.l + W - M.r) / 2} y={H - 6} textAnchor="middle" fontSize="12" fill="#c9d1db">
            {w.x}
          </text>
          <text transform={`translate(13 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="#c9d1db">
            {w.y}
          </text>
          {here ? (
            <g pointerEvents="none">
              <circle cx={here.x} cy={here.y} r="7" fill="none" stroke="#0d1117" strokeWidth="4" />
              <circle cx={here.x} cy={here.y} r="7" fill="none" stroke="#ffffff" strokeWidth="2" />
            </g>
          ) : null}
          {hover ? <rect x={M.l + hover.i * cw} y={H - M.b - (hover.j + 1) * ch} width={cw} height={ch} fill="none" stroke="#ffffff" strokeWidth="1.5" pointerEvents="none" /> : null}
          <rect
            x={M.l}
            y={M.t}
            width={W - M.l - M.r}
            height={H - M.t - M.b}
            fill="transparent"
            className="cursor-crosshair"
            onPointerMove={(e) => setHover(at(e))}
            onPointerLeave={() => setHover(null)}
            onPointerCancel={() => setHover(null)}
            onClick={(e) => {
              const p = at(e);
              if (p && grid[p.j * nx + p.i].v !== 'none') onPick(X0 + p.i * DX, Y0 + p.j * DY);
            }}
          />
        </svg>
        {tip && hover ? (
          <div
            ref={tipRef}
            className="pointer-events-none absolute z-10 w-max max-w-[min(18rem,100%)] rounded-lg border border-hairline-ink-strong bg-ink/95 px-3 py-2 text-[12.5px] leading-snug text-on-ink shadow-lg"
            style={{ left: `${(Math.max(0, Math.min(sx(hc), W - tipW)) / W) * 100}%`, top: `${(Math.max(sy(hw) - 70, 0) / H) * 100}%` }}
          >
            <p className="font-mono">{w.tip.replace('{cell}', num(hc, 2)).replace('{wall}', num(hw, 2)).replace('{tau}', num(hw / hc, 3))}</p>
            <p className="mt-0.5 font-medium">{tip.v === 'none' ? w.none : t.verdict.overall[tip.v]}</p>
            {tip.fail.length ? <p className="text-on-ink-muted">{w.failed.replace('{list}', names(tip.fail))}</p> : null}
            {tip.unknown.length ? <p className="text-on-ink-muted">{w.unknownBy.replace('{list}', names(tip.unknown))}</p> : null}
          </div>
        ) : null}
      </div>
      <details id={`${uid}-table`} className="mt-3 text-[12.5px] text-on-ink-muted">
        <summary className="cursor-pointer text-on-ink hover:text-signal">{w.tableTitle}</summary>
        <div role="region" aria-label={w.tableTitle} tabIndex={0} className="mt-2 overflow-x-auto rounded-lg border border-hairline-ink-strong focus-visible:outline-2 focus-visible:outline-signal">
          <table className="w-full text-left text-[12.5px]">
            <thead className="bg-ink-2/80">
              <tr>
                {[w.x, t.verdict.overall.within, t.verdict.overall.unknown, t.verdict.overall.outside].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {columns.map((c) => (
                <tr key={c.cell} className="border-t border-hairline-ink">
                  <th scope="row" className="px-3 py-1.5 font-mono font-normal text-on-ink">
                    {c.cell}
                  </th>
                  {(['within', 'unknown', 'outside'] as const).map((k) => (
                    <td key={k} className="px-3 py-1.5 font-mono">
                      {c.runs[k].length ? c.runs[k].join(', ') : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5">{w.tableNote}</p>
      </details>
      <figcaption className="mt-2 text-[12.5px] leading-snug text-on-ink-muted">
        {w.caption
          .replace('{within}', String(counts.within))
          .replace('{unknown}', String(counts.unknown))
          .replace('{outside}', String(counts.outside))
          .replace('{build}', build ? `${build}` : w.bestEach)}
      </figcaption>
    </figure>
  );
}
