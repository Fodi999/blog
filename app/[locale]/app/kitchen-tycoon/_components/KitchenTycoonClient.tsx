'use client';

import { KitchenStoreProvider, TickEngine } from '@/components/kitchen-tycoon/engine/StoreProvider';
import { GameHeader } from '@/components/kitchen-tycoon/panels/GameHeader';
import { BuildPanelV2 } from '@/components/kitchen-tycoon/panels/BuildPanelV2';
import { OrdersPanel } from '@/components/kitchen-tycoon/panels/OrdersPanel';
import { ProductionPanel } from '@/components/kitchen-tycoon/panels/ProductionPanel';
import { FinancePanel } from '@/components/kitchen-tycoon/panels/FinancePanel';
import { MissionPanel } from '@/components/kitchen-tycoon/panels/MissionPanel';
import { InspectorPanel } from '@/components/kitchen-tycoon/panels/InspectorPanel';
import { ProgressionBar } from '@/components/kitchen-tycoon/panels/ProgressionBar';
import { ActionBar } from '@/components/kitchen-tycoon/panels/ActionBar';
import { KitchenRoom3D } from '@/components/kitchen-tycoon/viewport/KitchenRoom3D';

export function KitchenTycoonClient() {
  return (
    <KitchenStoreProvider>
      <TickEngine />
      <div className="relative flex h-full flex-col bg-zinc-950 text-zinc-200">
        <GameHeader />

        <div className="relative flex min-h-0 flex-1">
          <BuildPanelV2 />

          <div className="relative flex flex-1 items-stretch overflow-hidden">
            <KitchenRoom3D />

            <div className="pointer-events-auto absolute bottom-3 left-3 z-10">
              <ProgressionBar />
            </div>
            <div className="pointer-events-auto absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
              <ActionBar />
            </div>
          </div>

          <aside className="flex w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-white/10 bg-black/70 p-3 backdrop-blur">
            <MissionPanel />
            <OrdersPanel />
            <ProductionPanel />
            <FinancePanel />
            <InspectorPanel />
          </aside>
        </div>
      </div>
    </KitchenStoreProvider>
  );
}
