'use client';
/**
 * studio/engine/StudioProvider.tsx
 *
 * React context that holds one SceneStore + CommandRunner per Studio mount.
 * No global singleton — each <StudioProvider> is independent.
 *
 * Usage:
 *   <StudioProvider>
 *     <YourStudioUI />
 *   </StudioProvider>
 *
 * Hooks:
 *   useStudioStore(selector) — subscribe to scene state
 *   useRunner()              — get the CommandRunner for dispatching commands
 */

import { createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { createSceneStore, type SceneStore, type SceneStoreInstance } from './scene-store';
import { CommandRunner } from './command-runner';

// ── Context ───────────────────────────────────────────────────────────────────

type StudioCtx = {
  store: SceneStoreInstance;
  runner: CommandRunner;
};

const StudioContext = createContext<StudioCtx | null>(null);

function useStudioContext(): StudioCtx {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('[studio] useStudioStore must be used inside <StudioProvider>');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<SceneStoreInstance | null>(null);
  const runnerRef = useRef<CommandRunner | null>(null);

  if (!storeRef.current) {
    storeRef.current = createSceneStore();
    runnerRef.current = new CommandRunner(storeRef.current);
  }

  return (
    <StudioContext.Provider
      value={{ store: storeRef.current, runner: runnerRef.current! }}
    >
      {children}
    </StudioContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Subscribe to the scene store with a selector.
 *
 * @example
 *   const objects = useStudioStore(s => s.objects);
 *   const selectionMode = useStudioStore(s => s.tool.selectionMode);
 */
export function useStudioStore<T>(selector: (state: SceneStore) => T): T {
  const { store } = useStudioContext();
  return useStore(store, selector);
}

/**
 * Get the CommandRunner for the current Studio instance.
 * Use this to dispatch commands (add, remove, move, undo, redo…).
 *
 * @example
 *   const runner = useRunner();
 *   runner.run(makeAddCommand(obj));
 */
export function useRunner(): CommandRunner {
  return useStudioContext().runner;
}
