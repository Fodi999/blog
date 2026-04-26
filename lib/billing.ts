/**
 * Stripe billing client.
 *
 * Two endpoints on the backend:
 *   • GET  /api/billing/bundles   — public catalog (no auth)
 *   • POST /api/billing/checkout  — authenticated; returns hosted URL
 *
 * The webhook (`/webhooks/stripe`) is server-to-server and never called
 * from the browser.
 */

import { api } from './chefos-api';

export interface BillingBundle {
  /** Stable server key, e.g. "actions_20". */
  key: string;
  /** Human label, e.g. "20 actions". */
  label: string;
  /** How many actions get credited on successful payment. */
  actions: number;
  /** Display-only price in EUR cents. Real charge is the Stripe price object. */
  price_eur_cents: number;
}

export interface CheckoutResponse {
  url: string;
}

/** Fetch the public catalog of action bundles. */
export async function listBundles(): Promise<BillingBundle[]> {
  return api.get<BillingBundle[]>('/api/billing/bundles', { anonymous: true });
}

/**
 * Create a Stripe Checkout Session for the given bundle and return the
 * hosted URL. The browser must then `window.location.assign(url)` to
 * redirect into Stripe-hosted checkout — never embed via iframe.
 */
export async function createCheckout(bundleKey: string): Promise<string> {
  const resp = await api.post<CheckoutResponse>('/api/billing/checkout', {
    bundle: bundleKey,
  });
  return resp.url;
}

/** Format `price_eur_cents` (e.g. 199) → "€1.99". */
export function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

/** Per-action effective price — used to render "save 40%" badges. */
export function pricePerAction(b: BillingBundle): number {
  return b.price_eur_cents / 100 / b.actions;
}
