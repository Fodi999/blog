'use client';

/**
 * InventoryVisualWorkspace — page-level shell that:
 *   1. takes raw `InventoryItem[]` from the page,
 *   2. fetches authoritative `SceneState` from `GET /api/scenes/inventory`,
 *   3. falls back to the client builder while in-flight / backend unreachable,
 *   4. renders header HUD + left toolbar + 3D canvas + selected-entity panel.
 *
 * Cleanup PR3b: delete `buildInventoryScene` import + fallbackScene memo
 * once the Koyeb endpoint is verified in production.
 */

import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';
import {
  Eye,
  AlertTriangle,
  RotateCcw,
  X,
  Flame,
  CheckCircle2,
  Clock,
  Trash2,
  BookOpen,
} from 'lucide-react';

import type { InventoryItem } from '@/lib/chefos-types';
import { buildInventoryScene } from '@/components/visual/builders/inventorySceneBuilder';
import { useInventoryScene } from '@/lib/hooks/useInventoryScene';
import type { EntityAction, MaterialTheme, SceneEntity } from '@/components/visual/sceneTypes';

const VisualSceneRenderer = dynamic(
  () =>
    import('@/components/visual/VisualSceneRenderer').then(
      (m) => m.VisualSceneRenderer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[560px] w-full items-center justify-center rounded-2xl border border-white/10 bg-[#070707] text-sm text-white/50">
        loading visual workspace…
      </div>
    ),
  },
);

interface Props {
  items: InventoryItem[];
  stats?: {
    totalValueLabel: string;
    itemsCount: number;
    expiringCount: number;
    lowCount: number;
  };
  onSelectItem?: (item: InventoryItem | null) => void;
  onAskCopilot?: (item: InventoryItem, intent: 'writeoff' | 'general') => void;
}

// ── Theme helpers ─────────────────────────────────────────────────────────────

const THEME_LABEL: Record<MaterialTheme, string> = {
  ok: 'OK',
  warning: 'Expiring soon',
  critical: 'Critical',
  expired: 'Expired',
  cold: 'Cold storage',
  dry: 'Dry storage',
  freezer: 'Freezer',
  risk: 'Risk',
  neutral: '—',
};

const THEME_COLOR: Record<MaterialTheme, string> = {
  ok: 'text-emerald-400',
  warning: 'text-amber-400',
  critical: 'text-orange-400',
  expired: 'text-rose-500',
  cold: 'text-sky-400',
  dry: 'text-yellow-400',
  freezer: 'text-cyan-300',
  risk: 'text-red-400',
  neutral: 'text-white/40',
};

const ACTION_LABEL: Record<EntityAction, string> = {
  writeOff: 'Write off',
  useToday: 'Use today',
  openDetails: 'Details',
  restock: 'Restock',
  inspect: 'Inspect',
};

// ── Action button ─────────────────────────────────────────────────────────────

function ActionBtn({
  action,
  theme,
  onClick,
}: {
  action: EntityAction;
  theme: MaterialTheme;
  onClick: () => void;
}) {
  const isDestructive = action === 'writeOff';
  const isPrimary = action === 'useToday';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
        isDestructive
          ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
          : isPrimary
          ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
          : 'bg-white/8 text-white/70 hover:bg-white/15'
      }`}
    >
      {ACTION_LABEL[action]}
    </button>
  );
}

// ── Selected entity detail panel ──────────────────────────────────────────────

function EntityDetailPanel({
  entity,
  linkedItem,
  onClose,
  onAskCopilot,
}: {
  entity: SceneEntity;
  linkedItem: InventoryItem | null;
  onClose: () => void;
  onAskCopilot?: (item: InventoryItem, intent: 'writeoff' | 'general') => void;
}) {
  const { content, material, gameplay } = entity;
  const theme = material.theme;

  const handleAction = (action: EntityAction) => {
    if (!linkedItem || !onAskCopilot) return;
    if (action === 'writeOff') {
      onAskCopilot(linkedItem, 'writeoff');
    } else {
      onAskCopilot(linkedItem, 'general');
    }
  };

  return (
    <div className="pointer-events-auto w-72 rounded-2xl border border-white/10 bg-[#0e0e0e]/95 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-white/8 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {content?.title ?? 'Entity'}
          </p>
          <p className="mt-0.5 text-xs text-white/50">{content?.subtitle ?? ''}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-white/40 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-px border-b border-white/8 bg-white/5">
        <div className="bg-[#0e0e0e] px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-white/35">Status</p>
          <p className={`mt-1 text-sm font-semibold ${THEME_COLOR[theme]}`}>
            {THEME_LABEL[theme]}
          </p>
        </div>
        <div className="bg-[#0e0e0e] px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-white/35">Category</p>
          <p className="mt-1 truncate text-sm text-white/80">
            {content?.badges?.[0] ?? '—'}
          </p>
        </div>
        {linkedItem && (
          <>
            <div className="bg-[#0e0e0e] px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-white/35">Qty left</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {linkedItem.remaining_quantity} {linkedItem.product.base_unit}
              </p>
            </div>
            <div className="bg-[#0e0e0e] px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-white/35">Value</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {((linkedItem.remaining_quantity * linkedItem.price_per_unit_cents) / 100).toFixed(2)} PLN
              </p>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {gameplay?.actions && gameplay.actions.length > 0 && (
        <div className="flex gap-2 p-3">
          {gameplay.actions.slice(0, 3).map((action) => (
            <ActionBtn
              key={action}
              action={action}
              theme={theme}
              onClick={() => handleAction(action)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Toolbar button ─────────────────────────────────────────────────────────────

function ToolBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
        active
          ? 'border-white/20 bg-white/15 text-white'
          : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

const LEGEND = [
  { color: 'bg-emerald-500', label: 'OK' },
  { color: 'bg-amber-500', label: 'Expiring soon' },
  { color: 'bg-orange-500', label: 'Critical (≤1 day)' },
  { color: 'bg-rose-500', label: 'Expired' },
] as const;

function Legend({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="pointer-events-auto w-44 rounded-xl border border-white/10 bg-[#0e0e0e]/95 p-3 shadow-2xl backdrop-blur-sm">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-white/35">Legend</p>
      <div className="space-y-1.5">
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
            <span className="text-xs text-white/60">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function InventoryVisualWorkspace({ items, onSelectItem, onAskCopilot }: Props) {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [focusRisks, setFocusRisks] = useState(false);

  // Backend-authoritative scene. stableBackendRef never goes null after
  // first success — prevents canvas remount → WebGL context loss.
  const { scene: backendScene, error: sceneError } = useInventoryScene();
  const stableBackendRef = useRef<typeof backendScene>(null);
  if (backendScene) stableBackendRef.current = backendScene;

  const fallbackScene = useMemo(
    () => buildInventoryScene(items, { selectedEntityId }),
    [items, selectedEntityId],
  );

  const scene = stableBackendRef.current ?? fallbackScene;
  const usingFallback = !stableBackendRef.current;

  if (process.env.NODE_ENV !== 'production' && sceneError) {
    // eslint-disable-next-line no-console
    console.warn(
      '[InventoryVisualWorkspace] /api/scenes/inventory failed, using local fallback:',
      sceneError,
    );
  }

  // Find first risk/critical entity for "focus risks" button
  const firstRiskEntity = useMemo(
    () =>
      scene.entities.find(
        (e) =>
          e.material.theme === 'critical' ||
          e.material.theme === 'expired',
      ) ?? null,
    [scene.entities],
  );

  const handleSelect = (entityId: string | null) => {
    setSelectedEntityId(entityId);
    setFocusRisks(false);
    if (!entityId) {
      onSelectItem?.(null);
      return;
    }
    const entity = scene.entities.find((e) => e.id === entityId);
    const linked = entity?.gameplay?.linkedEntityId;
    if (!linked) { onSelectItem?.(null); return; }
    const item = items.find((i) => i.id === linked) ?? null;
    onSelectItem?.(item);
  };

  const handleReset = () => {
    setSelectedEntityId(null);
    setFocusRisks(false);
    onSelectItem?.(null);
  };

  const handleFocusRisks = () => {
    if (firstRiskEntity) {
      setSelectedEntityId(firstRiskEntity.id);
      setFocusRisks(true);
      const linked = firstRiskEntity.gameplay?.linkedEntityId;
      const item = linked ? items.find((i) => i.id === linked) ?? null : null;
      onSelectItem?.(item);
    }
  };

  // Resolve selected entity + linked InventoryItem for detail panel
  const selectedEntity = scene.entities.find((e) => e.id === selectedEntityId) ?? null;
  const selectedItem = selectedEntity?.gameplay?.linkedEntityId
    ? items.find((i) => i.id === selectedEntity.gameplay!.linkedEntityId) ?? null
    : null;

  const riskCount = useMemo(
    () =>
      scene.entities.filter(
        (e) => e.material.theme === 'critical' || e.material.theme === 'expired',
      ).length,
    [scene.entities],
  );

  return (
    <div className="flex h-full min-h-[560px] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#070707]">
      {/* ── Header HUD ── */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/8 px-5 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            ChefOS · Workspace
          </p>
          <h2 className="text-sm font-semibold text-white">Inventory · Spatial view</h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/60">
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] ${
              usingFallback
                ? 'bg-white/10 text-white/50'
                : 'bg-emerald-500/15 text-emerald-300'
            }`}
            title={usingFallback ? 'Local fallback' : 'Live /api/scenes/inventory'}
          >
            {usingFallback ? 'local' : 'live'}
          </span>
          {scene.hud.totalValueLabel && (
            <span className="font-semibold text-white tabular-nums">
              {scene.hud.totalValueLabel}
            </span>
          )}
          {scene.hud.itemsLabel && (
            <><span className="h-3 w-px bg-white/15" /><span>{scene.hud.itemsLabel} items</span></>
          )}
          {scene.hud.expiringLabel && scene.hud.expiringLabel !== '0' && (
            <><span className="h-3 w-px bg-white/15" /><span className="text-amber-400">{scene.hud.expiringLabel} expiring</span></>
          )}
          {scene.hud.lowStockLabel && scene.hud.lowStockLabel !== '0' && (
            <><span className="h-3 w-px bg-white/15" /><span className="text-rose-400">{scene.hud.lowStockLabel} low</span></>
          )}
        </div>
      </div>

      {/* ── Canvas + overlays ── */}
      <div className="relative flex-1 overflow-hidden">
        <VisualSceneRenderer
          scene={scene}
          selectedEntityId={selectedEntityId}
          onSelectEntity={handleSelect}
        />

        {/* Left toolbar */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
          <ToolBtn
            icon={RotateCcw}
            label="Reset camera"
            onClick={handleReset}
          />
          <ToolBtn
            icon={AlertTriangle}
            label={`Focus risks (${riskCount})`}
            active={focusRisks}
            onClick={handleFocusRisks}
          />
          <ToolBtn
            icon={Eye}
            label="Toggle legend"
            active={showLegend}
            onClick={() => setShowLegend((v) => !v)}
          />
        </div>

        {/* Legend popover */}
        <div className="pointer-events-none absolute bottom-3 left-3">
          <Legend visible={showLegend} />
        </div>

        {/* Selected entity detail panel */}
        {selectedEntity && selectedEntity.entityType === 'inventoryProduct' && (
          <div className="pointer-events-none absolute right-3 top-3">
            <EntityDetailPanel
              entity={selectedEntity}
              linkedItem={selectedItem}
              onClose={() => handleSelect(null)}
              onAskCopilot={onAskCopilot}
            />
          </div>
        )}
      </div>
    </div>
  );
}
