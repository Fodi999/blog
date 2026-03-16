'use client';

import { Plus } from 'lucide-react';

type SuggestionItem = {
  slug: string;
  name: string;
  image_url?: string;
  score: number;
  reasons: string[];
  fills: string[];
};

export function SuggestionCard({ suggestion }: { suggestion: SuggestionItem }) {
  const s = suggestion;

  return (
    <div className="group border border-border/60 rounded-2xl p-4 hover:border-primary/40 hover:shadow-md transition-all duration-200 bg-background">
      <div className="flex items-start gap-3">
        {/* Icon / Image */}
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
          {s.image_url ? (
            <img src={s.image_url} alt={s.name} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <Plus className="h-5 w-5 text-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-black uppercase tracking-tight truncate">
              {s.name}
            </h4>
            <span className="text-xs font-black text-primary shrink-0">
              {s.score}%
            </span>
          </div>

          {/* Reasons */}
          <div className="mt-1.5 space-y-0.5">
            {s.reasons.slice(0, 2).map((reason, i) => (
              <p key={i} className="text-xs text-muted-foreground leading-tight">
                {reason}
              </p>
            ))}
          </div>

          {/* Gap fills */}
          {s.fills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {s.fills.map(f => (
                <span
                  key={f}
                  className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20"
                >
                  + {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
