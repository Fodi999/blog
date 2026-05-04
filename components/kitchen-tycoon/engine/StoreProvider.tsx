/**
 * kitchen-tycoon/engine/StoreProvider.tsx
 * React provider for the per-mount KitchenStore.
 */
'use client';

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { createKitchenStore, type KitchenState, type KitchenStoreApi } from './game-store';

const Ctx = createContext<KitchenStoreApi | null>(null);

export function KitchenStoreProvider({ children }: { children: ReactNode }) {
  const ref = useRef<KitchenStoreApi | null>(null);
  if (!ref.current) ref.current = createKitchenStore();
  return <Ctx.Provider value={ref.current}>{children}</Ctx.Provider>;
}

export function useKitchenStoreApi(): KitchenStoreApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('useKitchenStoreApi must be inside KitchenStoreProvider');
  return api;
}

export function useKitchen<T>(selector: (s: KitchenState) => T): T {
  const api = useKitchenStoreApi();
  return useStore(api, selector);
}

/** Drives the in-game clock + random order spawns. */
export function TickEngine() {
  const api = useKitchenStoreApi();
  useEffect(() => {
    const id = setInterval(() => {
      const s = api.getState();
      if (s.game.paused) return;
      s.tick();
      // Spawn orders ~ every 3 ticks during day hours
      if (s.game.hour >= 9 && s.game.hour <= 21 && Math.random() < 0.35) {
        s.spawnOrder();
      }
    }, 1500);
    return () => clearInterval(id);
  }, [api]);
  return null;
}
