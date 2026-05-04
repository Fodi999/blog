'use client';
/**
 * studio/handles/ToolHandleLayer.tsx
 *
 * R3F layer rendered INSIDE the Canvas, above objects, below GizmoLayer.
 *
 * Routing logic:
 *   activeTool === 'fillet'  → <FilletHandle>   (yellow ring + radius label)
 *   activeTool === 'extrude' → <ExtrudeHandle>  (yellow arrow + distance label)
 *   activeTool === 'measure' → <MeasureHandle>  (blue ruler between two points)
 *   otherwise                → null
 *
 * Mount inside your <Canvas>:
 *
 *   <Canvas>
 *     <Lights />
 *     <GridFloor />
 *     <StudioObjectRenderer />
 *     <ToolHandleLayer />    ← here
 *     <GizmoLayer />
 *   </Canvas>
 */

import { useStudioStore } from '../engine/StudioProvider';
import { FilletHandle }   from './FilletHandle';
import { ExtrudeHandle }  from './ExtrudeHandle';
import { MeasureHandle }  from './MeasureHandle';
import type { FilletDraft, ExtrudeDraft, MeasureDraft } from '../core/types';

export function ToolHandleLayer() {
  const activeTool = useStudioStore((s) => s.activeTool);
  const draft      = useStudioStore((s) => s.draft);
  const selection  = useStudioStore((s) => s.selection);

  // ── Fillet ─────────────────────────────────────────────────────────────────
  // Show when activeTool === 'fillet' and there is an active draft OR
  // there is an active edge sub-selection (auto-start draft on first hover).
  if (activeTool === 'fillet' && draft?.kind === 'fillet') {
    return <FilletHandle draft={draft as FilletDraft} />;
  }

  // ── Extrude ────────────────────────────────────────────────────────────────
  // Show when activeTool === 'extrude' and there is an active draft.
  if (activeTool === 'extrude' && draft?.kind === 'extrude') {
    return <ExtrudeHandle draft={draft as ExtrudeDraft} />;
  }

  // ── Measure ────────────────────────────────────────────────────────────────
  if (activeTool === 'measure') {
    const md: MeasureDraft = draft?.kind === 'measure'
      ? (draft as MeasureDraft)
      : { kind: 'measure', from: null, to: null };
    return <MeasureHandle draft={md} />;
  }

  // Nothing active
  void selection; // keep linter happy — selection used for future auto-start logic
  return null;
}
