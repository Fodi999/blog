/**
 * Usage / AI Wallet client.
 *
 * Mirrors the backend `UsageTodayResponse` (src/interfaces/http/usage.rs)
 * and exposes a single helper that the dashboard `<AiWalletCard />`
 * consumes.
 *
 * The wallet UI shows three primary numbers:
 *   • availableNow   — actions the user can spend right now
 *   • purchasedTotal — lifetime credits ever granted (purchases + bonuses)
 *   • usedTotal      — lifetime actions consumed from the purchased balance
 *
 * Plus one secondary metric:
 *   • bonusActions   — subset of `purchasedTotal` granted as welcome /
 *                      weekly bonus / promo (i.e. NOT real money).
 */
import { api } from './chefos-api';

export interface UsageLimits {
  plans: number;
  recipes: number;
  scans: number;
  optimize: number;
  chats: number;
}

export interface UsageCosts {
  generate_plan: number;
  create_recipe: number;
  scan_receipt: number;
  optimize_day: number;
  ai_chat: number;
}

export interface UsageTodayResponse {
  plans_left: number;
  recipes_left: number;
  scans_left: number;
  optimize_left: number;
  chats_left: number;
  /** Current spendable balance. */
  purchased_actions: number;
  /** Lifetime credits ever added (purchases + all bonuses). */
  total_purchased: number;
  /** Lifetime actions ever consumed from the purchased balance. */
  total_spent: number;
  /** Lifetime credits granted from non-IAP sources. */
  bonus_actions: number;
  daily_limits: UsageLimits;
  costs: UsageCosts;
  welcome_bonus_granted: boolean;
}

/**
 * Derived view-model used by `<AiWalletCard />`.
 *
 * Purpose: keep the component dumb — all arithmetic happens here so it
 * can be unit-tested without React.
 */
export interface WalletView {
  availableNow: number;
  purchasedTotal: number;
  usedTotal: number;
  bonusActions: number;
  /** 0..100 — how much of the lifetime balance is still spendable. */
  remainingPercent: number;
  /** Convenience flags for badges. */
  isEmpty: boolean;
  isLow: boolean;
}

const LOW_THRESHOLD = 10;

export function buildWalletView(r: UsageTodayResponse): WalletView {
  const purchasedTotal = Math.max(0, r.total_purchased);
  const availableNow = Math.max(0, r.purchased_actions);
  const usedTotal = Math.max(0, r.total_spent);
  const bonusActions = Math.max(0, r.bonus_actions);

  const remainingPercent =
    purchasedTotal === 0 ? 0 : Math.round((availableNow / purchasedTotal) * 100);

  return {
    availableNow,
    purchasedTotal,
    usedTotal,
    bonusActions,
    remainingPercent,
    isEmpty: availableNow === 0,
    isLow: availableNow > 0 && availableNow <= LOW_THRESHOLD,
  };
}

/** GET /api/usage/today — requires JWT. */
export function getUsageToday(): Promise<UsageTodayResponse> {
  return api.get<UsageTodayResponse>('/api/usage/today');
}

// ─── Wallet history ─────────────────────────────────────────────────────────

export type TransactionKind = 'credit' | 'debit';

/** Stable identifier the UI translates into a localized label. */
export type TransactionSource =
  // credits
  | 'iap'
  | 'welcome_bonus'
  | 'weekly_bonus'
  | 'promo'
  // debits (action types)
  | 'generate_plan'
  | 'create_recipe'
  | 'scan_receipt'
  | 'optimize_day'
  | 'ai_chat'
  // fallback for unknown sources from the server
  | (string & {});

export interface WalletTransaction {
  id: string;
  kind: TransactionKind;
  source: TransactionSource;
  /** Always positive. Use `kind` to decide sign in UI. */
  actions: number;
  /** Only present on debits: 'free' | 'purchased'. */
  paid_from: 'free' | 'purchased' | null;
  /** ISO 8601 timestamp. */
  created_at: string;
}

export interface WalletHistoryResponse {
  transactions: WalletTransaction[];
  total: number;
}

/** GET /api/usage/history?limit=N — requires JWT. */
export function getUsageHistory(limit = 100): Promise<WalletHistoryResponse> {
  return api.get<WalletHistoryResponse>(`/api/usage/history?limit=${limit}`);
}

/**
 * Real money purchases = lifetime total minus everything granted as a bonus.
 * Useful when the UI wants to split "Покупки" vs "Бонусы".
 */
export function realPurchasedActions(r: UsageTodayResponse): number {
  return Math.max(0, r.total_purchased - r.bonus_actions);
}
