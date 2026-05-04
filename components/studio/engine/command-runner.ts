/**
 * studio/engine/command-runner.ts
 *
 * Undo/redo stack for Studio commands.
 * Wrap the scene store actions — each user gesture goes through here.
 */

import type { StudioCommand } from '../core/commands';
import type { SceneStoreInstance } from './scene-store';

export type CommandRunnerOptions = {
  /** Max undo steps to keep in memory */
  maxHistory?: number;
};

export class CommandRunner {
  private undoStack: StudioCommand[] = [];
  private redoStack: StudioCommand[] = [];
  private maxHistory: number;
  private store: SceneStoreInstance;

  constructor(store: SceneStoreInstance, opts: CommandRunnerOptions = {}) {
    this.store = store;
    this.maxHistory = opts.maxHistory ?? 100;
  }

  /** Execute a command, push to undo stack, clear redo stack. */
  run(cmd: StudioCommand): void {
    this.apply(cmd);
    this.undoStack.push(cmd);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo(): void {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    this.revert(cmd);
    this.redoStack.push(cmd);
  }

  redo(): void {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    this.apply(cmd);
    this.undoStack.push(cmd);
  }

  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }

  /** Read-only access to the current scene state. */
  getState() { return this.store.getState(); }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  // ── Apply ─────────────────────────────────────────────────────────────────

  private apply(cmd: StudioCommand): void {
    const s = this.store.getState();
    switch (cmd.type) {
      case 'add_object':
        s.setObjects([...s.objects, cmd.object]);
        break;
      case 'remove_object':
        s.removeObject(cmd.id);
        break;
      case 'move_object':
        s.commitTransform(cmd.id, cmd.to);
        break;
      case 'patch_object':
        s.patchObject(cmd.id, cmd.patch);
        break;
      case 'patch_material':
        s.patchMaterial(cmd.id, cmd.patch);
        break;
      case 'patch_shape':
        s.patchShape(cmd.id, cmd.patch);
        break;
      case 'select_object':
        s.selectObject(cmd.id);
        break;
      case 'batch':
        for (const sub of cmd.commands) this.apply(sub);
        break;
    }
  }

  // ── Revert ────────────────────────────────────────────────────────────────

  private revert(cmd: StudioCommand): void {
    const s = this.store.getState();
    switch (cmd.type) {
      case 'add_object':
        s.removeObject(cmd.object.id);
        break;
      case 'remove_object':
        s.setObjects([...s.objects, cmd.snapshot]);
        break;
      case 'move_object':
        s.commitTransform(cmd.id, cmd.from);
        break;
      case 'patch_object':
        s.patchObject(cmd.id, cmd.before);
        break;
      case 'patch_material':
        s.patchMaterial(cmd.id, cmd.before);
        break;
      case 'patch_shape':
        s.patchShape(cmd.id, cmd.before);
        break;
      case 'select_object':
        s.selectObject(cmd.previous);
        break;
      case 'batch':
        for (const sub of [...cmd.commands].reverse()) this.revert(sub);
        break;
    }
  }
}
