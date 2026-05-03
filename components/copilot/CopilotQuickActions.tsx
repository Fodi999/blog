'use client';

/**
 * Quick action chips — different per page. Clicking a chip prefills
 * the Copilot with a typical command for that screen.
 */
import { Button } from '@/components/ui/button';
import type { CopilotScreen } from '@/lib/copilot-api';
import { useCopilot } from './CopilotProvider';

const QUICK: Record<CopilotScreen, string[]> = {
  dashboard: ['Daily briefing', 'What needs attention today?'],
  inventory: ['What expires soon?', 'Add 10 kg rice', 'Write off expired chicken'],
  dishes: ['Lowest-margin dishes', 'Create dish from Caesar Base at €18'],
  recipes: ['Create recipe Caesar Salad', 'Scale recipe to 10 portions'],
  laboratory: ['Suggest cheaper formula', 'Convert experiment to recipe'],
  menu_engineering: ['Show pricing matrix'],
  pricing: ['How many actions are left?'],
  profile: [],
  chat: [],
};

export function CopilotQuickActions() {
  const { page, sendMessage, pending } = useCopilot();
  const items = QUICK[page] ?? [];
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 border-t border-border/60 px-3 py-2">
      {items.map((q) => (
        <Button
          key={q}
          variant="outline"
          size="sm"
          className="h-7 rounded-full px-2.5 text-xs"
          disabled={pending}
          onClick={() => void sendMessage(q)}
        >
          {q}
        </Button>
      ))}
    </div>
  );
}
