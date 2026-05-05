'use client';

import { useState } from 'react';
import { KitchenStoreProvider, TickEngine, useKitchen } from '@/components/kitchen-tycoon/engine/StoreProvider';
import { GameHeader } from '@/components/kitchen-tycoon/panels/GameHeader';
import { BuildPanelV2 } from '@/components/kitchen-tycoon/panels/BuildPanelV2';
import { OrdersPanel } from '@/components/kitchen-tycoon/panels/OrdersPanel';
import { ProductionPanel } from '@/components/kitchen-tycoon/panels/ProductionPanel';
import { FinancePanel } from '@/components/kitchen-tycoon/panels/FinancePanel';
import { MissionPanel } from '@/components/kitchen-tycoon/panels/MissionPanel';
import { InspectorPanel } from '@/components/kitchen-tycoon/panels/InspectorPanel';
import { ProgressionBar } from '@/components/kitchen-tycoon/panels/ProgressionBar';
import { ActionBar } from '@/components/kitchen-tycoon/panels/ActionBar';
import { DistrictInfoPanel } from '@/components/kitchen-tycoon/panels/DistrictInfoPanel';
import { CityMap } from '@/components/kitchen-tycoon/panels/CityMap';
import { KitchenRoom3D } from '@/components/kitchen-tycoon/viewport/KitchenRoom3D';
import { DISTRICTS, type DistrictId } from '@/components/kitchen-tycoon/world/city-map';

// ── Inner component (needs store access) ─────────────────────────────────────
function KitchenTycoonInner() {
  const selectedDistrictId  = useKitchen((s) => s.selectedDistrictId);
  const setSelectedDistrict = useKitchen((s) => s.setSelectedDistrict);
  const playerLevel         = useKitchen((s) => s.game.stage);

  const [mapOpen, setMapOpen] = useState(false);

  function handleSelectDistrict(id: DistrictId) {
    const d = DISTRICTS[id];
    if (playerLevel < d.unlockLevel) return;
    setSelectedDistrict(id);
    setMapOpen(false);
  }

  return (
    <div className="relative flex h-full flex-col bg-zinc-950 text-zinc-200">
      <GameHeader />

      <div className="relative flex min-h-0 flex-1">
        <BuildPanelV2 />

        <div className="relative flex flex-1 items-stretch overflow-hidden">
          <KitchenRoom3D />

          {/* District badge — top-left of viewport */}
          <button
            onClick={() => setMapOpen(true)}
            className="pointer-events-auto absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-xs backdrop-blur transition-colors hover:bg-black/80"
          >
            <span className="text-sm">{DISTRICTS[selectedDistrictId].icon}</span>
            <span className="font-medium text-white/80">{DISTRICTS[selectedDistrictId].name}</span>
            <span className="text-white/30">▾</span>
          </button>

          <div className="pointer-events-auto absolute bottom-3 left-3 z-10">
            <ProgressionBar />
          </div>
          <div className="pointer-events-auto absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
            <ActionBar />
          </div>
        </div>

        <aside className="flex w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-white/10 bg-black/70 p-3 backdrop-blur">
          {/* District info — always visible in sidebar */}
          <DistrictInfoPanel
            districtId={selectedDistrictId}
            onChangeClick={() => setMapOpen(true)}
          />
          <MissionPanel />
          <OrdersPanel />
          <ProductionPanel />
          <FinancePanel />
          <InspectorPanel />
        </aside>
      </div>

      {/* City map overlay */}
      {mapOpen && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setMapOpen(false)}
        >
          <div
            className="w-[520px] rounded-xl border border-white/10 bg-zinc-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-sm font-semibold text-white/80">Choose District</h2>
              <button
                onClick={() => setMapOpen(false)}
                className="text-white/30 hover:text-white/70"
              >
                ✕
              </button>
            </div>
            <CityMap
              selectedId={selectedDistrictId}
              playerLevel={playerLevel}
              onSelect={handleSelectDistrict}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export function KitchenTycoonClient() {
  return (
    <KitchenStoreProvider>
      <TickEngine />
      <KitchenTycoonInner />
    </KitchenStoreProvider>
  );
}
