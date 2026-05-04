'use client';

/**
 * SceneClient — standalone 3D Workspace page.
 *
 * Layout:
 *   ┌────────────┬──────────────────────────────────────┐
 *   │ Left tabs  │  3D scene (Visual or Simulation)     │
 *   │ Visual     │  fills remaining space               │
 *   │ Simulation │                                      │
 *   └────────────┴──────────────────────────────────────┘
 *
 * Copilot panel is handled by the global AppShell (right rail).
 */

import { useEffect, useState } from 'react';
import { Boxes, FlaskConical, Maximize2, Minimize2, RefreshCw, TrendingUp } from 'lucide-react';

import { api } from '@/lib/chefos-api';
import { useChefOSSync } from '@/lib/chefos-store';
import type { InventoryItem, InventoryListResponse } from '@/lib/chefos-types';
import { cn } from '@/lib/utils';
import { InventoryVisualWorkspace } from '@/components/workspace/scenes/InventoryVisualWorkspace';
import { SimulationWorkspace } from '@/components/workspace/scenes/SimulationWorkspace';
import { useCopilot } from '@/components/copilot/CopilotProvider';
import { useWorkspaceCommand, type SpawnShape } from '@/components/workspace/WorkspaceCommands';

type SceneTab = 'visual' | 'simulation';
type SimTab = 'forecast' | 'lab';

export type SpawnedShape = {
  id: string;
  shape: SpawnShape;
  label: string;
  color: string;
};

export function SceneClient({ locale }: { locale: string }) {
  const [tab, setTab] = useState<SceneTab>('visual');
  const [simTab, setSimTab] = useState<SimTab>('forecast');
  const [items, setItems] = useState<InventoryItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [spawnedShapes, setSpawnedShapes] = useState<SpawnedShape[]>([
    { id: 'default-cube', shape: 'cube', label: 'Cube', color: '#a0a8b8' },
  ]);
  const [fullscreen, setFullscreen] = useState(false);
  const { sendMessage: copilotSend } = useCopilot();

  const load = async (silent = false) => {
    if (!silent) setItems(null);
    setRefreshing(true);
    try {
      const res = await api.get<InventoryListResponse>('/api/inventory/products');
      setItems(res.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []);
  useChefOSSync('inventory', () => { void load(true); });

  // Handle Copilot workspace commands at the always-mounted SceneClient level
  // so spawn_shape is captured even when SimulationWorkspace is not yet mounted.
  useWorkspaceCommand((cmd) => {
    if (cmd.type === 'switch_lab') {
      setTab('simulation');
      setSimTab('lab');
    } else if (cmd.type === 'spawn_shape') {
      setSpawnedShapes((prev) => [
        ...prev,
        {
          id: `${cmd.shape}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          shape: cmd.shape,
          label: cmd.label,
          color: cmd.color ?? '#38bdf8',
        },
      ]);
    } else if (cmd.type === 'clear_shapes') {
      setSpawnedShapes([]);
    }
  });

  const safeItems = items ?? [];

  return (
    <div className={cn(
      'flex h-full w-full overflow-hidden bg-[#070707]',
      fullscreen && 'fixed inset-0 z-50',
    )}>
      {/* ── Left tab rail ── */}
      <div className="flex w-14 flex-shrink-0 flex-col items-center gap-1 border-r border-white/8 bg-[#0a0a0a] py-4">

        {/* Visual */}
        <button
          type="button"
          onClick={() => setTab('visual')}
          title="Visual"
          className={cn(
            'flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-xl text-[9px] font-semibold uppercase tracking-wider transition-colors',
            tab === 'visual'
              ? 'bg-white/15 text-white'
              : 'text-white/30 hover:bg-white/8 hover:text-white/60',
          )}
        >
          <Boxes className="h-4 w-4" />
          <span>VIS</span>
        </button>

        {/* Simulation */}
        <button
          type="button"
          onClick={() => setTab('simulation')}
          title="Simulation"
          className={cn(
            'flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-xl text-[9px] font-semibold uppercase tracking-wider transition-colors',
            tab === 'simulation' && simTab !== 'lab'
              ? 'bg-white/15 text-white'
              : tab === 'simulation' && simTab === 'lab'
                ? 'text-white/50'
                : 'text-white/30 hover:bg-white/8 hover:text-white/60',
          )}
        >
          <TrendingUp className="h-4 w-4" />
          <span>SIM</span>
        </button>

        {/* Forecast / Lab sub-tabs — only when simulation is active */}
        {tab === 'simulation' && (
          <>
            <div className="my-1 w-8 border-t border-white/10" />
            <button
              type="button"
              onClick={() => setSimTab('forecast')}
              title="Forecast"
              className={cn(
                'flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-xl text-[9px] font-semibold uppercase tracking-wider transition-colors',
                simTab === 'forecast'
                  ? 'bg-sky-500/20 text-sky-300'
                  : 'text-white/30 hover:bg-white/8 hover:text-white/60',
              )}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>FCT</span>
            </button>
            <button
              type="button"
              onClick={() => setSimTab('lab')}
              title="Lab"
              className={cn(
                'flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-xl text-[9px] font-semibold uppercase tracking-wider transition-colors',
                simTab === 'lab'
                  ? 'bg-sky-500/20 text-sky-300'
                  : 'text-white/30 hover:bg-white/8 hover:text-white/60',
              )}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>LAB</span>
            </button>
          </>
        )}

        {/* spacer */}
        <div className="flex-1" />

        {/* refresh */}
        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          title="Refresh"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white/30 transition-colors hover:bg-white/8 hover:text-white/60 disabled:opacity-30"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
        </button>

        {/* fullscreen toggle */}
        <button
          type="button"
          onClick={() => setFullscreen(v => !v)}
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white/30 transition-colors hover:bg-white/8 hover:text-white/60"
        >
          {fullscreen
            ? <Minimize2 className="h-4 w-4" />
            : <Maximize2 className="h-4 w-4" />
          }
        </button>
      </div>

      {/* ── 3D scene area ── */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {items === null ? (
          <div className="flex flex-1 items-center justify-center text-sm text-white/30">
            Loading…
          </div>
        ) : tab === 'visual' ? (
          <InventoryVisualWorkspace
            items={safeItems}
            headerActions={null}
            onSelectItem={() => {}}
            onAskCopilot={(item, intent) => {
              if (intent === 'writeoff') {
                void copilotSend(`Write off ${item.remaining_quantity} ${item.product.base_unit} of ${item.product.name}`);
              } else {
                void copilotSend(`Tell me about ${item.product.name} in my inventory`);
              }
            }}
          />
        ) : (
          <SimulationWorkspace items={safeItems} activeTab={simTab} spawnedShapes={spawnedShapes} onSetSpawnedShapes={setSpawnedShapes} />
        )}
      </div>
    </div>
  );
}
