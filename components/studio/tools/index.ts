/**
 * studio/tools/index.ts
 *
 * Tool registry — maps hotkeys and names to tool ids.
 * Each tool has a dedicated file with its logic.
 */

export type ToolId =
  | 'select'
  | 'move'
  | 'rotate'
  | 'scale'
  | 'measure'
  | 'delete';

export type ToolDef = {
  id: ToolId;
  label: string;
  hotkey: string;
  icon: string;
};

export const TOOLS: ToolDef[] = [
  { id: 'select',  label: 'Select',  hotkey: 'Q', icon: '▣' },
  { id: 'move',    label: 'Move',    hotkey: 'W', icon: '↔' },
  { id: 'rotate',  label: 'Rotate',  hotkey: 'E', icon: '↻' },
  { id: 'scale',   label: 'Scale',   hotkey: 'R', icon: '⤢' },
  { id: 'measure', label: 'Measure', hotkey: 'M', icon: '⊣⊢' },
  { id: 'delete',  label: 'Delete',  hotkey: 'Del', icon: '✕' },
];

export const HOTKEY_MAP: Record<string, ToolId> = Object.fromEntries(
  TOOLS.map((t) => [t.hotkey.toLowerCase(), t.id]),
);
