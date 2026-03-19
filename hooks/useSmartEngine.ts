/* ──────────────────────────────────────────────────────────────────
   useSmartEngine — React hook for SmartService v3
   
   Wraps fetchSmart with loading / error state management.
   Re-fetches whenever the dish composition, goal, or locale changes.
   ────────────────────────────────────────────────────────────────── */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchSmart, resetSmartSession } from '@/lib/smart-api';
import type { SmartRequest, SmartResponse, Goal } from '@/types/smart';

interface UseSmartEngineOptions {
  /** Primary ingredient slug */
  slug: string;
  /** Cooking state — "raw" | "grilled" | … */
  state?: string;
  /** Additional ingredient slugs already in the dish */
  extras?: string[];
  /** User goal */
  goal?: Goal;
  /** Locale */
  lang?: string;
}

export function useSmartEngine({
  slug,
  state = 'raw',
  extras = [],
  goal,
  lang = 'en',
}: UseSmartEngineOptions) {
  const [data, setData]       = useState<SmartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Track the request identity to avoid stale responses
  const reqId = useRef(0);

  const analyze = useCallback(async (overrides?: Partial<SmartRequest>) => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const req: SmartRequest = {
        ingredient: slug,
        state: state !== 'raw' ? state : undefined,
        additional_ingredients: extras.length > 0 ? extras : undefined,
        goal,
        lang,
        ...overrides,
      };
      const result = await fetchSmart(req);
      if (id !== reqId.current) return; // stale
      setData(result);
    } catch (e: any) {
      if (id !== reqId.current) return;
      setError(e.message ?? 'Smart API error');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [slug, state, extras, goal, lang]);

  // Auto-analyze when inputs change
  const extrasKey = extras.join(',');
  useEffect(() => {
    if (!slug) return; // skip when no primary ingredient (e.g. from-text mode)
    analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, state, extrasKey, goal, lang]);

  /** Full reset — clears data + session */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    resetSmartSession();
  }, []);

  return { data, loading, error, analyze, reset };
}
