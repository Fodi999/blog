'use client';

/**
 * Workspace command bus — small typed event channel that lets the
 * Copilot (or any other surface) drive the active visual scene.
 *
 * Example:
 *   const { dispatch } = useWorkspaceCommands();
 *   dispatch({ type: 'highlight_risks' });
 *
 * Inside a scene:
 *   useWorkspaceCommand((cmd) => {
 *     if (cmd.type === 'focus_item') zoomTo(cmd.itemId);
 *   });
 *
 * This is intentionally tiny — no global store, just a ref-counted
 * subscriber list scoped to the AppShell.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

export type WorkspaceCommand =
  | { type: 'highlight_risks' }
  | { type: 'focus_item'; itemId: string }
  | { type: 'clear_focus' }
  | { type: 'set_view'; view: 'data' | 'visual' | 'simulation' };

type Listener = (cmd: WorkspaceCommand) => void;

type Ctx = {
  dispatch: (cmd: WorkspaceCommand) => void;
  subscribe: (l: Listener) => () => void;
};

const WorkspaceCmdCtx = createContext<Ctx | null>(null);

export function WorkspaceCommandsProvider({ children }: { children: React.ReactNode }) {
  const listeners = useRef<Set<Listener>>(new Set());

  const dispatch = useCallback((cmd: WorkspaceCommand) => {
    listeners.current.forEach((l) => {
      try {
        l(cmd);
      } catch (e) {
        console.error('[workspace] listener threw', e);
      }
    });
  }, []);

  const subscribe = useCallback((l: Listener) => {
    listeners.current.add(l);
    return () => {
      listeners.current.delete(l);
    };
  }, []);

  const value = useMemo<Ctx>(() => ({ dispatch, subscribe }), [dispatch, subscribe]);
  return <WorkspaceCmdCtx.Provider value={value}>{children}</WorkspaceCmdCtx.Provider>;
}

export function useWorkspaceCommands(): Ctx {
  const ctx = useContext(WorkspaceCmdCtx);
  if (!ctx) {
    // Graceful no-op when used outside a provider — keeps scenes
    // standalone-renderable in storybook / tests.
    return {
      dispatch: () => {},
      subscribe: () => () => {},
    };
  }
  return ctx;
}

/** Subscribe to commands inside a scene. */
export function useWorkspaceCommand(handler: (cmd: WorkspaceCommand) => void) {
  const { subscribe } = useWorkspaceCommands();
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  }, [handler]);
  useEffect(() => subscribe((c) => ref.current(c)), [subscribe]);
}
