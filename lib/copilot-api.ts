/**
 * Copilot API client — wraps /api/copilot/* endpoints.
 *
 * Backend reference: src/interfaces/http/copilot.rs
 *   POST   /api/copilot/message                  → CopilotResponse
 *   POST   /api/copilot/actions/:id/confirm      → ConfirmResult
 *   DELETE /api/copilot/actions/:id              → CancelResult
 *
 * The Copilot is screen-aware: every message carries the current page
 * (`screen`) and optional `entity_id`, so it knows whether the user is
 * looking at inventory, a dish, a recipe or a lab experiment.
 */
import { api } from './chefos-api';
import type { WorkspaceCommand } from '@/components/workspace/WorkspaceCommands';

// ── Screen / Context ─────────────────────────────────────────────────────────

export type CopilotScreen =
  | 'dashboard'
  | 'inventory'
  | 'dishes'
  | 'recipes'
  | 'laboratory'
  | 'menu_engineering'
  | 'pricing'
  | 'profile'
  | 'chat';

export type CopilotEntityType = 'inventory_item' | 'dish' | 'recipe' | 'experiment';

export type CopilotSelectedEntity = {
  type: CopilotEntityType;
  id: string;
  name?: string;
};

// ── Action plan ──────────────────────────────────────────────────────────────

export type ActionPlanType =
  | 'add_inventory_items'
  | 'update_inventory_items'
  | 'adjust_inventory_quantity'
  | 'write_off_inventory'
  | 'create_purchase_draft'
  | 'send_purchase_order'
  | 'update_dish_price'
  | 'generate_lab_recipe'
  | 'generate_product_report'
  | 'simulate_lab_product'
  | 'create_recipe'
  | 'create_dish'
  | 'no_write_action';

export type ActionChange = {
  entity: string;
  field: string;
  before: string | null;
  after: string;
  unit: string | null;
};

export type ActionPlan = {
  id: string;
  plan_type: ActionPlanType;
  changes: ActionChange[];
  write_tool: string | null;
  payload: unknown;
};

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type CopilotResponse = {
  answer: string;
  used_tools: string[];
  requires_confirmation: boolean;
  action_plan: ActionPlan | null;
  actions_cost: number;
  actions_left: number;
  risk_level: RiskLevel;
  billing_warning: string | null;
  /** Immediate workspace/scene commands from the AI planner. */
  workspace_commands?: WorkspaceCommand[];
};

// ── Requests ─────────────────────────────────────────────────────────────────

export type CopilotMessageRequest = {
  message: string;
  screen?: CopilotScreen;
  entity_id?: string | null;
  locale?: string;
};

export function sendCopilotMessage(
  req: CopilotMessageRequest,
  signal?: AbortSignal,
): Promise<CopilotResponse> {
  return api.post<CopilotResponse>('/api/copilot/message', req, { signal });
}

export function confirmCopilotAction(planId: string): Promise<unknown> {
  return api.post<unknown>(`/api/copilot/actions/${planId}/confirm`, {});
}

export function cancelCopilotAction(planId: string): Promise<unknown> {
  return api.delete<unknown>(`/api/copilot/actions/${planId}`);
}
