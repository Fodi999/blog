'use client';

/**
 * useInventoryScene — fetches the authoritative `SceneState` from
 * `GET /api/scenes/inventory` (game-like architecture, PR2 backend).
 *
 * Why this exists: the frontend should NOT compute scene layout. The
 * backend is the source of truth for entity positions, severity themes,
 * HUD strings, and allowed actions. This hook is the only bridge.
 *
 * Migration plan:
 *   PR3a (this file): backend wins, fallback to client builder on error/loading
 *                     so the screen never goes blank during deploy.
 *   PR3b: once the Koyeb endpoint is verified in production, the fallback
 *         and `inventorySceneBuilder.ts` can be deleted.
 */

import { useEffect, useRef, useState } from 'react';

import { api, ApiError } from '@/lib/chefos-api';
import type { SceneState } from '@/components/visual/sceneTypes';

export interface UseInventorySceneState {
  scene: SceneState | null;
  isLoading: boolean;
  error: ApiError | Error | null;
  refresh: () => void;
}

interface Options {
  /** Disable network (e.g. SSR, preview, or while logged out). */
  enabled?: boolean;
  /** Auto-refetch interval in ms. 0 = no polling. */
  pollMs?: number;
}

export function useInventoryScene(opts: Options = {}): UseInventorySceneState {
  const { enabled = true, pollMs = 0 } = opts;
  const [scene, setScene] = useState<SceneState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const myTick = ++tickRef.current;

    const load = async () => {
      try {
        const data = await api.get<SceneState>('/api/scenes/inventory');
        if (cancelled || myTick !== tickRef.current) return;
        setScene(data);
        setError(null);
      } catch (err) {
        if (cancelled || myTick !== tickRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled && myTick === tickRef.current) setIsLoading(false);
      }
    };

    setIsLoading(true);
    load();

    if (pollMs > 0) {
      const id = setInterval(load, pollMs);
      return () => {
        cancelled = true;
        clearInterval(id);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [enabled, pollMs]);

  const refresh = () => {
    tickRef.current++;
    setIsLoading(true);
    void (async () => {
      const myTick = tickRef.current;
      try {
        const data = await api.get<SceneState>('/api/scenes/inventory');
        if (myTick !== tickRef.current) return;
        setScene(data);
        setError(null);
      } catch (err) {
        if (myTick !== tickRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (myTick === tickRef.current) setIsLoading(false);
      }
    })();
  };

  return { scene, isLoading, error, refresh };
}
