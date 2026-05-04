'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleDot,
  Cone,
  Cylinder,
  Donut,
  Hexagon,
  Layers,
  Maximize2,
  Minimize2,
  Move3D,
  MousePointer2,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RotateCw,
  Scale3D,
  Slash,
  Square,
  Trash2,
  Triangle,
  Wand2,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { SimulationWorkspace } from '@/components/workspace/scenes/SimulationWorkspace';
import { StudioProvider } from '@/components/studio/engine/StudioProvider';
import { StudioSelectionBar, SelectionModeSync } from '@/components/studio/panels/StudioSelectionBar';
import { StudioToolBarLeft } from '@/components/studio/panels/StudioToolBarLeft';
import { ExtrudePanel } from '@/components/studio/panels/ExtrudePanel';
import { StudioBottomBar } from '@/components/studio/panels/StudioBottomBar';
import { CameraViewWidget } from '@/components/studio/viewport/CameraViewWidget';
import {
  useWorkspaceCommand,
  createSceneObject,
  patchSceneObject,
  isSceneDocument,
  SCENE_STORAGE_KEY,
  type SpawnShape,
  type SceneObject,
  type GeometryOpCommand,
  type SelectionMode,
} from '@/components/workspace/WorkspaceCommands';

/** Backwards-compat alias for callers/legacy code. */
export type SpawnedShape = SceneObject;

type PaletteTool = {
  id: string;
  label: string;
  hotkey?: string;
  Icon: LucideIcon;
  color?: string;
  needsSelection?: boolean;
};

type PaletteGroup = {
  id: 'select' | 'solids' | 'wires' | 'modify' | 'boolean';
  label: string;
  tools: PaletteTool[];
};

const PALETTE: PaletteGroup[] = [
  {
    id: 'select',
    label: 'Tool',
    tools: [
      { id: 'pointer',   label: 'Select', hotkey: 'Q', Icon: MousePointer2 },
      { id: 'translate', label: 'Move',   hotkey: 'W', Icon: Move3D,  needsSelection: true },
      { id: 'rotate',    label: 'Rotate', hotkey: 'E', Icon: RotateCw, needsSelection: true },
      { id: 'scale',     label: 'Scale',  hotkey: 'R', Icon: Scale3D, needsSelection: true },
    ],
  },
  {
    id: 'solids',
    label: 'Solids',
    tools: [
      { id: 'cube', label: 'Box', hotkey: 'B', Icon: Box, color: '#38bdf8' },
      { id: 'cylinder', label: 'Cylinder', hotkey: 'C', Icon: Cylinder, color: '#22d3ee' },
      { id: 'cone', label: 'Cone', hotkey: 'N', Icon: Cone, color: '#fb923c' },
      { id: 'torus', label: 'Torus', hotkey: 'T', Icon: Donut, color: '#a78bfa' },
      { id: 'sphere', label: 'Sphere', hotkey: 'S', Icon: CircleDot, color: '#facc15' },
    ],
  },
  {
    id: 'wires',
    label: 'Wires',
    tools: [
      { id: 'square', label: 'Rect', Icon: Square, color: '#a78bfa' },
      { id: 'circle', label: 'Circle', Icon: Circle, color: '#34d399' },
      { id: 'triangle', label: 'Tri', Icon: Triangle, color: '#fb923c' },
    ],
  },
  {
    id: 'modify',
    label: 'Modify',
    tools: [{ id: 'bevel', label: 'Bevel', hotkey: 'F', Icon: Wand2, needsSelection: true }],
  },
  {
    id: 'boolean',
    label: 'Boolean',
    tools: [
      { id: 'subtract', label: 'Subtract', hotkey: '-', Icon: Slash, needsSelection: true },
      { id: 'union', label: 'Union', hotkey: '+', Icon: Plus, needsSelection: true },
    ],
  },
];

const SHAPE_TOOLS: SpawnShape[] = ['cube', 'cylinder', 'cone', 'torus', 'sphere', 'square', 'circle', 'triangle'];

const SHAPE_LABEL: Record<SpawnShape, string> = {
  cube: 'Cube',
  sphere: 'Sphere',
  cylinder: 'Cylinder',
  cone: 'Cone',
  torus: 'Torus',
  square: 'Square',
  rectangle: 'Rectangle',
  circle: 'Circle',
  triangle: 'Triangle',
  line: 'Line',
};

const SHAPE_COLOR: Record<SpawnShape, string> = {
  cube:      '#b0b8c8', // cool steel
  sphere:    '#c8c0b0', // warm steel
  cylinder:  '#a8b4c0', // steel blue
  cone:      '#bab0a8', // steel warm
  torus:     '#b8b0c4', // steel violet
  square:    '#a0acb8',
  rectangle: '#a0acb8',
  circle:    '#a8b8ac', // steel green
  triangle:  '#b8aca0',
  line:      '#94a3b8',
};

const SHAPE_ICON: Record<SpawnShape, LucideIcon> = {
  cube: Box,
  sphere: CircleDot,
  cylinder: Cylinder,
  cone: Cone,
  torus: Donut,
  square: Square,
  rectangle: Square,
  circle: Circle,
  triangle: Triangle,
  line: Slash,
};

export function SceneClient({ locale: _locale }: { locale: string }) {
  const [spawnedShapes, setSpawnedShapes] = useState<SpawnedShape[]>([]);
  const [pendingGeoOps, setPendingGeoOps] = useState<GeometryOpCommand[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [outlinerOpen, setOutlinerOpen] = useState(true);
  const [activeTool, setActiveTool] = useState<string>('pointer');
  const [statusHint, setStatusHint] = useState<string>('Ready');
  /** Plasticity-style selection granularity. */
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('object');
  /** Timestamp of last successful auto-save, or null if unsaved changes are pending. */
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  /** Ref to the debounce timer so we can cancel it on unmount. */
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load from localStorage on first mount ──────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SCENE_STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!isSceneDocument(parsed)) {
        console.warn('[SceneClient] Ignoring invalid scene document in localStorage.');
        return;
      }
      if (parsed.objects.length > 0) {
        setSpawnedShapes(parsed.objects as SpawnedShape[]);
        setSelectedId(parsed.selectedId ?? null);
        setSavedAt(new Date(parsed.updatedAt));
        setStatusHint(`Restored ${parsed.objects.length} object${parsed.objects.length > 1 ? 's' : ''}`);
      }
    } catch {
      // Corrupt JSON — ignore silently, start fresh.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Debounced auto-save whenever the scene changes ──────────────────────
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const doc = {
          version: 1 as const,
          unit: 'm' as const,
          objects: spawnedShapes,
          selectedId,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(SCENE_STORAGE_KEY, JSON.stringify(doc));
        setSavedAt(new Date());
      } catch {
        // localStorage full or unavailable — silently skip.
      }
    }, 400);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [spawnedShapes, selectedId]);

  /** `pointer` ↔ `select`, `translate|rotate|scale` ↔ gizmo modes.
   *  Whole-object gizmo only applies in `object` selection mode — the
   *  face/edge/vertex modes will get their own per-element handles later. */
  const transformMode: 'select' | 'translate' | 'rotate' | 'scale' =
    selectionMode === 'object' &&
    (activeTool === 'translate' || activeTool === 'rotate' || activeTool === 'scale')
      ? activeTool
      : 'select';

  const spawnPrimitive = (shape: SpawnShape) => {
    const obj = createSceneObject(shape, {
      label: SHAPE_LABEL[shape],
      color: SHAPE_COLOR[shape],
    });
    setPendingGeoOps([]);
    setSpawnedShapes([obj]);
    setSelectedId(obj.id);
    setStatusHint(`Created ${SHAPE_LABEL[shape]}`);
  };

  /** Apply a partial patch to one scene object — used by inspector + Copilot. */
  const updateSceneObject = (id: string, patch: Partial<SceneObject>) => {
    setSpawnedShapes((prev) =>
      prev.map((o) => (o.id === id ? patchSceneObject(o, patch) : o)),
    );
  };

  /** Gizmo drag-end → write transform back into the SceneObject. */
  const commitTransform = (
    id: string,
    transform: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] },
  ) => {
    updateSceneObject(id, { transform });
  };

  const handleToolClick = (toolId: string) => {
    if (['translate', 'rotate', 'scale'].includes(toolId)) {
      if (!selectedId) {
        setStatusHint(`Select an object first to ${toolId}`);
        return;
      }
      setActiveTool(toolId);
      const obj = spawnedShapes.find((s) => s.id === selectedId);
      const verb = toolId === 'translate' ? 'Move' : toolId === 'rotate' ? 'Rotate' : 'Scale';
      setStatusHint(obj ? `${verb} · ${obj.label}` : verb);
      return;
    }
    setActiveTool(toolId);
    if ((SHAPE_TOOLS as string[]).includes(toolId)) {
      spawnPrimitive(toolId as SpawnShape);
      return;
    }
    if (['bevel', 'subtract', 'union'].includes(toolId)) {
      if (!selectedId) {
        setStatusHint(`Select an object first to apply ${toolId}`);
        return;
      }
      setStatusHint(`${toolId}: ask the Copilot, e.g. "round corners"`);
      return;
    }
    if (toolId === 'pointer') {
      setStatusHint('Select tool — click an object in the outliner');
    }
  };

  // ── Hotkeys: Q/W/E/R for tools, Esc to deselect, Delete/Backspace to remove.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack typing in inputs / textareas.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'q')          { handleToolClick('pointer');   e.preventDefault(); }
      else if (k === 'w')     { handleToolClick('translate'); e.preventDefault(); }
      else if (k === 'e')     { handleToolClick('rotate');    e.preventDefault(); }
      else if (k === 'r')     { handleToolClick('scale');     e.preventDefault(); }
      else if (k === '1')     { window.dispatchEvent(new CustomEvent('studio:set-selection-mode', { detail: 'object' }));  setStatusHint('Mode · Object'); e.preventDefault(); }
      else if (k === '2')     { window.dispatchEvent(new CustomEvent('studio:set-selection-mode', { detail: 'face' }));    setStatusHint('Mode · Face — hover to highlight, click to select'); e.preventDefault(); }
      else if (k === '3')     { window.dispatchEvent(new CustomEvent('studio:set-selection-mode', { detail: 'edge' }));    setStatusHint('Mode · Edge — hover to highlight, click to select');  e.preventDefault(); }
      else if (k === '4')     { window.dispatchEvent(new CustomEvent('studio:set-selection-mode', { detail: 'vertex' }));  setStatusHint('Mode · Vertex — hover to highlight, click to select'); e.preventDefault(); }
      else if (k === 'escape') {
        if (transformMode !== 'select') {
          setActiveTool('pointer');
          setStatusHint('Exit transform mode');
        } else if (selectionMode !== 'object') {
          setSelectionMode('object');
          window.dispatchEvent(new CustomEvent('studio:set-selection-mode', { detail: 'object' }));
          setStatusHint('Mode · Object');
        } else if (selectedId) {
          setSelectedId(null);
          setStatusHint('Cleared selection');
        }
        e.preventDefault();
      } else if ((k === 'delete' || k === 'backspace') && selectedId) {
        setSpawnedShapes((prev) => prev.filter((s) => s.id !== selectedId));
        setSelectedId(null);
        setActiveTool('pointer');
        setStatusHint('Removed object');
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // handleToolClick closes over fresh state via React's render — but we want
    // the latest `selectedId`/`transformMode`/`spawnedShapes`, so depend on them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, transformMode, spawnedShapes, selectionMode]);

  useWorkspaceCommand((cmd) => {
    if (cmd.type === 'spawn_shape') {
      const obj = createSceneObject(cmd.shape, {
        label: cmd.label,
        color: cmd.color ?? SHAPE_COLOR[cmd.shape] ?? '#38bdf8',
      });
      if ((cmd.mode ?? 'replace') === 'append') {
        setSpawnedShapes((prev) => [...prev, obj]);
      } else {
        setPendingGeoOps([]);
        setSpawnedShapes([obj]);
      }
      setSelectedId(obj.id);
      setStatusHint(`Spawned ${obj.label} via Copilot`);
    } else if (cmd.type === 'clear_shapes') {
      setSpawnedShapes([]);
      setPendingGeoOps([]);
      setSelectedId(null);
      setSavedAt(null);
      try { localStorage.removeItem(SCENE_STORAGE_KEY); } catch { /* ok */ }
      setStatusHint('Scene cleared');
    } else if (cmd.type === 'geometry_op') {
      if ((cmd.mode ?? 'replace') === 'append') {
        setPendingGeoOps((prev) => [...prev, cmd.op]);
      } else {
        setSpawnedShapes([]);
        setPendingGeoOps([cmd.op]);
      }
      setStatusHint(`Geometry op: ${cmd.op.operation}`);
    }
  });

  const isEmpty = spawnedShapes.length === 0 && pendingGeoOps.length === 0;
  const totalObjects = spawnedShapes.length + pendingGeoOps.length;
  const selectedShape = spawnedShapes.find((s) => s.id === selectedId) ?? null;

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden bg-[#050505]',
        fullscreen && 'fixed inset-0 z-50',
      )}
    >
      <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-white/6 bg-[#0a0a0a] px-4">
        <div className="flex items-center gap-3">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-sky-500/20">
            <Hexagon className="h-3 w-3 text-sky-400" />
          </span>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-white/60">
            Lab
          </span>
          {!isEmpty && (
            <span className="rounded-full bg-sky-500/15 px-2 py-0.5 font-mono text-[9px] text-sky-400">
              {totalObjects} object{totalObjects > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOutlinerOpen((v) => !v)}
            title={outlinerOpen ? 'Hide outliner' : 'Show outliner'}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 text-white/30 transition-colors hover:border-white/20 hover:text-white/70"
          >
            {outlinerOpen ? (
              <PanelRightClose className="h-3.5 w-3.5" />
            ) : (
              <PanelRightOpen className="h-3.5 w-3.5" />
            )}
          </button>
          {!isEmpty && (
            <button
              type="button"
              onClick={() => {
                setSpawnedShapes([]);
                setPendingGeoOps([]);
                setSelectedId(null);
                setSavedAt(null);
                try { localStorage.removeItem(SCENE_STORAGE_KEY); } catch { /* ok */ }
                setStatusHint('Scene cleared');
              }}
              title="Clear scene"
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/8 px-2.5 py-1 font-mono text-[10px] text-rose-400/60 transition-colors hover:border-rose-500/40 hover:text-rose-400"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 text-white/30 transition-colors hover:border-white/20 hover:text-white/70"
          >
            {fullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex w-14 flex-shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-white/6 bg-[#080808] py-2">
          {PALETTE.map((group, gi) => (
            <div key={group.id} className="flex w-full flex-col items-center gap-1">
              {gi > 0 && <div className="my-1 h-px w-7 bg-white/8" />}
              <span className="font-mono text-[7px] uppercase tracking-widest text-white/20">
                {group.label}
              </span>
              {group.tools.map((tool) => {
                const disabled = tool.needsSelection && !selectedId;
                const active = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    title={`${tool.label}${tool.hotkey ? ` (${tool.hotkey})` : ''}`}
                    onClick={() => handleToolClick(tool.id)}
                    disabled={disabled}
                    className={cn(
                      'group relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                      active && 'bg-sky-500/15 ring-1 ring-sky-500/40',
                      !active && !disabled && 'hover:bg-white/8',
                      disabled && 'cursor-not-allowed opacity-25',
                    )}
                  >
                    <tool.Icon
                      className="h-4 w-4 transition-colors group-hover:text-white"
                      style={tool.color ? { color: tool.color } : undefined}
                    />
                    <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md border border-white/10 bg-[#111] px-2 py-0.5 font-mono text-[9px] text-white/70 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      {tool.label}
                      {tool.hotkey ? (
                        <span className="ml-1 text-white/30">[{tool.hotkey}]</span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <StudioProvider>
        <SelectionModeSync />
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {/* ── Plasticity-style selection-mode bar (studio layer) ── */}
          {!isEmpty && <StudioSelectionBar />}
          {!isEmpty && <StudioToolBarLeft />}
          {!isEmpty && <ExtrudePanel />}
          {!isEmpty && <CameraViewWidget />}

          {isEmpty ? (
            <EmptyState onSpawn={spawnPrimitive} />
          ) : (
            <SimulationWorkspace
              items={[]}
              activeTab="lab"
              spawnedShapes={spawnedShapes}
              onSetSpawnedShapes={setSpawnedShapes}
              onUpdateObject={updateSceneObject}
              pendingGeoOps={pendingGeoOps}
              selectedId={selectedId}
              onSelectObject={(id) => {
                setSelectedId(id);
                setStatusHint(id ? 'Object selected' : 'Cleared selection');
              }}
              transformMode={transformMode}
              onCommitTransform={commitTransform}
              selectionMode={selectionMode}
            />
          )}

          {/* ── Bottom action bar ── */}
          <StudioBottomBar />
        </div>
        </StudioProvider>

        {outlinerOpen && (
          <div className="flex w-60 flex-shrink-0 flex-col border-l border-white/6 bg-[#080808]">
            <Outliner
              shapes={spawnedShapes}
              pendingOps={pendingGeoOps}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setStatusHint(id ? 'Object selected' : 'Cleared selection');
              }}
              onRemove={(id) => {
                setSpawnedShapes((prev) => prev.filter((s) => s.id !== id));
                if (selectedId === id) setSelectedId(null);
                setStatusHint('Removed object');
              }}
            />
            <div className="flex-1 overflow-y-auto border-t border-white/6 p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-white/30" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">
                  Properties
                </span>
              </div>
              {selectedShape ? (
                <PropertiesPanel obj={selectedShape} onUpdate={updateSceneObject} />
              ) : (
                <p className="font-mono text-[10px] leading-relaxed text-white/25">
                  Select an object to inspect.
                  <br />
                  <span className="text-white/15">No selection.</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex h-7 flex-shrink-0 items-center justify-between border-t border-white/6 bg-[#0a0a0a] px-4 font-mono text-[10px]">
        <div className="flex items-center gap-3">
          <span className="text-white/30">
            <span className="text-white/15">Mode:</span>{' '}
            <span className="text-fuchsia-400/70">{selectionMode}</span>
          </span>
          <span className="text-white/15">·</span>
          <span className="text-white/30">
            <span className="text-white/15">Cmd:</span>{' '}
            <span className="text-sky-400/60">{activeTool}</span>
          </span>
          <span className="text-white/15">·</span>
          <span className="text-white/30">{statusHint}</span>
        </div>
        <div className="flex items-center gap-3 text-white/30">
          <span>{totalObjects} obj</span>
          {selectedShape && (
            <>
              <span className="text-white/15">·</span>
              <span style={{ color: selectedShape.material.color_hex }}>{selectedShape.label}</span>
            </>
          )}
          <span className="text-white/15">·</span>
          {savedAt && !isEmpty ? (
            <span
              className="text-emerald-500/50"
              title={`Last saved ${savedAt.toLocaleTimeString()}`}
            >
              ● auto-saved
            </span>
          ) : (
            <span className="text-emerald-500/40">● ready</span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onSpawn }: { onSpawn: (s: SpawnShape) => void }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-6">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="lab-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lab-grid)" />
      </svg>

      <div className="relative flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/4">
          <Plus className="h-7 w-7 text-white/20" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="font-mono text-[13px] font-semibold text-white/30">Empty scene</p>
          <p className="font-mono text-[10px] text-white/15">
            Pick a tool from the left,
            <br />
            or ask the Copilot: <em className="text-sky-500/50">create a cube</em>
          </p>
        </div>

        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {(['cube', 'cylinder', 'cone', 'torus', 'sphere'] as SpawnShape[]).map((shape) => {
            const Icon = SHAPE_ICON[shape];
            const color = SHAPE_COLOR[shape];
            return (
              <button
                key={shape}
                type="button"
                onClick={() => onSpawn(shape)}
                className="flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 transition-colors hover:bg-white/5"
                style={{ borderColor: `${color}25`, color: `${color}80` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
                <span className="font-mono text-[8px] uppercase tracking-widest">
                  {SHAPE_LABEL[shape]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Outliner({
  shapes,
  pendingOps,
  selectedId,
  onSelect,
  onRemove,
}: {
  shapes: SpawnedShape[];
  pendingOps: GeometryOpCommand[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 px-3 py-2 hover:bg-white/4"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-white/40" />
        ) : (
          <ChevronRight className="h-3 w-3 text-white/40" />
        )}
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">Scene</span>
        <span className="ml-auto font-mono text-[9px] text-white/20">
          {shapes.length + pendingOps.length}
        </span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-0.5 px-1 pb-2">
          {shapes.length === 0 && pendingOps.length === 0 && (
            <p className="px-3 py-2 font-mono text-[10px] text-white/20">Scene is empty.</p>
          )}
          {shapes.map((s) => {
            const active = s.id === selectedId;
            return (
              <div
                key={s.id}
                className={cn(
                  'group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
                  active ? 'bg-sky-500/12 ring-1 ring-sky-500/30' : 'hover:bg-white/4',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(active ? null : s.id)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-sm"
                    style={{
                      backgroundColor: s.material.color_hex,
                      boxShadow: active ? `0 0 6px ${s.material.color_hex}` : 'none',
                    }}
                  />
                  <span className="truncate font-mono text-[10px] text-white/70">{s.label}</span>
                  <span className="font-mono text-[8px] text-white/20">{s.kind}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(s.id)}
                  title="Remove"
                  className="opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3 text-white/30" />
                </button>
              </div>
            );
          })}
          {pendingOps.map((op, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md px-2 py-1.5">
              <span className="h-2 w-2 flex-shrink-0 rounded-sm bg-amber-400" />
              <span className="truncate font-mono text-[10px] text-white/70">
                {op.label ?? `${op.operation}`}
              </span>
              <span className="ml-auto font-mono text-[8px] text-amber-400/60">CSG</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertiesPanel({
  obj,
  onUpdate,
}: {
  obj: SceneObject;
  onUpdate: (id: string, patch: Partial<SceneObject>) => void;
}) {
  const color = obj.material.color_hex;

  /** Patch the shape-params slice with type-narrowed safety. */
  const patchShape = (next: Record<string, number>) => {
    onUpdate(obj.id, { shape: { ...obj.shape, ...next } as SceneObject['shape'] });
  };

  /** Patch one transform component. */
  const patchTransform = (
    axis: 'position' | 'rotation' | 'scale',
    idx: 0 | 1 | 2,
    value: number,
  ) => {
    const next: [number, number, number] = [...obj.transform[axis]] as [number, number, number];
    next[idx] = value;
    onUpdate(obj.id, { transform: { ...obj.transform, [axis]: next } });
  };

  return (
    <div className="space-y-3">
      {/* ── Identity ─────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Row label="Type">
          <span className="font-mono text-[10px] text-white/70">{obj.kind}</span>
        </Row>
        <Row label="Name">
          <span className="font-mono text-[10px] text-white/70">{obj.label}</span>
        </Row>
        <Row label="Color">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="font-mono text-[9px] uppercase text-white/50">{color}</span>
          </span>
        </Row>
        <Row label="ID">
          <span className="truncate font-mono text-[8px] text-white/30">{obj.id}</span>
        </Row>
      </div>

      {/* ── Shape parameters ─────────────────────────────────────────────── */}
      {hasEditableShape(obj.shape) && (
        <div className="rounded-md border border-white/6 bg-white/2 p-2">
          <p className="mb-1.5 font-mono text-[8px] uppercase tracking-widest text-white/35">
            Shape
          </p>
          <div className="space-y-1.5">
            {obj.shape.kind === 'cube' && (
              <NumField
                label="Subdivisions"
                value={obj.shape.subdivisions}
                min={1}
                max={5}
                step={1}
                onChange={(v) => patchShape({ subdivisions: v })}
              />
            )}
            {obj.shape.kind === 'cylinder' && (
              <>
                <NumField label="Radius" value={obj.shape.radius} min={0.1} max={1.0} step={0.05}
                  onChange={(v) => patchShape({ radius: v })} />
                <NumField label="Height" value={obj.shape.height} min={0.2} max={2.0} step={0.1}
                  onChange={(v) => patchShape({ height: v })} />
              </>
            )}
            {obj.shape.kind === 'cone' && (
              <>
                <NumField label="Radius bot" value={obj.shape.radius} min={0.1} max={1.0} step={0.05}
                  onChange={(v) => patchShape({ radius: v })} />
                <NumField label="Radius top" value={obj.shape.radius_top} min={0.0} max={1.0} step={0.05}
                  onChange={(v) => patchShape({ radius_top: v })} />
                <NumField label="Height" value={obj.shape.height} min={0.2} max={2.0} step={0.1}
                  onChange={(v) => patchShape({ height: v })} />
              </>
            )}
            {obj.shape.kind === 'torus' && (
              <>
                <NumField label="Major R" value={obj.shape.major_radius} min={0.2} max={1.0} step={0.05}
                  onChange={(v) => patchShape({ major_radius: v })} />
                <NumField label="Minor r" value={obj.shape.minor_radius} min={0.05}
                  max={Math.max(0.05, obj.shape.major_radius - 0.05)} step={0.025}
                  onChange={(v) => patchShape({ minor_radius: v })} />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Transform (read-only display + sliders for position) ─────────── */}
      <div className="rounded-md border border-white/6 bg-white/2 p-2">
        <p className="mb-1.5 font-mono text-[8px] uppercase tracking-widest text-white/35">
          Transform
        </p>
        <div className="space-y-1.5">
          {(['position', 'rotation', 'scale'] as const).map((axis) => (
            <div key={axis} className="flex items-center justify-between gap-1">
              <span className="font-mono text-[8px] uppercase text-white/30">{axis}</span>
              <div className="flex gap-1">
                {([0, 1, 2] as const).map((i) => (
                  <input
                    key={i}
                    type="number"
                    step={axis === 'rotation' ? 0.1 : 0.05}
                    value={obj.transform[axis][i]}
                    onChange={(e) => patchTransform(axis, i, Number(e.target.value))}
                    className="h-5 w-12 rounded border border-white/8 bg-white/4 px-1 font-mono text-[9px] text-white/70 outline-none focus:border-sky-500/40"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Discriminator: which shape kinds expose editable params? */
function hasEditableShape(s: SceneObject['shape']): boolean {
  return s.kind === 'cube' || s.kind === 'cylinder' || s.kind === 'cone' || s.kind === 'torus';
}

/** Compact ± stepper input for the Properties panel. */
function NumField({
  label, value, min, max, step, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="flex items-center justify-between gap-1">
      <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">{label}</span>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onChange(clamp(+(value - step).toFixed(3)))}
          disabled={value <= min + 1e-6}
          className="flex h-5 w-5 items-center justify-center rounded-l border border-white/10 bg-white/4 font-mono text-[10px] text-white/50 hover:text-white disabled:opacity-30"
        >−</button>
        <span className="flex h-5 min-w-[42px] items-center justify-center border-y border-white/10 bg-white/4 px-1 font-mono text-[9px] text-white/70">
          {value.toFixed(step < 1 ? 2 : 0)}
        </span>
        <button
          type="button"
          onClick={() => onChange(clamp(+(value + step).toFixed(3)))}
          disabled={value >= max - 1e-6}
          className="flex h-5 w-5 items-center justify-center rounded-r border border-white/10 bg-white/4 font-mono text-[10px] text-white/50 hover:text-white disabled:opacity-30"
        >+</button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[8px] uppercase tracking-widest text-white/30">{label}</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}
