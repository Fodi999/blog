/**
 * city/CityGameScreen.tsx
 * RTS-style city management screen.
 *
 * Layout:
 * ┌────────────────────────────────────────────────────┐
 * │              Top Bar (resources)                   │
 * ├──────────┬─────────────────────────────┬───────────┤
 * │  Build   │                             │   Info    │
 * │  Panel   │     Isometric 3D Map        │   Panel   │
 * │          │                             │           │
 * ├──────────┴─────────────────────────────┴───────────┤
 * │              Command Bar (bottom)                  │
 * └────────────────────────────────────────────────────┘
 */
'use client';

import { useKitchen } from '../engine/StoreProvider';
import { CityMapViewport } from './CityMapViewport';
import { CityBuildPanel } from './panels/CityBuildPanel';
import { CityInfoPanel } from './panels/CityInfoPanel';
import { CityCommandBar } from './panels/CityCommandBar';
import { CityMiniMap } from './panels/CityMiniMap';
import { DISTRICTS } from '../world/city-map';
import type { DistrictId } from '../world/city-map';

interface Props {
  onEnterKitchen?: () => void;
  onClose?: () => void;
  restaurantName?: string;
  backendDishes?: number;
  authenticated?: boolean;
}

export function CityGameScreen({ onEnterKitchen, onClose, restaurantName, backendDishes, authenticated }: Props) {
  const cash                = useKitchen((s) => s.finance.cash);
  const day                 = useKitchen((s) => s.game.day);
  const rating              = useKitchen((s) => s.finance.rating);
  const playerLevel         = useKitchen((s) => s.game.stage);
  const selectedKitchenDistrict = useKitchen((s) => s.selectedDistrictId);
  const cityUi              = useKitchen((s) => s.cityUi);
  const selectCityDistrict  = useKitchen((s) => s.selectCityDistrict);
  const setSelectedDistrict = useKitchen((s) => s.setSelectedDistrict);
  const togglePause         = useKitchen((s) => s.togglePause);
  const paused              = useKitchen((s) => s.game.paused);

  function handleSelectDistrict(id: DistrictId) {
    selectCityDistrict(id);
  }

  function handleOpenBusiness() {
    if (!cityUi.selectedDistrictId) return;
    setSelectedDistrict(cityUi.selectedDistrictId);
    onEnterKitchen?.();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: '#07090d', color: '#e2e8f0' }}
    >
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/8 bg-[#0a0c10]/95 px-5 backdrop-blur">
        {/* Left: back button + game identity */}
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
            >
              ← Back
            </button>
          )}
          <span className="text-xs font-black tracking-[0.3em] text-yellow-400 uppercase">
            🍔 {restaurantName ?? 'Food Empire'}
          </span>
          <span className="h-4 w-px bg-white/10" />
          <span className="text-[10px] font-medium text-white/30 uppercase tracking-widest">
            {authenticated ? '🟢 Online' : 'City Mode'}
          </span>
        </div>

        {/* Center: resources */}
        <div className="flex items-center gap-6">
          <Resource icon="💰" label="Cash" value={`${Math.round(cash)} zł`} color="#4ade80" />
          <Resource icon="📅" label="Day" value={String(day)} color="#94a3b8" />
          <Resource icon="⭐" label="Rating" value={rating.toFixed(1)} color="#facc15" />
          <Resource icon="🏆" label="Level" value={String(playerLevel)} color="#c084fc" />
          {backendDishes !== undefined && backendDishes > 0 && (
            <Resource icon="🍽️" label="Menu" value={`${backendDishes} dishes`} color="#fb923c" />
          )}
          <div className="h-4 w-px bg-white/10" />
          <Resource
            icon="📍"
            label="District"
            value={DISTRICTS[selectedKitchenDistrict].name}
            color={DISTRICTS[selectedKitchenDistrict].color}
          />
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1.5">
          {/* Speed buttons */}
          <SpeedButton label="1x" active={!paused} onClick={() => { if (paused) togglePause(); }} />
          <SpeedButton label="2x" active={false} onClick={() => {}} />

          <div className="h-4 w-px bg-white/10 mx-1" />

          <button
            onClick={togglePause}
            className={[
              'rounded-md px-3 py-1.5 text-[10px] font-semibold transition-colors',
              paused
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10',
            ].join(' ')}
          >
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>

          {onEnterKitchen && (
            <button
              onClick={onEnterKitchen}
              className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-[10px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/25"
            >
              🍳 Open Kitchen
            </button>
          )}
        </div>
      </header>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="relative flex min-h-0 flex-1">
        {/* Build panel */}
        <CityBuildPanel />

        {/* 3D Viewport — CSS sky gradient as background, Canvas alpha:true on top */}
        <div
          className="relative flex-1"
          style={{
            background: 'linear-gradient(to bottom, #0d1f4e 0%, #1a3a7a 20%, #2556a8 42%, #4a82d0 60%, #c8723a 78%, #e8954a 86%, #1a2a40 100%)',
          }}
        >
          <CityMapViewport
            cameraDirection={cityUi.cameraDirection}
            zoom={cityUi.zoom}
            showGrid={cityUi.showGrid}
            showOverlay={cityUi.showDistrictOverlay}
            selectedDistrictId={cityUi.selectedDistrictId}
            playerLevel={playerLevel}
            onSelectDistrict={handleSelectDistrict}
          />

          {/* Bottom-left: minimap */}
          <div className="absolute bottom-16 left-3 z-20">
            <CityMiniMap />
          </div>

          {/* WASD hint */}
          <div className="pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2">
            <div className="rounded-lg bg-black/40 px-3 py-1 text-[9px] text-white/20 backdrop-blur">
              W↑ S↓ A← D→ — pan &nbsp;·&nbsp; ЛКМ drag — pan &nbsp;·&nbsp; ПКМ drag — orbit &nbsp;·&nbsp; scroll — zoom &nbsp;·&nbsp; Q/E — rotate
            </div>
          </div>

          {/* Command bar */}
          <CityCommandBar />
        </div>

        {/* Info panel */}
        <CityInfoPanel />
      </div>
    </div>
  );
}

function Resource({
  icon, label, value, color,
}: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm">{icon}</span>
      <div>
        <p className="text-[8px] uppercase tracking-wider text-white/20">{label}</p>
        <p className="text-[11px] font-bold leading-tight" style={{ color }}>{value}</p>
      </div>
    </div>
  );
}

function SpeedButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded px-2 py-1 text-[10px] font-bold transition-colors border',
        active
          ? 'bg-blue-500/20 border-blue-400/40 text-blue-300'
          : 'bg-white/5 border-white/10 text-white/30 hover:text-white/60',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
