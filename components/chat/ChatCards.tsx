'use client';

/**
 * ChatCards — pure render components for ChefOS chat cards.
 * No logic — only takes data from API and renders it.
 *
 * Contract: cards[] from POST /public/chat
 */

import Image from 'next/image';
import { Flame, Dumbbell, Droplets, Wheat, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Card, ProductCard, ConversionCard, NutritionCard } from '@/lib/chef-chat-api';

// ── Tag colours ───────────────────────────────────────────────────────────────

const TAG_STYLES: Record<string, string> = {
  high_protein: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
  low_calorie:  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  balanced:     'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

const TAG_LABELS: Record<string, string> = {
  high_protein: '💪 high protein',
  low_calorie:  '🌿 low calorie',
  balanced:     '⚖️ balanced',
};

// ── ProductCard ───────────────────────────────────────────────────────────────

function ProductCardView({ card }: { card: ProductCard }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
      {/* Image strip */}
      {card.image_url && (
        <div className="relative h-36 w-full bg-muted/20">
          <Image
            src={card.image_url}
            alt={card.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 400px"
          />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm text-foreground leading-snug">{card.name}</p>
          {card.reason_tag && (
            <span className={cn(
              'shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
              TAG_STYLES[card.reason_tag],
            )}>
              {TAG_LABELS[card.reason_tag]}
            </span>
          )}
        </div>

        {/* Highlight */}
        {card.highlight && (
          <p className="text-xs text-muted-foreground">{card.highlight}</p>
        )}

        {/* Macros grid */}
        {(card.calories_per_100g != null || card.protein_per_100g != null) && (
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <MacroChip icon={<Flame className="w-3 h-3" />} label="kcal" value={card.calories_per_100g} color="text-orange-500" />
            <MacroChip icon={<Dumbbell className="w-3 h-3" />} label="prot" value={card.protein_per_100g} color="text-blue-500" />
            <MacroChip icon={<Droplets className="w-3 h-3" />} label="fat" value={card.fat_per_100g} color="text-yellow-500" />
            <MacroChip icon={<Wheat className="w-3 h-3" />} label="carbs" value={card.carbs_per_100g} color="text-green-500" />
          </div>
        )}
      </div>
    </div>
  );
}

function MacroChip({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  color: string;
}) {
  if (value == null) return null;
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-muted/30 p-1.5">
      <span className={cn('flex items-center gap-0.5', color)}>
        {icon}
        <span className="text-[11px] font-bold">{Math.round(value)}</span>
      </span>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ── ConversionCard ────────────────────────────────────────────────────────────

function ConversionCardView({ card }: { card: ConversionCard }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-2xl font-black tabular-nums">
          {card.value} <span className="text-sm font-semibold text-muted-foreground">{card.from}</span>
        </span>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
        {card.supported ? (
          <span className="text-2xl font-black tabular-nums text-emerald-500">
            {card.result} <span className="text-sm font-semibold text-muted-foreground">{card.to}</span>
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">unsupported conversion</span>
        )}
      </div>
    </div>
  );
}

// ── NutritionCard ─────────────────────────────────────────────────────────────

function NutritionCardView({ card }: { card: NutritionCard }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
      {card.image_url && (
        <div className="relative h-32 w-full bg-muted/20">
          <Image src={card.image_url} alt={card.name} fill className="object-cover" sizes="400px" />
        </div>
      )}
      <div className="p-4 space-y-3">
        <p className="font-semibold text-sm">{card.name}</p>
        <div className="grid grid-cols-4 gap-1.5">
          <MacroChip icon={<Flame className="w-3 h-3" />} label="kcal" value={card.calories_per_100g} color="text-orange-500" />
          <MacroChip icon={<Dumbbell className="w-3 h-3" />} label="prot" value={card.protein_per_100g} color="text-blue-500" />
          <MacroChip icon={<Droplets className="w-3 h-3" />} label="fat" value={card.fat_per_100g} color="text-yellow-500" />
          <MacroChip icon={<Wheat className="w-3 h-3" />} label="carbs" value={card.carbs_per_100g} color="text-green-500" />
        </div>
      </div>
    </div>
  );
}

// ── Public export — renders any Card by type ──────────────────────────────────

export function ChatCardView({ card }: { card: Card }) {
  switch (card.type) {
    case 'product':    return <ProductCardView card={card} />;
    case 'conversion': return <ConversionCardView card={card} />;
    case 'nutrition':  return <NutritionCardView card={card} />;
  }
}

/** Renders a cards[] array as a responsive grid (1 col → 2 col → 3 col). */
export function ChatCardsGrid({ cards }: { cards: Card[] }) {
  if (!cards.length) return null;
  return (
    <div className={cn(
      'grid gap-3 mt-2',
      cards.length === 1 ? 'grid-cols-1 max-w-sm' :
      cards.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                           'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    )}>
      {cards.map((card, i) => (
        <ChatCardView key={i} card={card} />
      ))}
    </div>
  );
}
