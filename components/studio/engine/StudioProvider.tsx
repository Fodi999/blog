'use client';
/**
 * studio/engine/StudioProvider.tsx
 *
 * React context: one SceneStore + CommandRunner + RefRegistry per mount.
 *
 * Hooks:
 *   useStudioStore(selector) — subscribe to scene state
 *   useRunner()              — CommandRunner for undoable commands
 *   useRefRegistry()         — register/get Three.js Object3D refs
 */

import { createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import * as THREE from 'three';
import { createSceneStore, type SceneStore, type SceneStoreInstance } from './scene-store';
import { CommandRunner } from './command-runner';

// ── RefRegistry ───────────────────────────────────────────────────────────────
//
// Three.js Object3D instances must NOT live inside Zustand/Immer.
// They are mutable, non-serialisable. We keep them in a plain Map.

export class RefRegistry {
  private refs = new Map<string, THREE.Object3D>();

  register(id: string, obj: THREE.Object3D): void {
    this.refs.set(id, obj);
  }

  unregister(id: string): void {
    this.refs.delete(id);
  }

  get(id: string): THREE.Object3D | undefined {
    return this.refs.get(id);
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

type StudioCtx = {
  store: SceneStoreInstance;
  runner: CommandRunner;
  registry: RefRegistry;
};

const StudioContext = createContext<StudioCtx | null>(null);

function useStudioContext(): StudioCtx {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('[studio] Hook must be used inside <StudioProvider>');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const storeRef    = useRef<SceneStoreInstance | null>(null);
  const runnerRef   = useRef<CommandRunner | null>(null);
  const registryRef = useRef<RefRegistry | null>(null);

  if (!storeRef.current) {
    storeRef.current    = createSceneStore();
    runnerRef.current   = new CommandRunner(storeRef.current);
    registryRef.current = new RefRegistry();
  }

  return (
    <StudioContext.Provider
      value={{
        store:    storeRef.current,
        runner:   runnerRef.current!,
        registry: registryRef.current!,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useStudioStore<T>(selector: (state: SceneStore) => T): T {
  const { store } = useStudioContext();
  return useStore(store, selector);
}

export function useRunner(): CommandRunner {
  return useStudioContext().runner;
}

export function useRefRegistry(): RefRegistry {
  return useStudioContext().registry;
}
