/**
 * studio/tools/index.ts
 *
 * Public surface of the tools module.
 * Import from here, not from tools.ts or registry.ts directly.
 */

export type { ToolId, ToolDef } from './registry';
export type { ToolBehaviour } from './tools';
export {
  TOOLS,
  TOOL_REGISTRY,
  HOTKEY_MAP,
  getToolDef,
  getToolBehaviour,
  resolveHotkey,
  getToolGroup,
} from './registry';
