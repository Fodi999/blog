'use client';

/**
 * Top of the Copilot panel — shows where the user is, what's selected,
 * and the AI-actions balance. The bar is what makes Copilot feel
 * "context-aware" (VS Code's status bar equivalent).
 */
import { Bot, Coins } from 'lucide-react';

import { useCopilot } from './CopilotProvider';
import type { CopilotScreen } from '@/lib/copilot-api';

const SCREEN_LABELS: Record<CopilotScreen, string> = {
  dashboard: 'Dashboard',
  inventory: 'Inventory',
  dishes: 'Dishes',
  recipes: 'Recipes',
  laboratory: 'Laboratory',
  menu_engineering: 'Menu engineering',
  pricing: 'Pricing',
  profile: 'Profile',
  chat: 'Chat',
};

export function CopilotContextBar() {
  const { page, selectedEntity, actionsLeft } = useCopilot();

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">ChefOS Copilot</p>
          <p className="truncate text-xs text-muted-foreground">
            {SCREEN_LABELS[page]}
            {selectedEntity?.name ? ` · ${selectedEntity.name}` : ''}
          </p>
        </div>
      </div>
      {actionsLeft !== null && (
        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground">
          <Coins className="h-3 w-3" />
          {actionsLeft}
        </span>
      )}
    </div>
  );
}
