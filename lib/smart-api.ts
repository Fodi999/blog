/* ──────────────────────────────────────────────────────────────────
   SmartService v3 — API Client
   
   Single entry-point for the /api/smart/ingredient endpoint.
   Manages session_id automatically for conversation continuity.
   ────────────────────────────────────────────────────────────────── */

import type { SmartRequest, SmartResponse } from '@/types/smart';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';

let currentSessionId: string | null = null;

/**
 * Call the SmartService v3 decision engine.
 *
 * Automatically injects the previous `session_id` if none is provided,
 * and saves the returned one for the next call (conversation chain).
 */
export async function fetchSmart(req: SmartRequest): Promise<SmartResponse> {
  // Inject session continuity
  if (currentSessionId && !req.session_id) {
    req.session_id = currentSessionId;
  }

  const res = await fetch(`${API_BASE}/api/smart/ingredient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    throw new Error(`Smart API ${res.status}: ${res.statusText}`);
  }

  const data: SmartResponse = await res.json();

  // Persist session for chaining
  if (data.session_id) {
    currentSessionId = data.session_id;
  }

  return data;
}

/** Reset the stored session (e.g. when the user clears the dish). */
export function resetSmartSession() {
  currentSessionId = null;
}

/** Get the current session_id (for debugging / display). */
export function getSmartSessionId(): string | null {
  return currentSessionId;
}
