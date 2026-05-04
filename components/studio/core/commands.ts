/**
 * studio/core/commands.ts
 *
 * Immutable command objects for undo/redo.
 * Every user action produces a Command; the CommandRunner applies it and
 * pushes the inverse onto the undo stack.
 */

import type { SceneObject, Transform, Material, ShapeParams, SpawnShape } from './types';

// ── Command union ─────────────────────────────────────────────────────────────

export type StudioCommand =
  | AddObjectCommand
  | RemoveObjectCommand
  | MoveObjectCommand
  | PatchObjectCommand
  | PatchMaterialCommand
  | PatchShapeCommand
  | SelectObjectCommand
  | BatchCommand;

export type AddObjectCommand = {
  type: 'add_object';
  object: SceneObject;
};

export type RemoveObjectCommand = {
  type: 'remove_object';
  id: string;
  /** Snapshot for undo — caller must supply the object before removal. */
  snapshot: SceneObject;
};

export type MoveObjectCommand = {
  type: 'move_object';
  id: string;
  from: Transform;
  to: Transform;
};

export type PatchObjectCommand = {
  type: 'patch_object';
  id: string;
  patch: Partial<SceneObject>;
  /** Snapshot of fields before the patch — for undo. */
  before: Partial<SceneObject>;
};

export type PatchMaterialCommand = {
  type: 'patch_material';
  id: string;
  patch: Partial<Material>;
  before: Partial<Material>;
};

export type PatchShapeCommand = {
  type: 'patch_shape';
  id: string;
  patch: Partial<ShapeParams>;
  before: Partial<ShapeParams>;
};

export type SelectObjectCommand = {
  type: 'select_object';
  id: string | null;
  previous: string | null;
};

/** Runs multiple commands as one undo unit. */
export type BatchCommand = {
  type: 'batch';
  label: string;
  commands: StudioCommand[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function makeAddCommand(object: SceneObject): AddObjectCommand {
  return { type: 'add_object', object };
}

export function makeRemoveCommand(object: SceneObject): RemoveObjectCommand {
  return { type: 'remove_object', id: object.id, snapshot: object };
}

export function makeMoveCommand(id: string, from: Transform, to: Transform): MoveObjectCommand {
  return { type: 'move_object', id, from, to };
}

export function makeMaterialCommand(id: string, before: Partial<Material>, patch: Partial<Material>): PatchMaterialCommand {
  return { type: 'patch_material', id, patch, before };
}

export function makeShapeCommand(id: string, before: Partial<ShapeParams>, patch: Partial<ShapeParams>): PatchShapeCommand {
  return { type: 'patch_shape', id, patch: patch as Partial<ShapeParams>, before: before as Partial<ShapeParams> };
}

export function batch(label: string, ...commands: StudioCommand[]): BatchCommand {
  return { type: 'batch', label, commands };
}
