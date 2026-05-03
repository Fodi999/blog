'use client';

/**
 * CopilotInsights — the "AI workspace" zone of the right rail.
 *
 * Pages register what the Copilot should highlight via
 * `useSetCopilotInsights({ title, subtitle, alerts, quickPrompts })`.
 * This block sits above the conversation, so the panel feels active
 * the moment the user opens a screen — even before they type anything.
 *
 * Each alert is clickable: tapping it sends its `prompt` to Copilot,
 * turning a static "1 item expiring" line into "show items that
 * expire soon".
 */
import { AlertTriangle, ChevronRight, Info, ShieldAlert, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useCopilot, type CopilotInsight } from './CopilotProvider';

const TONE: Record<NonNullable<CopilotInsight['tone']>, { icon: typeof Info; cls: string }> = {
  info: { icon: Info, cls: 'text-sky-500' },
  warn: { icon: AlertTriangle, cls: 'text-amber-500' },
  danger: { icon: ShieldAlert, cls: 'text-destructive' },
  success: { icon: Sparkles, cls: 'text-emerald-500' },
};

export function CopilotInsights() {
  const { insights, sendMessage, pending } = useCopilot();

  if (!insights || (insights.alerts.length === 0 && insights.quickPrompts.length === 0 && !insights.title)) {
    return null;
  }

  return (
    <div className="border-b border-border/60 bg-muted/30 px-4 py-3">
      {(insights.title || insights.subtitle) && (
        <div className="mb-2">
          {insights.title && (
            <p className="text-sm font-semibold leading-tight">{insights.title}</p>
          )}
          {insights.subtitle && (
            <p className="text-xs text-muted-foreground">{insights.subtitle}</p>
          )}
        </div>
      )}

      {insights.alerts.length > 0 && (
        <ul className="space-y-1">
          {insights.alerts.map((a, i) => {
            const tone = TONE[a.tone ?? 'info'];
            const Icon = tone.icon;
            const clickable = !!a.prompt;
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={!clickable || pending}
                  onClick={() => a.prompt && void sendMessage(a.prompt)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                    clickable
                      ? 'hover:bg-background hover:shadow-sm disabled:opacity-60'
                      : 'cursor-default',
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', tone.cls)} />
                  <span className="flex-1 truncate font-medium">{a.label}</span>
                  {clickable && <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {insights.quickPrompts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {insights.quickPrompts.map((q, i) => (
            <Button
              key={i}
              size="sm"
              variant={q.tone === 'primary' ? 'default' : 'outline'}
              className="h-7 rounded-full px-2.5 text-xs"
              disabled={pending}
              onClick={() => void sendMessage(q.prompt)}
            >
              {q.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
