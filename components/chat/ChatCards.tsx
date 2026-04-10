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
    <div className="rounded-[1.5rem] border border-border/30 bg-card/40 backdrop-blur-md overflow-hidden transition-all hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5 group">
      {/* Image strip */}
      {card.image_url && (
        <div className="relative h-40 w-full bg-muted/20 overflow-hidden">
          <Image
            src={card.image_url}
            alt={card.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <p className="font-extrabold text-sm sm:text-base text-foreground leading-tight">{card.name}</p>
          {card.reason_tag && (
            <span className={cn(
              'shrink-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border',
              TAG_STYLES[card.reason_tag],
            )}>
              {TAG_LABELS[card.reason_tag]}
            </span>
          )}
        </div>

        {/* Highlight */}
        {card.highlight && (
          <p className="text-xs text-muted-foreground/80 font-medium leading-relaxed">{card.highlight}</p>
        )}

        {/* Macros grid */}
        {(card.calories_per_100g != null || card.protein_per_100g != null) && (
          <div className="grid grid-cols-4 gap-2 pt-1">
            <MacroChip icon={<Flame className="w-3.5 h-3.5" />} label="kcal" value={card.calories_per_100g} color="text-orange-500" />
            <MacroChip icon={<Dumbbell className="w-3.5 h-3.5" />} label="prot" value={card.protein_per_100g} color="text-blue-500" />
            <MacroChip icon={<Droplets className="w-3.5 h-3.5" />} label="fat" value={card.fat_per_100g} color="text-yellow-500" />
            <MacroChip icon={<Wheat className="w-3.5 h-3.5" />} label="carbs" value={card.carbs_per_100g} color="text-green-500" />
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
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-muted/20 p-2 border border-border/10">
      <span className={cn('flex items-center gap-1', color)}>
        {icon}
        <span className="text-xs font-black">{Math.round(value)}</span>
      </span>
      <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ── ConversionCard ────────────────────────────────────────────────────────────

function ConversionCardView({ card }: { card: ConversionCard }) {
  return (
    <div className="rounded-[1.5rem] border border-border/30 bg-card/40 backdrop-blur-md p-6 shadow-sm">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-3xl font-black tabular-nums tracking-tighter">
          {card.value} <span className="text-xs font-bold text-muted-foreground uppercase ml-1">{card.from}</span>
        </span>
        <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-primary shrink-0" />
        </div>
        {card.supported ? (
          <span className="text-3xl font-black tabular-nums text-emerald-500 tracking-tighter">
            {card.result} <span className="text-xs font-bold text-muted-foreground uppercase ml-1">{card.to}</span>
          </span>
        ) : (
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest italic">unsupported</span>
        )}
      </div>
    </div>
  );
}

// ── NutritionCard ─────────────────────────────────────────────────────────────

function NutritionCardView({ card }: { card: NutritionCard }) {
  return (
    <div className="rounded-[1.5rem] border border-border/30 bg-card/40 backdrop-blur-md overflow-hidden shadow-sm group">
      {card.image_url && (
        <div className="relative h-40 w-full bg-muted/20 overflow-hidden">
          <Image src={card.image_url} alt={card.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="400px" />
          <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
        </div>
      )}
      <div className="p-5 space-y-4">
        <p className="font-extrabold text-sm sm:text-base">{card.name}</p>
        <div className="grid grid-cols-4 gap-2">
          <MacroChip icon={<Flame className="w-3.5 h-3.5" />} label="kcal" value={card.calories_per_100g} color="text-orange-500" />
          <MacroChip icon={<Dumbbell className="w-3.5 h-3.5" />} label="prot" value={card.protein_per_100g} color="text-blue-500" />
          <MacroChip icon={<Droplets className="w-3.5 h-3.5" />} label="fat" value={card.fat_per_100g} color="text-yellow-500" />
          <MacroChip icon={<Wheat className="w-3.5 h-3.5" />} label="carbs" value={card.carbs_per_100g} color="text-green-500" />
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
