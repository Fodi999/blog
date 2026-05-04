'use client';

/**
 * SimulationWorkspace — Blender-style timeline + integrated Lab (Photo → 3D).
 *
 * Tabs:
 *   Forecast — same 3D scene driven by virtual clock (DAY 0..+14)
 *   Lab      — Photo → 3D model generator (embedded LaboratoryClient)
 */

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, ChevronFirst, ChevronLast,
  FlaskConical, TrendingUp,
} from 'lucide-react';

import type { InventoryItem } from '@/lib/chefos-types';
import { buildInventoryScene } from '@/components/visual/builders/inventorySceneBuilder';
import type { SceneState } from '@/components/visual/sceneTypes';
import {
  type SpawnShape,
  type SceneObject,
  type ShapeParams,
  type GeometryOpCommand,
  type SelectionMode,
  buildShapeUrl,
} from '@/components/workspace/WorkspaceCommands';
import { useGeometryOrchestrator } from '@/hooks/useGeometryOrchestrator';
// NOTE: studio CAD overlay (GizmoLayer / ToolHandleLayer / useStudioStore)
// has been removed along with /app/scene. SimulationWorkspace now ships
// without a Plasticity-style sub-element gizmo layer.
const GizmoLayer = () => null;
const ToolHandleLayer = () => null;

const VisualSceneRenderer = dynamic(
  () => import('@/components/visual/VisualSceneRenderer').then((m) => m.VisualSceneRenderer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#070707] text-sm text-white/40">
        loading simulation engine…
      </div>
    ),
  },
);

const ModelViewer = dynamic(
  () => import('@/app/[locale]/app/laboratory/_components/ModelViewer').then((m) => m.ModelViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#070707] text-sm text-white/40">
        loading 3D viewer…
      </div>
    ),
  },
);

// GLB URLs — use env override or Koyeb production URL
const KOYEB_GLB_URL = 'https://ministerial-yetta-fodi999-c58d8823.koyeb.app/api/laboratory/debug-glb';
const BASE_URL =
  `${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://ministerial-yetta-fodi999-c58d8823.koyeb.app'}/api/laboratory/debug-glb`;

type SurfaceType = 'sci_fi_card' | 'organic_sphere';

const SURFACE_TYPES: { key: SurfaceType; label: string; sub: string; icon: string }[] = [
  { key: 'sci_fi_card',     label: 'Hard Surface', sub: 'Plasticity · sci_fi_card', icon: '⬛' },
  { key: 'organic_sphere',  label: 'Organic',      sub: 'ZBrush · organic_sphere',  icon: '⚫' },
];

// ── Simulation logic ─────────────────────────────────────────────────────────

const SIM_DAYS = 14;

/** Apply virtual +days to items: accelerate severity degradation. */
function applySimDay(items: InventoryItem[], day: number): InventoryItem[] {
  if (day === 0) return items;
  const now = Date.now();
  return items.map((item) => {
    // Items without expires_at don't change
    if (!item.expires_at) return item;
    const msPerDay = 86_400_000;
    const realDaysLeft = (new Date(item.expires_at).getTime() - now) / msPerDay;
    const futureExpiry = realDaysLeft - day;
    let severity: InventoryItem['severity'];
    if (futureExpiry < 0) severity = 'expired';
    else if (futureExpiry <= 2) severity = 'critical';
    else if (futureExpiry <= 5) severity = 'warning';
    else severity = 'ok';

    // Consumption simulation: -2% per day
    const consumptionFactor = Math.max(0, 1 - day * 0.02);
    return {
      ...item,
      severity,
      remaining_quantity: Math.max(0, +(item.remaining_quantity * consumptionFactor).toFixed(2)),
    };
  });
}

// ── Playback hook ─────────────────────────────────────────────────────────────

const SPEEDS = [0.5, 1, 2, 4] as const;
type Speed = typeof SPEEDS[number];

function useSimClock(totalDays: number) {
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const accRef = useRef<number>(0); // accumulated ms

  const MS_PER_DAY = 1200; // 1 day = 1.2s at 1×

  const tick = useCallback(
    (ts: number) => {
      const delta = ts - lastRef.current;
      lastRef.current = ts;
      accRef.current += delta * speed;
      if (accRef.current >= MS_PER_DAY) {
        const steps = Math.floor(accRef.current / MS_PER_DAY);
        accRef.current -= steps * MS_PER_DAY;
        setDay((d) => {
          const next = d + steps;
          if (next >= totalDays) {
            setPlaying(false);
            return totalDays;
          }
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [speed, totalDays],
  );

  useEffect(() => {
    if (playing) {
      lastRef.current = performance.now();
      accRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, tick]);

  const play = () => { if (day >= totalDays) setDay(0); setPlaying(true); };
  const pause = () => setPlaying(false);
  const jump = (d: number) => { setDay(Math.max(0, Math.min(totalDays, d))); };

  return { day, playing, speed, setSpeed, play, pause, jump };
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Alias kept for prop-name backwards compatibility. The viewport now operates
 *  on full `SceneObject`s with transform / shape params / material. */
type SpawnedShape = SceneObject;

interface Props {
  items: InventoryItem[];
  /** Controlled tab — if provided, header is hidden and parent controls tabs */
  activeTab?: 'forecast' | 'lab';
  /** Lifted state from parent so shapes survive tab switches */
  spawnedShapes?: SpawnedShape[];
  onSetSpawnedShapes?: Dispatch<SetStateAction<SpawnedShape[]>>;
  /** Per-object patch dispatcher (inspector / future AI commands). */
  onUpdateObject?: (id: string, patch: Partial<SceneObject>) => void;
  /** Currently-selected scene object id (drives selection outline). */
  selectedId?: string | null;
  /** Click on a viewport card → notify parent. */
  onSelectObject?: (id: string | null) => void;
  /** Active transform tool — passed only to the selected card's viewport. */
  transformMode?: 'select' | 'translate' | 'rotate' | 'scale';
  /** Called by the gizmo when the user releases a drag. Patches `obj.transform`. */
  onCommitTransform?: (
    id: string,
    transform: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] },
  ) => void;
  /** CSG geometry operations dispatched by Gemini */
  pendingGeoOps?: GeometryOpCommand[];
  /** Sub-object selection mode (object / face / edge / vertex). */
  selectionMode?: SelectionMode;
}

export function SimulationWorkspace({
  items,
  activeTab,
  spawnedShapes: externalShapes,
  onSetSpawnedShapes,
  onUpdateObject,
  selectedId,
  onSelectObject,
  transformMode = 'select',
  onCommitTransform,
  pendingGeoOps = [],
  selectionMode = 'object',
}: Props) {
  const { day, playing, speed, setSpeed, play, pause, jump } = useSimClock(SIM_DAYS);
  const [internalTab, setInternalTab] = useState<'forecast' | 'lab'>('forecast');
  const tab = activeTab ?? internalTab;
  const setTab = (t: 'forecast' | 'lab') => { if (!activeTab) setInternalTab(t); };
  const [surfaceType, setSurfaceType] = useState<SurfaceType>('sci_fi_card');

  // ── Read selectionMode from store (overrides stale prop from parent) ──────
  // StudioSelectionBar writes to the store; we must read from the same source.
  // Falls back to the prop value if the store isn't mounted.
  const activeSelectionMode = selectionMode;

  // Use lifted state if provided, otherwise own local state
  const [localShapes, setLocalShapes] = useState<SpawnedShape[]>([]);
  const spawnedShapes = externalShapes ?? localShapes;
  const setSpawnedShapes = onSetSpawnedShapes ?? setLocalShapes;

  const labGlbUrl = `${BASE_URL}/${surfaceType}`;

  const simItems = useMemo(() => applySimDay(items, day), [items, day]);

  const scene: SceneState = useMemo(
    () => buildInventoryScene(simItems, {}),
    [simItems],
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#070707]">
      {/* ── Header (only when not controlled externally) ── */}
      {!activeTab && (
        <div className="flex shrink-0 items-center gap-4 border-b border-white/8 px-5 py-3">
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setTab('forecast')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                tab === 'forecast' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <TrendingUp className="h-3 w-3" />
              Forecast
            </button>
            <button
              type="button"
              onClick={() => setTab('lab')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                tab === 'lab' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <FlaskConical className="h-3 w-3" />
              Lab
            </button>
          </div>
        </div>
      )}

      {/* ── Tab content ── */}
      {tab === 'lab' ? (
        <div className="relative flex h-full w-full overflow-hidden bg-[#070707]">

          {/* ── Main viewport — objects come from Copilot only ── */}
          <div className="relative flex flex-1 flex-col overflow-hidden">
            {spawnedShapes.length === 0 && pendingGeoOps.length === 0 ? (
              /* Empty scene — Blender-style hint */
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/4">
                  <FlaskConical className="h-7 w-7 text-white/15" />
                </div>
                <p className="text-xs text-white/20">
                  Ask Copilot to create a shape
                </p>
                <p className="font-mono text-[10px] text-white/10">
                  "создай куб" · "нарисуй круг" · "create triangle"
                </p>
              </div>
            ) : spawnedShapes.length === 1 ? (
              /* Single object — full viewport, like Blender default cube */
              <div className="absolute inset-0">
                <LabShapeCard
                  key={spawnedShapes[0].id}
                  obj={spawnedShapes[0]}
                  selected={selectedId === spawnedShapes[0].id}
                  onSelect={() => onSelectObject?.(spawnedShapes[0].id)}
                  onUpdate={(patch) => onUpdateObject?.(spawnedShapes[0].id, patch)}
                  transformMode={selectedId === spawnedShapes[0].id ? transformMode : 'select'}
                  onCommitTransform={(t) => onCommitTransform?.(spawnedShapes[0].id, t)}
                  selectionMode={activeSelectionMode}
                  fullscreen
                  onRemove={() => setSpawnedShapes([])}
                />
              </div>
            ) : (
              /* Multi-object — Blender-style split viewport, each fills its cell */
              <div
                className="grid h-full w-full"
                style={{
                  gridTemplateColumns: spawnedShapes.length <= 2 ? `repeat(${spawnedShapes.length}, 1fr)` : 'repeat(2, 1fr)',
                  gridTemplateRows: spawnedShapes.length <= 2 ? '1fr' : `repeat(${Math.ceil(spawnedShapes.length / 2)}, 1fr)`,
                }}
              >
                {spawnedShapes.map((s) => (
                  <div key={s.id} className="relative min-h-0 border border-white/5">
                    <LabShapeCard
                      obj={s}
                      selected={selectedId === s.id}
                      onSelect={() => onSelectObject?.(s.id)}
                      onUpdate={(patch) => onUpdateObject?.(s.id, patch)}
                      fullscreen
                      selectionMode={activeSelectionMode}
                      onRemove={() =>
                        setSpawnedShapes((prev) => prev.filter((x) => x.id !== s.id))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {/* ── CSG Geometry ops from Gemini ── */}
            {pendingGeoOps.length > 0 && spawnedShapes.length === 0 && (
              pendingGeoOps.length === 1 ? (
                <div className="absolute inset-0">
                  <GeoOpCard op={pendingGeoOps[0]} fullscreen />
                </div>
              ) : (
                <div
                  className="grid h-full w-full"
                  style={{
                    gridTemplateColumns: pendingGeoOps.length <= 2 ? `repeat(${pendingGeoOps.length}, 1fr)` : 'repeat(2, 1fr)',
                    gridTemplateRows: pendingGeoOps.length <= 2 ? '1fr' : `repeat(${Math.ceil(pendingGeoOps.length / 2)}, 1fr)`,
                  }}
                >
                  {pendingGeoOps.map((op, i) => (
                    <div key={i} className="relative min-h-0 border border-white/5">
                      <GeoOpCard op={op} fullscreen />
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Object count badge + clear — bottom-left */}
            {spawnedShapes.length > 0 && (
              <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/60 px-2 py-0.5 font-mono text-[9px] text-white/25 backdrop-blur-sm">
                  {spawnedShapes.length} object{spawnedShapes.length !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  title="Clear scene"
                  onClick={() => setSpawnedShapes([])}
                  className="pointer-events-auto rounded-full border border-white/10 bg-black/60 px-2 py-0.5 font-mono text-[9px] text-rose-400/50 backdrop-blur-sm transition-colors hover:text-rose-400"
                >
                  clear
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ── 3D Scene ── */}
          <div className="relative flex-1 overflow-hidden">
            <VisualSceneRenderer scene={scene} selectedEntityId={null} onSelectEntity={() => {}} />

            {/* Day badge overlay */}
            {playing && (
              <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2">
                <div className="rounded-full border border-white/15 bg-[#080a0f]/90 px-4 py-1.5 text-xs font-mono font-semibold text-white/70 backdrop-blur-sm">
                  DAY +{day} / +{SIM_DAYS}
                </div>
              </div>
            )}
          </div>

          {/* ── Timeline / Playback bar ── */}
          <div className="shrink-0 border-t border-white/8 bg-[#080a0f] px-5 py-3">
            {/* Scrubber */}
            <div className="mb-3 flex items-center gap-3">
              <span className="w-10 text-right font-mono text-[10px] text-white/40">+{day}d</span>
              <div className="relative flex-1">
                {/* Track */}
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all"
                    style={{ width: `${(day / SIM_DAYS) * 100}%` }}
                  />
                </div>
                {/* Day markers */}
                <div className="absolute top-0 flex w-full justify-between px-0">
                  {Array.from({ length: SIM_DAYS + 1 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => jump(i)}
                      className={`-mt-1 h-3 w-px rounded-full transition-all ${
                        i === day ? 'bg-white scale-y-150' : 'bg-white/20 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                {/* Clickable overlay */}
                <input
                  type="range"
                  min={0}
                  max={SIM_DAYS}
                  value={day}
                  onChange={(e) => jump(Number(e.target.value))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
              <span className="w-10 font-mono text-[10px] text-white/40">+{SIM_DAYS}d</span>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between">
              {/* Transport */}
              <div className="flex items-center gap-1">
                <SimBtn icon={ChevronFirst} label="Jump to start" onClick={() => jump(0)} />
                <SimBtn icon={SkipBack} label="−1 day" onClick={() => jump(day - 1)} />
                <button
                  type="button"
                  onClick={playing ? pause : play}
                  title={playing ? 'Pause' : 'Play'}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <SimBtn icon={SkipForward} label="+1 day" onClick={() => jump(day + 1)} />
                <SimBtn icon={ChevronLast} label="Jump to end" onClick={() => jump(SIM_DAYS)} />
              </div>

              {/* Speed selector */}
              <div className="flex items-center gap-1">
                <span className="mr-1 text-[10px] uppercase tracking-widest text-white/30">Speed</span>
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                      speed === s
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'text-white/35 hover:text-white/60'
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>

              {/* Frame info */}
              <div className="text-right font-mono text-[10px] text-white/25">
                FRAME {day * 24} / {SIM_DAYS * 24}h
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SimBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

// ── Lab shape card — real 3D GLB from backend ────────────────────────────────
//
// URL building + slug map now live in WorkspaceCommands (`buildShapeUrl`).
// LabShapeCard reads everything from the SceneObject passed in via props.
// Wire / selection / hover overlays are rendered inside the GLB scene graph
// by `<ModelViewer>` itself (real THREE.EdgesGeometry, not a CSS stand-in).

function LabShapeCard({
  obj,
  fullscreen = false,
  onRemove,
  onUpdate,
  selected = false,
  onSelect,
  transformMode = 'select',
  onCommitTransform,
  selectionMode = 'object',
}: {
  /** Full parametric scene object — single source of truth for params. */
  obj: SceneObject;
  /** Fill the parent container (single-object viewport mode). */
  fullscreen?: boolean;
  onRemove: () => void;
  /** Patch dispatcher — emits partial SceneObject changes upward. */
  onUpdate?: (patch: Partial<SceneObject>) => void;
  /** Selection outline state. */
  selected?: boolean;
  /** Click on the viewport notifies the parent which object was picked. */
  onSelect?: () => void;
  /** Active transform tool — drives the in-canvas gizmo. */
  transformMode?: 'select' | 'translate' | 'rotate' | 'scale';
  /** Gizmo drag-end → write back to obj.transform. */
  onCommitTransform?: (t: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }) => void;
  /** Sub-object picking mode. */
  selectionMode?: SelectionMode;
}) {
  const { kind: shape, label, shape: shapeParams, material } = obj;
  const color = material.color_hex;
  const [rotating, setRotating] = useState(false);
  const [hovered, setHovered] = useState(false);
  /** Solid / wireframe / both — display mode for the viewport. */
  const [viewMode, setViewMode] = useState<'solid' | 'wire' | 'solid-wire'>('solid');

  // ── Read selectionMode from store so LabShapeCard always reflects live tool state ──
  const activeSelectionMode = selectionMode;

  // ── Mesh density labels (cube only) ───────────────────────────────────────
  const SUB_MIN = 1;
  const SUB_MAX = 5;
  const SUB_LABELS: Record<number, string> = { 1: 'Draft', 2: 'Std', 3: 'High', 4: 'Dense', 5: 'Ultra' };
  const SUB_TRIS:  Record<number, number>  = { 1: 12, 2: 48, 3: 108, 4: 192, 5: 300 };

  /** Patch the shape-params slice. Caller spreads onto existing shape. */
  const patchShape = useCallback(
    (next: Partial<ShapeParams>) => {
      if (!onUpdate) return;
      // The discriminated-union spread is safe because we only ever patch
      // fields that exist on the current `obj.shape.kind`.
      onUpdate({ shape: { ...obj.shape, ...next } as ShapeParams });
    },
    [obj.shape, onUpdate],
  );

  // Build GLB URL from the scene object — pure, deterministic.
  const glbUrl = useMemo(() => buildShapeUrl(obj), [obj]);

  // ── Mesh density toolbar (cube only) ──────────────────────────────────────
  const MeshControls = () => {
    if (shapeParams.kind !== 'cube') return null;
    const subdivisions = shapeParams.subdivisions;
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={subdivisions <= SUB_MIN}
          onClick={() => patchShape({ subdivisions: Math.max(SUB_MIN, subdivisions - 1) })}
          title="Decrease mesh density"
          className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/4 font-mono text-[13px] text-white/50 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >−</button>
        <div
          title="Mesh density"
          className="flex h-6 min-w-[64px] items-center justify-center gap-1 rounded-md border border-white/10 bg-white/4 px-2 font-mono text-[9px] font-semibold uppercase tracking-wider text-white/45"
        >
          <span className="text-[10px]">⬡</span>
          {SUB_LABELS[subdivisions]} · {SUB_TRIS[subdivisions]}▲
        </div>
        <button
          type="button"
          disabled={subdivisions >= SUB_MAX}
          onClick={() => patchShape({ subdivisions: Math.min(SUB_MAX, subdivisions + 1) })}
          title="Increase mesh density"
          className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/4 font-mono text-[13px] text-white/50 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >+</button>
      </div>
    );
  };

  // ── Parametric stepper for cylinder/cone/torus dimensions ─────────────────
  const NumStepper = ({
    label: stepLabel, value, min, max, step, fmt = (v: number) => v.toFixed(2), onChange,
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    fmt?: (v: number) => string;
    onChange: (v: number) => void;
  }) => (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        disabled={value <= min + 1e-6}
        onClick={() => onChange(Math.max(min, +(value - step).toFixed(3)))}
        className="flex h-6 w-5 items-center justify-center rounded-l-md border border-white/10 bg-white/4 font-mono text-[12px] text-white/50 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >−</button>
      <span className="flex h-6 min-w-[58px] items-center justify-center gap-1 border-y border-white/10 bg-white/4 px-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-white/55">
        <span className="text-white/35">{stepLabel}</span>
        <span style={{ color }}>{fmt(value)}</span>
      </span>
      <button
        type="button"
        disabled={value >= max - 1e-6}
        onClick={() => onChange(Math.min(max, +(value + step).toFixed(3)))}
        className="flex h-6 w-5 items-center justify-center rounded-r-md border border-white/10 bg-white/4 font-mono text-[12px] text-white/50 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >+</button>
    </div>
  );

  // Per-shape inspector — reads params straight from `obj.shape`.
  const ShapeControls = () => {
    if (shapeParams.kind === 'cube') return <MeshControls />;
    if (shapeParams.kind === 'cylinder') {
      return (
        <div className="flex items-center gap-1">
          <NumStepper label="R" value={shapeParams.radius} min={0.1} max={1.0} step={0.05}
            onChange={(v) => patchShape({ radius: v })} />
          <NumStepper label="H" value={shapeParams.height} min={0.2} max={2.0} step={0.1}
            onChange={(v) => patchShape({ height: v })} />
        </div>
      );
    }
    if (shapeParams.kind === 'cone') {
      return (
        <div className="flex items-center gap-1">
          <NumStepper label="R0" value={shapeParams.radius}     min={0.1} max={1.0} step={0.05}
            onChange={(v) => patchShape({ radius: v })} />
          <NumStepper label="R1" value={shapeParams.radius_top} min={0.0} max={1.0} step={0.05}
            onChange={(v) => patchShape({ radius_top: v })} />
          <NumStepper label="H"  value={shapeParams.height}     min={0.2} max={2.0} step={0.1}
            onChange={(v) => patchShape({ height: v })} />
        </div>
      );
    }
    if (shapeParams.kind === 'torus') {
      // minor must stay strictly less than major.
      const maxMinor = Math.max(0.05, shapeParams.major_radius - 0.05);
      return (
        <div className="flex items-center gap-1">
          <NumStepper label="R" value={shapeParams.major_radius} min={0.2} max={1.0} step={0.05}
            onChange={(v) => {
              const nextMinor = shapeParams.minor_radius >= v - 0.05
                ? Math.max(0.05, v - 0.1)
                : shapeParams.minor_radius;
              patchShape({ major_radius: v, minor_radius: nextMinor });
            }} />
          <NumStepper label="r" value={shapeParams.minor_radius} min={0.05} max={maxMinor} step={0.025}
            onChange={(v) => patchShape({ minor_radius: v })} />
        </div>
      );
    }
    return null;
  };

  const hasShapeControls = ['cube', 'cylinder', 'cone', 'torus'].includes(shape);

  if (fullscreen) {
    return (
      <div className="flex h-full w-full flex-col">
        {/* 3D viewport fills remaining space */}
        <div
          className="relative flex-1 overflow-hidden"
          onClick={onSelect}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <ModelViewer
            modelUrl={glbUrl}
            className="h-full w-full"
            displayMode="grid"
            lightingPreset="cleanProduct"
            autoRotate={rotating && !(selected && transformMode !== 'select')}
            renderQuality="hd"
            snapToFloor
            viewMode={viewMode}
            selected={selected}
            hovered={hovered}
            transform={obj.transform}
            transformMode={transformMode}
            onCommitTransform={onCommitTransform}
            shapeColor={color}
            selectionMode={activeSelectionMode}
            canvasChildren={<><ToolHandleLayer /><GizmoLayer /></>}
          />
          {/* Label bottom-left overlay */}
          <div className="pointer-events-none absolute bottom-3 left-3">
            <span
              className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur-sm"
              style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
            >
              {label}
            </span>
          </div>
        </div>

        {/* ── Fixed bottom toolbar ── */}
        <div className="shrink-0 flex items-center justify-between border-t border-white/8 bg-[#0a0a0a] px-4 py-2">
          {/* Left: object name */}
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/25">{label}</span>

          {/* Center: shape parameters + rotate + view mode */}
          <div className="flex items-center gap-2">
            {hasShapeControls && <ShapeControls />}
            <div className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/4 p-1">
              <button
                type="button"
                onClick={() => setRotating(false)}
                title="Freeze"
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium transition-colors ${!rotating ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/70'}`}
              >
                <span>⏹</span> Static
              </button>
              <button
                type="button"
                onClick={() => setRotating(true)}
                title="Auto-rotate"
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium transition-colors ${rotating ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/70'}`}
              >
                <span>↻</span> Rotate
              </button>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/4 p-1">
              {(['solid', 'solid-wire', 'wire'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setViewMode(m)}
                  title={m === 'solid' ? 'Solid' : m === 'wire' ? 'Wireframe' : 'Solid + wire'}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors ${viewMode === m ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/70'}`}
                >
                  {m === 'solid' ? 'S' : m === 'wire' ? 'W' : 'S+W'}
                </button>
              ))}
            </div>
          </div>

          {/* Right: remove */}
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md px-2 py-1 text-[11px] text-rose-400/40 transition-colors hover:text-rose-400"
            title="Remove"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative flex flex-col items-center gap-0"
      style={{ filter: `drop-shadow(0 0 20px ${color}44)` }}
    >
      {/* 3D viewport */}
      <div
        className="relative overflow-hidden rounded-t-2xl border-x border-t bg-black/60"
        style={{ borderColor: `${color}40`, width: 200, height: 180 }}
        onClick={onSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <ModelViewer
          modelUrl={glbUrl}
          className="h-full w-full"
          displayMode="grid"
          lightingPreset="cleanProduct"
          autoRotate={rotating && !(selected && transformMode !== 'select')}
          renderQuality="hd"
          snapToFloor
          viewMode={viewMode}
          selected={selected}
          hovered={hovered}
          transform={obj.transform}
          transformMode={transformMode}
          onCommitTransform={onCommitTransform}
          shapeColor={color}
          selectionMode={activeSelectionMode}
        />
      </div>

      {/* ── Toolbar panel ── */}
      <div
        className="flex w-full flex-col gap-1 rounded-b-2xl border border-t-0 bg-[#0d0d0d] px-2 py-1.5"
        style={{ width: 200, borderColor: `${color}40` }}
      >
        {/* Top row: label + rotate + remove */}
        <div className="flex items-center justify-between">
          <span
            className="truncate text-[9px] font-semibold uppercase tracking-widest"
            style={{ color }}
          >
            {label}
          </span>
          <div className="flex items-center gap-0.5 rounded-md border border-white/8 bg-white/4 p-0.5">
            <button
              type="button"
              onClick={() => setRotating(false)}
              title="Static"
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${!rotating ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}
            >⏹</button>
            <button
              type="button"
              onClick={() => setRotating(true)}
              title="Auto-rotate"
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${rotating ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}
            >↻</button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-[10px] text-rose-400/30 transition-colors hover:text-rose-400"
            title="Remove"
          >✕</button>
        </div>
        {/* Bottom row: shape parameters (cube/cylinder/cone/torus) */}
        {hasShapeControls && (
          <div className="flex justify-center">
            <ShapeControls />
          </div>
        )}
      </div>
    </div>
  );
}

// ── GeoOpCard — CSG model from geometry-op endpoint ─────────────────────────

function GeoOpCard({ op, fullscreen = false }: { op: GeometryOpCommand; fullscreen?: boolean }) {
  const { state, executeOp, registerScreenshot } = useGeometryOrchestrator();
  const [rotating, setRotating] = useState(true);

  useEffect(() => {
    void executeOp({
      operation: op.operation,
      target: op.target,
      cutter: op.cutter,
      quality: op.quality,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = op.label ?? `${op.operation}(${op.target.type}, ${op.cutter.type})`;
  const color = op.target.color ?? '#38BDF8';

  if (state.status === 'building') {
    return (
      <div className={`flex items-center justify-center bg-[#0a0a0a] ${fullscreen ? 'h-full w-full' : ''}`}
        style={fullscreen ? undefined : { width: 200, height: 200 }}>
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-white/5 border-t-sky-500/60" />
            <div className="absolute inset-2 animate-spin rounded-full border border-white/5 border-t-sky-400/40" style={{ animationDirection: 'reverse', animationDuration: '1.4s' }} />
            <span className="text-[18px]">⬡</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-mono text-[10px] font-semibold text-white/50">Building geometry</span>
            <span className="font-mono text-[9px] text-white/20">{op.operation} · {op.target.type} − {op.cutter.type}</span>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className={`flex items-center justify-center bg-[#0a0a0a] ${fullscreen ? 'h-full w-full' : ''}`}
        style={fullscreen ? undefined : { width: 200, height: 200 }}>
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">⚠</span>
          <span className="font-mono text-[9px] text-rose-400/60">{state.message}</span>
        </div>
      </div>
    );
  }

  const glbUrl = state.status === 'ready' || state.status === 'reviewing'
    ? (state as { glbUrl: string }).glbUrl
    : null;

  const isReviewing = state.status === 'reviewing';
  const feedback = (state as { feedback?: string }).feedback;

  if (!glbUrl) return null;

  // ── AI Vision overlay (shared between fullscreen and card modes) ──────────
  const VisionOverlay = () => (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      style={{
        background: 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, transparent 50%, rgba(251,191,36,0.04) 100%)',
      }}
    >
      {/* Corner scan brackets */}
      {(['tl','tr','bl','br'] as const).map((corner) => (
        <div
          key={corner}
          className="absolute h-5 w-5"
          style={{
            top: corner.startsWith('t') ? 10 : undefined,
            bottom: corner.startsWith('b') ? 10 : undefined,
            left: corner.endsWith('l') ? 10 : undefined,
            right: corner.endsWith('r') ? 10 : undefined,
            borderTop: corner.startsWith('t') ? '2px solid rgba(251,191,36,0.7)' : undefined,
            borderBottom: corner.startsWith('b') ? '2px solid rgba(251,191,36,0.7)' : undefined,
            borderLeft: corner.endsWith('l') ? '2px solid rgba(251,191,36,0.7)' : undefined,
            borderRight: corner.endsWith('r') ? '2px solid rgba(251,191,36,0.7)' : undefined,
          }}
        />
      ))}

      {/* Horizontal scan line */}
      <div
        className="absolute left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.6) 20%, rgba(255,255,255,0.9) 50%, rgba(251,191,36,0.6) 80%, transparent 100%)',
          animation: 'geoScanLine 2.2s ease-in-out infinite',
          top: '10%',
          boxShadow: '0 0 8px 1px rgba(251,191,36,0.4)',
        }}
      />

      {/* Top-right: eye + label */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-black/60 px-2.5 py-1 backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
        </span>
        <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-amber-300">
          Gemini Vision
        </span>
      </div>

      {/* Feedback text (if Gemini returned a comment) */}
      {feedback && (
        <div className="absolute bottom-12 left-3 right-3 rounded-lg border border-amber-400/20 bg-black/70 px-3 py-2 backdrop-blur-sm">
          <div className="mb-1 flex items-center gap-1">
            <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-amber-400/60">AI feedback</span>
          </div>
          <p className="font-mono text-[9px] leading-relaxed text-white/60 line-clamp-3">{feedback}</p>
        </div>
      )}

      {/* Bottom center: "analysing" status */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-black/50 px-2.5 py-0.5 backdrop-blur-sm">
          <span className="font-mono text-[8px] text-amber-300/50">analysing scene</span>
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block h-1 w-1 rounded-full bg-amber-400/60"
                style={{ animation: `geoDot 1.2s ${i * 0.2}s ease-in-out infinite` }}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="relative flex-1 overflow-hidden">
          <ModelViewer
            modelUrl={glbUrl}
            className="h-full w-full"
            displayMode="grid"
            lightingPreset="cleanProduct"
            autoRotate={rotating}
            renderQuality="hd"
            snapToFloor
            onReady={(api) => { registerScreenshot(() => api.takeScreenshot()); }}
          />
          {isReviewing && <VisionOverlay />}
          <div className="pointer-events-none absolute bottom-3 left-3">
            <span
              className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur-sm"
              style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
            >
              {label}
            </span>
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-between border-t border-white/8 bg-[#0a0a0a] px-4 py-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/25">{label}</span>
          {/* AI status badge in toolbar */}
          {isReviewing ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-400/8 px-3 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
              </span>
              <span className="font-mono text-[10px] font-medium text-amber-300">AI reviewing geometry</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/4 p-1">
              <button type="button" onClick={() => setRotating(true)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium transition-colors ${rotating ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/70'}`}>
                <span>↻</span> Rotate
              </button>
              <button type="button" onClick={() => setRotating(false)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium transition-colors ${!rotating ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/70'}`}>
                <span>⏹</span> Static
              </button>
            </div>
          )}
          <span className="font-mono text-[9px] text-sky-400/40">CSG · {op.operation}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col items-center gap-0"
      style={{ filter: `drop-shadow(0 0 20px ${color}44)` }}>
      <div className="relative overflow-hidden rounded-t-2xl border-x border-t bg-black/60"
        style={{ borderColor: isReviewing ? 'rgba(251,191,36,0.5)' : `${color}40`, width: 200, height: 180, transition: 'border-color 0.4s' }}>
        <ModelViewer
          modelUrl={glbUrl}
          className="h-full w-full"
          displayMode="grid"
          lightingPreset="cleanProduct"
          autoRotate={rotating}
          renderQuality="hd"
          snapToFloor
          onReady={(api) => { registerScreenshot(() => api.takeScreenshot()); }}
        />
        {isReviewing && <VisionOverlay />}
      </div>
      <div className="flex w-full items-center justify-between rounded-b-2xl border border-t-0 bg-[#0d0d0d] px-2 py-1.5"
        style={{ width: 200, borderColor: isReviewing ? 'rgba(251,191,36,0.4)' : `${color}40`, transition: 'border-color 0.4s' }}>
        {isReviewing ? (
          <div className="flex w-full items-center justify-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
            </span>
            <span className="font-mono text-[9px] font-semibold text-amber-300">AI looking…</span>
          </div>
        ) : (
          <>
            <span className="truncate text-[9px] font-semibold uppercase tracking-widest" style={{ color }}>
              {label}
            </span>
            <div className="flex items-center gap-0.5 rounded-md border border-white/8 bg-white/4 p-0.5">
              <button type="button" onClick={() => setRotating(true)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${rotating ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}>↻</button>
              <button type="button" onClick={() => setRotating(false)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${!rotating ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}>⏹</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
