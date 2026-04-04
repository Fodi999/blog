'use client';

import { useState } from 'react';
import { Plus, ArrowRight, Lightbulb } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type SuggestionItem = {
  slug: string;
  name: string;
  image_url?: string;
  score: number;
  reasons: string[];
  fills: string[];
};

interface SuggestionCardProps {
  suggestion: SuggestionItem;
  onAdd?: (slug: string, name: string) => void;
}

export function SuggestionCard({ suggestion, onAdd }: SuggestionCardProps) {
  const s = suggestion;
  const t = useTranslations('chefTools.tools.recipeAnalyzer');
  const [showTip, setShowTip] = useState(false);

  const tipText = s.fills.length > 0
    ? s.fills.join(', ')
    : s.reasons[0] || '';

  return (
    <div
      className="group border border-border/60 rounded-2xl p-4 hover:border-primary/40 hover:shadow-md transition-all duration-200 bg-background relative"
    >
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
            <div className="flex items-center gap-1 shrink-0 relative">
              <button
                className="p-0.5 text-muted-foreground/40 hover:text-primary transition-colors"
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}
                onClick={() => setShowTip(!showTip)}
                aria-label="Why this ingredient"
              >
                <Lightbulb className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-black text-primary">
                {s.score}%
              </span>
              {showTip && tipText && (
                <div className="absolute right-0 bottom-full mb-2 z-50 w-48 p-2 rounded-lg bg-foreground text-background text-[11px] leading-snug shadow-lg pointer-events-none">
                  {tipText}
                  <div className="absolute bottom-0 right-3 translate-y-1/2 rotate-45 w-2 h-2 bg-foreground" />
                </div>
              )}
            </div>
          </div>          {/* Reasons */}
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

          {/* Add to recipe button */}
          {onAdd && (
            <button
              onClick={() => onAdd(s.slug, s.name)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 hover:border-primary/40 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('addToRecipe')}
              <ArrowRight className="h-3 w-3 opacity-50" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
