'use client';

/**
 * Right rail in `<AppShell />`. Three modes:
 *   • collapsed (56 px)  — only an "AI" badge with pending count
 *   • normal   (380 px) — context bar + messages + quick actions + input
 *   • expanded (full)   — overlays the workspace, like a terminal
 *
 * Mounted once per session, so chat history survives navigation.
 */
import { Bot, ChevronLeft, ChevronRight, Maximize2, Minimize2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useCopilot } from './CopilotProvider';
import { CopilotContextBar } from './CopilotContextBar';
import { CopilotInsights } from './CopilotInsights';
import { CopilotMessages } from './CopilotMessages';
import { CopilotInput } from './CopilotInput';
import { CopilotQuickActions } from './CopilotQuickActions';

export function CopilotPanel({ className }: { className?: string }) {
  const { collapsed, setCollapsed, expanded, setExpanded, messages, clear } = useCopilot();
  const pendingPlans = messages.filter(
    (m) => m.role === 'assistant' && m.plan && m.planStatus === 'pending',
  ).length;

  if (collapsed) {
    return (
      <aside
        className={cn(
          // Lives inside the AppShell grid → just fill the cell.
          'flex h-full w-full flex-col items-center gap-2 border-l border-border/60 bg-background py-3',
          className,
        )}
      >
        <button
          type="button"
          aria-label="Expand Copilot"
          onClick={() => setCollapsed(false)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/15"
        >
          <Bot className="h-5 w-5" />
        </button>
        {pendingPlans > 0 && (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            {pendingPlans}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="mt-auto h-7 w-7"
          aria-label="Open Copilot"
          onClick={() => setCollapsed(false)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        expanded
          ? 'fixed inset-0 top-14 z-40 flex flex-col bg-background/95 backdrop-blur'
          : 'flex h-full w-full flex-col border-l border-border/60 bg-background',
        className,
      )}
    >
      <div className="flex items-center justify-end gap-1 border-b border-border/60 px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={expanded ? 'Restore Copilot' : 'Expand Copilot'}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Clear conversation"
          onClick={clear}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Collapse Copilot"
          onClick={() => {
            setExpanded(false);
            setCollapsed(true);
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <CopilotContextBar />
      <CopilotInsights />
      <CopilotMessages />
      <CopilotQuickActions />
      <CopilotInput />
    </aside>
  );
}
