'use client';

/**
 * Plan card — preview of a write action returned by the backend.
 * Renders the diff (`before → after`) for every change and offers
 * Confirm / Cancel. Confirm hits POST /api/copilot/actions/:id/confirm.
 */
import { Check, X, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ActionPlan, ActionPlanType } from '@/lib/copilot-api';

const PLAN_TITLES: Record<ActionPlanType, string> = {
  add_inventory_items: 'Add inventory',
  update_inventory_items: 'Update inventory',
  adjust_inventory_quantity: 'Adjust quantity',
  write_off_inventory: 'Write off',
  create_purchase_draft: 'Create purchase draft',
  send_purchase_order: 'Send purchase order',
  update_dish_price: 'Update dish price',
  generate_lab_recipe: 'Generate lab recipe',
  generate_product_report: 'Generate report',
  simulate_lab_product: 'Simulate product',
  create_recipe: 'Create recipe',
  create_dish: 'Create dish',
  no_write_action: 'No action',
};

export function CopilotPlanCard({
  plan,
  status,
  onConfirm,
  onCancel,
}: {
  plan: ActionPlan;
  status: 'pending' | 'confirmed' | 'cancelled' | 'failed';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const title = PLAN_TITLES[plan.plan_type] ?? plan.plan_type;
  const busy = false; // future: per-action spinner if we wire optimistic state

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        {status !== 'pending' && (
          <span
            className={
              status === 'confirmed'
                ? 'text-xs font-medium text-emerald-500'
                : status === 'failed'
                  ? 'text-xs font-medium text-destructive'
                  : 'text-xs font-medium text-muted-foreground'
            }
          >
            {status}
          </span>
        )}
      </div>

      {plan.changes.length > 0 ? (
        <ul className="divide-y divide-border/60">
          {plan.changes.map((c, i) => (
            <li key={i} className="px-3 py-2 text-sm">
              <p className="font-medium">{c.entity}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-mono">{c.field}</span>:{' '}
                {c.before !== null && (
                  <>
                    <span className="line-through">{c.before}</span>{' '}
                    <span aria-hidden>→</span>{' '}
                  </>
                )}
                <span className="font-medium text-foreground">
                  {c.after}
                  {c.unit ? ` ${c.unit}` : ''}
                </span>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-3 py-3 text-xs text-muted-foreground">No diff to preview.</p>
      )}

      {status === 'pending' && (
        <div className="flex gap-2 border-t border-border/60 bg-muted/30 px-3 py-2">
          <Button size="sm" className="flex-1" onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
            Confirm
          </Button>
          <Button size="sm" variant="ghost" className="flex-1" onClick={onCancel} disabled={busy}>
            <X className="mr-1 h-3 w-3" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
