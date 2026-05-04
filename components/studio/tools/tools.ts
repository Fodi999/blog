/**
 * studio/tools/tools.ts
 *
 * Tool behaviour interface + concrete implementations.
 * Pure logic — no React, no fetch, no store imports.
 *
 * Each tool receives a CommandRunner and dispatches typed commands.
 * The store stays passive; tools never read state directly except
 * through runner.getState() when absolutely necessary.
 */

import type { Transform } from '../core/types';
import type { CommandRunner } from '../engine/command-runner';
import { makeRemoveCommand, makeMoveCommand } from '../core/commands';

// ── ToolBehaviour interface ───────────────────────────────────────────────────

export interface ToolBehaviour {
  readonly id: string;
  /** Viewport click hit an existing object */
  onClickObject?(id: string, runner: CommandRunner): void;
  /** Viewport background clicked (deselect / place) */
  onClickBackground?(runner: CommandRunner): void;
  /** Gizmo drag completed — from and to are full Transform snapshots */
  onCommitTransform?(id: string, from: Transform, to: Transform, runner: CommandRunner): void;
  /** Keyboard shortcut pressed while this tool is active */
  onKeyDown?(key: string, runner: CommandRunner): void;
}

// ── Select ────────────────────────────────────────────────────────────────────

export const SelectTool: ToolBehaviour = {
  id: 'select',

  onClickObject(id, runner) {
    const { selection } = runner.getState();
    // Second click on the same object = deselect
    const next = selection.objectId === id ? null : id;
    runner.run({ type: 'select_object', id: next, previous: selection.objectId });
  },

  onClickBackground(runner) {
    const { selection } = runner.getState();
    runner.run({ type: 'select_object', id: null, previous: selection.objectId });
  },
};

// ── Move ──────────────────────────────────────────────────────────────────────

export const MoveTool: ToolBehaviour = {
  id: 'move',

  onClickObject(id, runner) {
    const { selection } = runner.getState();
    runner.run({ type: 'select_object', id, previous: selection.objectId });
  },

  onCommitTransform(id, from, to, runner) {
    runner.run(makeMoveCommand(id, from, to));
  },
};

// ── Rotate ────────────────────────────────────────────────────────────────────

export const RotateTool: ToolBehaviour = {
  id: 'rotate',

  onClickObject(id, runner) {
    const { selection } = runner.getState();
    runner.run({ type: 'select_object', id, previous: selection.objectId });
  },

  onCommitTransform(id, from, to, runner) {
    runner.run(makeMoveCommand(id, from, to));
  },
};

// ── Scale ─────────────────────────────────────────────────────────────────────

export const ScaleTool: ToolBehaviour = {
  id: 'scale',

  onClickObject(id, runner) {
    const { selection } = runner.getState();
    runner.run({ type: 'select_object', id, previous: selection.objectId });
  },

  onCommitTransform(id, from, to, runner) {
    runner.run(makeMoveCommand(id, from, to));
  },
};

// ── Delete ────────────────────────────────────────────────────────────────────

export const DeleteTool: ToolBehaviour = {
  id: 'delete',

  onClickObject(id, runner) {
    const obj = runner.getState().getObject(id);
    if (!obj) return;
    runner.run(makeRemoveCommand(obj));
  },

  onKeyDown(key, runner) {
    if (key !== 'delete' && key !== 'backspace') return;
    const obj = runner.getState().getSelected();
    if (!obj) return;
    runner.run(makeRemoveCommand(obj));
  },
};

// ── Measure (stub — no store mutations) ──────────────────────────────────────

export const MeasureTool: ToolBehaviour = {
  id: 'measure',
  // Measurement state lives outside the command stack (it's view-only).
  // The actual distance computation is done in MeasureTool's React component.
};
