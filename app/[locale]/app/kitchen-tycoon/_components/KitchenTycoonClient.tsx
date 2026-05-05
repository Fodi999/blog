'use client';

import { useState, useEffect } from 'react';
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
import { CityGameScreen } from '@/components/kitchen-tycoon/city/CityGameScreen';
import { KitchenRoom3D } from '@/components/kitchen-tycoon/viewport/KitchenRoom3D';
import { DISTRICTS } from '@/components/kitchen-tycoon/world/city-map';
import { useBackendBridge } from '@/components/kitchen-tycoon/engine/useBackendBridge';

type Screen = 'city' | 'kitchen';

function KitchenTycoonInner() {
  const selectedDistrictId = useKitchen((s) => s.selectedDistrictId);
  const setRestaurantName  = useKitchen((s) => s.setRestaurantName);
  const hydrateStock       = useKitchen((s) => s.hydrateStock);
  const [screen, setScreen] = useState<Screen>('city');
  const [gameOpen, setGameOpen] = useState(true);

  // ── Backend bridge ──────────────────────────────────────────────────────
  const backend = useBackendBridge();

  useEffect(() => {
    if (!backend.loading && backend.authenticated) {
      // Push real restaurant name into game store
      setRestaurantName(backend.restaurantName);
      // Seed game stock from real inventory (non-empty keys only)
      if (Object.keys(backend.stockMap).length > 0) {
        hydrateStock(backend.stockMap);
      }
    }
  }, [backend.loading, backend.authenticated, backend.restaurantName, backend.stockMap, setRestaurantName, hydrateStock]);

  if (!gameOpen) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-zinc-950 text-zinc-400">
        <p className="text-2xl">🍔</p>
        <p className="text-sm font-medium text-zinc-300">Food Empire</p>
        <button
          onClick={() => setGameOpen(true)}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10"
        >
          ▶ Open Game
        </button>
      </div>
    );
  }

  if (screen === 'city') {
    return (
      <CityGameScreen
        onEnterKitchen={() => setScreen('kitchen')}
        onClose={() => setGameOpen(false)}
        restaurantName={backend.authenticated ? backend.restaurantName : undefined}
        backendDishes={backend.dishes.length}
        authenticated={backend.authenticated}
      />
    );
  }

  return (
    <div className="relative flex h-full flex-col bg-zinc-950 text-zinc-200">
      <GameHeader />
      <div className="relative flex min-h-0 flex-1">
        <BuildPanelV2 />
        <div className="relative flex flex-1 items-stretch overflow-hidden">
          <KitchenRoom3D />
          <button
            onClick={() => setScreen('city')}
            className="pointer-events-auto absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-xs backdrop-blur transition-colors hover:bg-black/80"
          >
            <span className="text-white/40">←</span>
            <span className="text-sm">{DISTRICTS[selectedDistrictId].icon}</span>
            <span className="font-medium text-white/80">{DISTRICTS[selectedDistrictId].name}</span>
          </button>
          <div className="pointer-events-auto absolute bottom-3 left-3 z-10">
            <ProgressionBar />
          </div>
          <div className="pointer-events-auto absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
            <ActionBar />
          </div>
        </div>
        <aside className="flex w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-white/10 bg-black/70 p-3 backdrop-blur">
          <DistrictInfoPanel
            districtId={selectedDistrictId}
            onChangeClick={() => setScreen('city')}
          />
          <MissionPanel />
          <OrdersPanel />
          <ProductionPanel />
          <FinancePanel />
          <InspectorPanel />
        </aside>
      </div>
    </div>
  );
}

export function KitchenTycoonClient() {
  return (
    <KitchenStoreProvider>
      <TickEngine />
      <KitchenTycoonInner />
    </KitchenStoreProvider>
  );
}
