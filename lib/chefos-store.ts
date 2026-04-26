'use client';

/**
 * ChefOS shared client cache — turns the web app into a single organism.
 *
 * Goals (mirrors the iOS pattern with `@Published` ViewModels +
 * `NotificationCenter` cross-screen events):
 *   • Backend is the single source of truth.
 *   • Every page that needs a "resource" (inventory, recipes, dashboard, …)
 *     subscribes through `useResource(key, fetcher)`.
 *   • A single mutation anywhere in the app calls `invalidate(key)` →
 *     every subscriber across every page re-fetches automatically.
 *   • When the tab regains focus, all live subscribers refresh in parallel.
 *   • Every 30s while the tab is visible, all live subscribers refresh
 *     silently (lightweight polling — keeps web in sync with what the
 *     iOS app or another browser tab might have changed).
 *   • Cross-tab sync via BroadcastChannel: invalidating in one tab fires
 *     the same invalidation in every other open tab.
 *
 * Why no @tanstack/react-query yet?
 *   — Zero new deps, full control, exact same mental model on iOS and Web.
 *     The API surface (`useResource` / `invalidate` / `mutate`) maps
 *     cleanly onto `useQuery` / `queryClient.invalidateQueries` if we
 *     ever outgrow this.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Resource keys ────────────────────────────────────────────────────────────
// String literal union so callers can't typo a key. Add new domains here as
// the app grows (plan, shopping, chat, billing, …). The shape is intentionally
// flat — finer granularity (e.g. per-recipe-id) is not needed at this stage.

export type ResourceKey =
  | 'me'
  | 'preferences'
  | 'inventory'
  | 'inventory-dashboard'
  | 'dishes'
  | 'recipes'
  | 'plan'
  | 'shopping'
  | 'usage';

// ── Subscription bus ─────────────────────────────────────────────────────────

type Listener = () => void;
const listeners = new Map<ResourceKey, Set<Listener>>();

function subscribe(key: ResourceKey, fn: Listener): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(fn);
  return () => {
    set!.delete(fn);
    if (set!.size === 0) listeners.delete(key);
  };
}

function fire(key: ResourceKey) {
  listeners.get(key)?.forEach((fn) => {
    try {
      fn();
    } catch {
      /* swallow — one bad subscriber must not break the rest */
    }
  });
}

// ── Cross-tab via BroadcastChannel ──────────────────────────────────────────
// If the user has /app/inventory open in two tabs and adds a product in one,
// the other tab refetches instantly. Falls back to no-op in old browsers /
// SSR (we only construct it lazily on the client).

const CHANNEL_NAME = 'chefos:invalidate';
let bc: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (bc) return bc;
  if (typeof BroadcastChannel === 'undefined') return null;
  bc = new BroadcastChannel(CHANNEL_NAME);
  bc.onmessage = (ev) => {
    const key = ev.data as ResourceKey | undefined;
    if (key) fire(key);
  };
  return bc;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Notify every subscriber of `key` (in this tab AND every other open tab)
 * that data behind that key just changed and should be re-fetched.
 *
 * Call this immediately after any successful POST/PUT/DELETE.
 */
export function invalidate(...keys: ResourceKey[]): void {
  const channel = getChannel();
  for (const k of keys) {
    fire(k);
    channel?.postMessage(k);
  }
}

/**
 * Subscribe a `refetch` callback to a resource key + auto-refetch on
 * tab visibility change + lightweight polling every `pollMs` while the
 * tab is visible.
 *
 * `pollMs = 0` disables polling for that subscriber (e.g. a slow query
 * the dashboard only refreshes on demand).
 */
export function useChefOSSync(
  keys: ResourceKey | ResourceKey[],
  refetch: () => void | Promise<void>,
  pollMs: number = 30_000,
): void {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    const list = Array.isArray(keys) ? keys : [keys];
    const safeRefetch = () => {
      void refetchRef.current();
    };

    // 1. Subscribe to every requested key.
    const unsubs = list.map((k) => subscribe(k, safeRefetch));

    // 2. Refetch when the tab becomes visible again.
    const onVisible = () => {
      if (typeof document !== 'undefined' && !document.hidden) safeRefetch();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible);
    }

    // 3. Optional polling — only fires while the tab is visible.
    let interval: ReturnType<typeof setInterval> | null = null;
    if (pollMs > 0) {
      interval = setInterval(() => {
        if (typeof document !== 'undefined' && !document.hidden) safeRefetch();
      }, pollMs);
    }

    return () => {
      unsubs.forEach((u) => u());
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisible);
      }
      if (interval) clearInterval(interval);
    };
    // We intentionally only re-subscribe when keys / pollMs change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Array.isArray(keys) ? keys.join('|') : keys, pollMs]);
}

/**
 * Tiny "online" hint — useful to badge the UI when the browser is
 * offline so users understand why mutations are failing.
 */
export function useIsOnline(): boolean {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

/**
 * Convenience helper — bind a stable `() => invalidate(keys)` once.
 * Useful as a callback for child components.
 */
export function useInvalidator(...keys: ResourceKey[]) {
  return useCallback(() => invalidate(...keys), [keys.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
}
