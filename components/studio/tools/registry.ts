/**
 * studio/tools/registry.ts
 *
 * Single source of truth for the Studio tool system.
 *
 * Combines:
 *   - ToolId / ToolDef metadata (label, hotkey, icon)
 *   - ToolBehaviour implementations (logic)
 *   - Hotkey → ToolId map
 *   - Runtime lookup helpers
 *
 * Rule: toolbar buttons, keyboard handlers and the viewport
 * all import from here — never directly from tools.ts.
 */

import {
  SelectTool,
  MoveTool,
  RotateTool,
  ScaleTool,
  DeleteTool,
  MeasureTool,
  type ToolBehaviour,
} from './tools';

// ── ToolId ────────────────────────────────────────────────────────────────────

export type ToolId =
  | 'select'
  | 'move'
  | 'rotate'
  | 'scale'
  | 'measure'
  | 'delete';

// ── ToolDef — metadata for UI rendering ──────────────────────────────────────

export type ToolDef = {
  id: ToolId;
  label: string;
  /** Single key (lowercased). 'delete' = Delete key. */
  hotkey: string;
  icon: string;
  /** Tools in the same group are rendered together in the toolbar. */
  group: 'transform' | 'draw' | 'inspect' | 'edit';
};

export const TOOLS: ToolDef[] = [
  { id: 'select',  label: 'Select',  hotkey: 'q',      icon: '▣',  group: 'transform' },
  { id: 'move',    label: 'Move',    hotkey: 'w',      icon: '↔',  group: 'transform' },
  { id: 'rotate',  label: 'Rotate',  hotkey: 'e',      icon: '↻',  group: 'transform' },
  { id: 'scale',   label: 'Scale',   hotkey: 'r',      icon: '⤢',  group: 'transform' },
  { id: 'measure', label: 'Measure', hotkey: 'm',      icon: '⊣⊢', group: 'inspect'   },
  { id: 'delete',  label: 'Delete',  hotkey: 'delete', icon: '✕',  group: 'edit'      },
];

// ── Hotkey map ────────────────────────────────────────────────────────────────

/** key.toLowerCase() → ToolId */
export const HOTKEY_MAP: Record<string, ToolId> = Object.fromEntries(
  TOOLS.map((t) => [t.hotkey, t.id]),
);

// ── Behaviour registry ────────────────────────────────────────────────────────

/** ToolId → ToolBehaviour implementation */
export const TOOL_REGISTRY: Record<ToolId, ToolBehaviour> = {
  select:  SelectTool,
  move:    MoveTool,
  rotate:  RotateTool,
  scale:   ScaleTool,
  measure: MeasureTool,
  delete:  DeleteTool,
};

// ── Lookup helpers ────────────────────────────────────────────────────────────

/** Get the ToolDef for a given id (throws if not found — indicates a bug). */
export function getToolDef(id: ToolId): ToolDef {
  const def = TOOLS.find((t) => t.id === id);
  if (!def) throw new Error(`[studio] Unknown tool id: "${id}"`);
  return def;
}

/** Get the ToolBehaviour for a given id. */
export function getToolBehaviour(id: ToolId): ToolBehaviour {
  return TOOL_REGISTRY[id];
}

/** Resolve a raw keyboard key to a ToolId, or null if no binding. */
export function resolveHotkey(key: string): ToolId | null {
  return HOTKEY_MAP[key.toLowerCase()] ?? null;
}

/** All tools in a specific group, in definition order. */
export function getToolGroup(group: ToolDef['group']): ToolDef[] {
  return TOOLS.filter((t) => t.group === group);
}
