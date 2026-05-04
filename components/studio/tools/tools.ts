/**
 * studio/tools/SelectTool.ts  /  MoveTool.ts  /  …
 *
 * Tool behaviour objects — pure logic, no React.
 * Each implements the ToolBehaviour interface.
 */

import type { SceneObject, Transform } from '../core/types';
import type { CommandRunner } from '../engine/command-runner';
import { makeRemoveCommand, makeMoveCommand, makeAddCommand } from '../core/commands';
import { createSceneObject } from '../engine/object-factory';
import type { SpawnShape } from '../core/types';

// ── Tool behaviour interface ──────────────────────────────────────────────────

export interface ToolBehaviour {
  id: string;
  /** Called when a viewport click hits an object */
  onClickObject?(id: string, runner: CommandRunner): void;
  /** Called when the viewport background is clicked */
  onClickBackground?(runner: CommandRunner): void;
  /** Called when a gizmo drag completes */
  onCommitTransform?(id: string, from: Transform, to: Transform, runner: CommandRunner): void;
}

// ── Select tool ───────────────────────────────────────────────────────────────

export const SelectTool: ToolBehaviour = {
  id: 'select',
  onClickObject(id, runner) {
    runner.run({ type: 'select_object', id, previous: null });
  },
  onClickBackground(runner) {
    runner.run({ type: 'select_object', id: null, previous: null });
  },
};

// ── Move tool ─────────────────────────────────────────────────────────────────

export const MoveTool: ToolBehaviour = {
  id: 'move',
  onClickObject(id, runner) {
    runner.run({ type: 'select_object', id, previous: null });
  },
  onCommitTransform(id, from, to, runner) {
    runner.run(makeMoveCommand(id, from, to));
  },
};

// ── Rotate tool ───────────────────────────────────────────────────────────────

export const RotateTool: ToolBehaviour = {
  id: 'rotate',
  onClickObject(id, runner) {
    runner.run({ type: 'select_object', id, previous: null });
  },
  onCommitTransform(id, from, to, runner) {
    runner.run(makeMoveCommand(id, from, to));
  },
};

// ── Scale tool ────────────────────────────────────────────────────────────────

export const ScaleTool: ToolBehaviour = {
  id: 'scale',
  onClickObject(id, runner) {
    runner.run({ type: 'select_object', id, previous: null });
  },
  onCommitTransform(id, from, to, runner) {
    runner.run(makeMoveCommand(id, from, to));
  },
};

// ── Delete tool ───────────────────────────────────────────────────────────────

export const DeleteTool: ToolBehaviour = {
  id: 'delete',
  onClickObject(id, runner) {
    const state = runner['store'].getState();
    const obj = state.getObject(id);
    if (!obj) return;
    runner.run(makeRemoveCommand(obj));
  },
};

// ── Tool registry ─────────────────────────────────────────────────────────────

export const TOOL_BEHAVIOURS: Record<string, ToolBehaviour> = {
  select: SelectTool,
  move:   MoveTool,
  rotate: RotateTool,
  scale:  ScaleTool,
  delete: DeleteTool,
};
