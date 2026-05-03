'use client';

/**
 * Scrollable conversation history. Each assistant message can carry a
 * pending `ActionPlan` rendered via `<CopilotPlanCard />`.
 */
import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

import { useCopilot } from './CopilotProvider';
import { CopilotPlanCard } from './CopilotPlanCard';

export function CopilotMessages() {
  const { messages, pending, confirmPlan, cancelPlan, insights } = useCopilot();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, pending]);

  // If the page provided live insights, the panel is already "active" via
  // <CopilotInsights /> above us — don't show a generic empty state too.
  if (messages.length === 0 && !pending && !insights) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-medium">Copilot ready.</p>
        <p className="text-xs text-muted-foreground">
          Ask anything about your inventory, recipes or dishes — the panel knows what page
          you’re on.
        </p>
      </div>
    );
  }

  if (messages.length === 0 && !pending) {
    // Insights are visible — keep the messages area as a compact spacer
    // so the input doesn't jump up against them.
    return <div className="flex-1" />;
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {messages.map((m) => {
        if (m.role === 'user') {
          return (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                {m.text}
              </div>
            </div>
          );
        }
        return (
          <div key={m.id} className="space-y-2">
            <div className="max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
              {m.text}
            </div>
            {m.plan && m.plan.plan_type !== 'no_write_action' && (
              <CopilotPlanCard
                plan={m.plan}
                status={m.planStatus}
                onConfirm={() => confirmPlan(m.id)}
                onCancel={() => cancelPlan(m.id)}
              />
            )}
            {m.usedTools.length > 0 && (
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                tools: {m.usedTools.join(', ')}
              </p>
            )}
          </div>
        );
      })}

      {pending && (
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Copilot is thinking…
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
