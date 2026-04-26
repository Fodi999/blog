'use client';

import { useLocale } from 'next-intl';
import {
  Leaf, Droplets, Wind, ChefHat, Flame, CookingPot,
  CloudFog, Snowflake, Sun, Archive,
} from 'lucide-react';
import type { ApiIngredientStateListItem } from '@/lib/api';

/* ── Icons per state ─────────────────────────────────────────── */
const STATE_ICONS: Record<string, React.ElementType> = {
  raw:     Leaf,
  boiled:  Droplets,
  steamed: Wind,
  baked:   ChefHat,
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
    <div className="flex flex-wrap gap-2">
      {states.map((s) => {
        const Icon = STATE_ICONS[s.state] ?? Flame;
        const isActive = s.state === active;
        const cal = s.calories_per_100g;
        const rawCal = rawState?.calories_per_100g ?? null;

        return (
          <button
            key={s.state}
            onClick={() => onChange(s.state)}
            className={`group flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all duration-200 min-w-[64px] ${
              isActive
                ? 'border-primary bg-primary/10 shadow-sm scale-[1.03]'
                : 'border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-primary/5'
            }`}
          >
            <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/70'}`} />
            <span className={`text-[10px] font-bold capitalize leading-none text-center ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              {suffix(s, locale)}
            </span>
            {cal != null && (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] tabular-nums text-muted-foreground/70 font-medium leading-none">
                  {Math.round(cal)} kcal
                </span>
                {s.state !== 'raw' && <Delta raw={rawCal} cur={cal} />}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
