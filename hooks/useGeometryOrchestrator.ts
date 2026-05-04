/**
 * useGeometryOrchestrator — Gemini vision feedback loop for geometry operations.
 *
 * Flow:
 *   1. User says "create a cube with a cylindrical hole"
 *   2. Gemini plans: tool=geometry_op, params={operation, target, cutter}
 *   3. Frontend calls POST /api/laboratory/geometry-op → gets GLB URL
 *   4. ModelViewer renders GLB, takes screenshot → base64 PNG
 *   5. Screenshot is sent back to Gemini: "does this look correct?"
 *   6. Gemini can issue a correction (adjust radius, depth, etc.)
 *   7. Loop repeats until Gemini says "looks good" or maxIterations reached
 */

'use client';

import { useState, useCallback, useRef } from 'react';

export type GeometryOpRequest = {
  operation: 'subtract' | 'union';
  target: { type: string; color?: string; size?: number };
  cutter: {
    type: 'cylinder' | 'box' | 'sphere' | string;
    radius?: number;
    height?: number;
    half_extents?: [number, number, number];
    center?: [number, number, number];
    cap_color?: string;
  };
  quality?: 'draft' | 'standard' | 'high' | 'ultra';
};

export type GeometryOpState =
  | { status: 'idle' }
  | { status: 'building'; op: GeometryOpRequest }
  | { status: 'ready'; glbUrl: string; op: GeometryOpRequest; iteration: number }
  | { status: 'reviewing'; glbUrl: string; screenshot: string; feedback?: string }
  | { status: 'error'; message: string };

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';

export function useGeometryOrchestrator() {
  const [state, setState] = useState<GeometryOpState>({ status: 'idle' });
  const screenshotRef = useRef<(() => string | null) | null>(null);

  /** Called by SimulationWorkspace to register the ModelViewer screenshot fn */
  const registerScreenshot = useCallback((fn: () => string | null) => {
    screenshotRef.current = fn;
  }, []);

  /** Step 1: build the GLB from a GeometryOpRequest */
  const executeOp = useCallback(async (op: GeometryOpRequest) => {
    setState({ status: 'building', op });
    try {
      const res = await fetch(`${BACKEND}/api/laboratory/geometry-op`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(op),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`geometry-op failed: ${res.status} ${text}`);
      }
      const blob = await res.blob();
      const glbUrl = URL.createObjectURL(blob);
      setState({ status: 'ready', glbUrl, op, iteration: 0 });
      return glbUrl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setState({ status: 'error', message: msg });
      return null;
    }
  }, []);

  /** Step 2: take a screenshot of the current viewport and return base64 */
  const captureScreenshot = useCallback((): string | null => {
    return screenshotRef.current?.() ?? null;
  }, []);

  /** Step 3: send screenshot to Gemini vision for review (via our /api/copilot proxy) */
  const reviewWithGemini = useCallback(async (
    glbUrl: string,
    op: GeometryOpRequest,
    screenshot: string,
  ): Promise<{ approved: boolean; correction?: Partial<GeometryOpRequest> }> => {
    setState({ status: 'reviewing', glbUrl, screenshot });
    try {
      const res = await fetch('/api/geometry-vision-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenshot, op }),
      });
      if (!res.ok) return { approved: true }; // fail-open
      return await res.json();
    } catch {
      return { approved: true }; // fail-open
    }
  }, []);

  /** Full pipeline: build → render → vision review → optional correction */
  const buildWithVision = useCallback(async (
    op: GeometryOpRequest,
    maxIterations = 2,
  ): Promise<string | null> => {
    let currentOp = op;
    for (let i = 0; i < maxIterations; i++) {
      const glbUrl = await executeOp(currentOp);
      if (!glbUrl) return null;

      // Wait one frame for the ModelViewer to render
      await new Promise((r) => setTimeout(r, 800));

      const screenshot = captureScreenshot();
      if (!screenshot) return glbUrl; // no vision — just return

      const review = await reviewWithGemini(glbUrl, currentOp, screenshot);
      if (review.approved || !review.correction) return glbUrl;

      // Merge correction into op and iterate
      currentOp = deepMerge(currentOp, review.correction) as GeometryOpRequest;
    }
    return state.status === 'ready' ? (state as { glbUrl: string }).glbUrl : null;
  }, [executeOp, captureScreenshot, reviewWithGemini, state]);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, executeOp, buildWithVision, registerScreenshot, captureScreenshot, reset };
}

// ── Next.js API route helper ──────────────────────────────────────────────────
// Create this at blog/app/api/geometry-vision-review/route.ts

function deepMerge(base: object, patch: object): object {
  const result = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof (result as Record<string, unknown>)[k] === 'object') {
      (result as Record<string, unknown>)[k] = deepMerge(
        (result as Record<string, unknown>)[k] as object,
        v as object,
      );
    } else {
      (result as Record<string, unknown>)[k] = v;
    }
  }
  return result;
}
