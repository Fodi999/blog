'use client';

/**
 * Copilot text input. Placeholder switches with the current page so it
 * feels like a kitchen command line.
 */
import { useState, type FormEvent } from 'react';
import { SendHorizonal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { CopilotScreen } from '@/lib/copilot-api';
import { useCopilot } from './CopilotProvider';

const PLACEHOLDERS: Record<CopilotScreen, string> = {
  dashboard: 'Ask: "What needs attention today?"',
  inventory: 'Ask: "Write off 2 kg of chicken" or "What expires soon?"',
  dishes: 'Ask: "Create dish Caesar Salad at €18 from Caesar Base"',
  recipes: 'Ask: "Create recipe Tom Yum for 10 portions"',
  laboratory: 'Ask: "Make mango-chili sauce cheaper than 2 zł / portion"',
  menu_engineering: 'Ask: "Which dishes have the lowest margin?"',
  pricing: 'Ask: "How many AI actions do I have left?"',
  profile: 'Ask Copilot…',
  chat: 'Ask Copilot…',
};

export function CopilotInput() {
  const { page, sendMessage, pending } = useCopilot();
  const [text, setText] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || pending) return;
    const v = text;
    setText('');
    void sendMessage(v);
  }

  return (
    <form onSubmit={onSubmit} className="border-t border-border/60 px-3 py-3">
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e as unknown as FormEvent);
            }
          }}
          rows={2}
          placeholder={PLACEHOLDERS[page]}
          className="min-h-[44px] flex-1 resize-none rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          disabled={pending}
        />
        <Button type="submit" size="icon" disabled={pending || !text.trim()} aria-label="Send">
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
