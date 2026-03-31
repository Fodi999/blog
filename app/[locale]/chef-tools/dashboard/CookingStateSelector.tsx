'use client';

import { useLocale } from 'next-intl';
import {
  Leaf, Droplets, Wind, Sparkles, Flame, CookingPot,
  CloudFog, Snowflake, Sun, Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApiIngredientStateListItem } from '@/lib/api';

/* ── Icons per state ─────────────────────────────────────────── */
const STATE_ICONS: Record<string, React.ElementType> = {
  raw:     Leaf,
  boiled:  Droplets,
  steamed: Wind,
  baked:   Sparkles,
  grilled: Flame,
  fried:   CookingPot,
  smoked:  CloudFog,
  frozen:  Snowflake,
  dried:   Sun,
  pickled: Archive,
};

/* ── Localized suffix ───────────────────────────────────────── */
function suffix(s: ApiIngredientStateListItem, locale: string): string {
  if (locale === 'ru' && s.name_suffix_ru) return s.name_suffix_ru;
  if (locale === 'pl' && s.name_suffix_pl) return s.name_suffix_pl;
  if (locale === 'uk' && s.name_suffix_uk) return s.name_suffix_uk;
  return s.name_suffix_en;
}

/* ── Delta badge ─────────────────────────────────────────────── */
function Delta({ raw, cur }: { raw: number | null; cur: number | null }) {
  if (raw == null || cur == null || raw === 0) return null;
  const diff = Math.round(((cur - raw) / raw) * 100);
  if (Math.abs(diff) < 1) return null;
  const positive = diff > 0;
  return (
    <span className={`text-[9px] font-bold tabular-nums leading-none ${positive ? 'text-rose-500' : 'text-emerald-500'}`}>
      {positive ? '+' : ''}{diff}%
    </span>
  );
}

/* ── Props ───────────────────────────────────────────────────── */
type Props = {
  states: ApiIngredientStateListItem[];
  active: string;
  onChange: (state: string) => void;
  rawState: ApiIngredientStateListItem | undefined;
};

/* ── Component ───────────────────────────────────────────────── */
export function CookingStateSelector({ states, active, onChange, rawState }: Props) {
  const locale = useLocale();

  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
      {states.map((s) => {
        const Icon = STATE_ICONS[s.state] ?? Flame;
        const isActive = s.state === active;
        const cal = s.calories_per_100g;
        const rawCal = rawState?.calories_per_100g ?? null;

        return (
          <button
            key={s.state}
            onClick={() => onChange(s.state)}
            className={cn(
              "group flex flex-col items-center gap-3 px-4 py-4 rounded-[2rem] border transition-all duration-500 hover-lift shadow-sm",
              isActive
                ? 'border-primary bg-primary/10 shadow-xl shadow-primary/10 scale-[1.02] z-10'
                : 'border-border/40 bg-card/40 backdrop-blur-md hover:border-primary/20 hover:bg-card/60'
            )}
          >
            <div className={cn("p-2 rounded-2xl transition-all duration-500", isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-muted/40 text-muted-foreground/60 group-hover:text-primary group-hover:scale-110')}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="text-center min-w-0 w-full">
              <span className={cn(
                "text-[9px] sm:text-[10px] font-black uppercase tracking-[0.05em] leading-[1.1] block transition-colors px-0.5 min-h-[2.2em] flex items-center justify-center",
                isActive ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-foreground'
              )}>
                {suffix(s, locale)}
              </span>
              {cal != null && (
                <div className="mt-2 pt-2 border-t border-border/10">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={cn("text-[10px] sm:text-[11px] tabular-nums font-black leading-none", isActive ? 'text-primary' : 'text-muted-foreground/40')}>
                      {Math.round(cal)} <span className="text-[8px] opacity-40">kcal</span>
                    </span>
                    {s.state !== 'raw' && (
                      <Delta raw={rawCal} cur={cal} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
