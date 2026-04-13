'use client';

/**
 * ChatCards — pure render components for ChefOS chat cards.
 * No logic — only takes data from API and renders it.
 *
 * Contract: cards[] from POST /public/chat
 */

import Image from 'next/image';
import {
  Flame, Dumbbell, Droplets, Wheat, ArrowRight, Leaf, Scale,
  Beef, Egg, Carrot, Apple, Fish, CookingPot, UtensilsCrossed,
  Sparkles, ChefHat, Clock, RefreshCcw, BookOpen, ClipboardList,
  Lightbulb, Heart, Hand, Salad,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Card, ProductCard, ConversionCard, NutritionCard } from '@/lib/chef-chat-api';

// ── Emoji → Icon mapping (shared with AISousChef) ─────────────────────────────

const EMOJI_ICON_MAP: Record<string, { icon: any; color: string }> = {
  '🍽': { icon: UtensilsCrossed, color: 'text-orange-400' },
  '🍽️': { icon: UtensilsCrossed, color: 'text-orange-400' },
  '⚖️': { icon: Scale, color: 'text-blue-400' },
  '⚖': { icon: Scale, color: 'text-blue-400' },
  '👨‍🍳': { icon: ChefHat, color: 'text-violet-400' },
  '🧑‍🍳': { icon: ChefHat, color: 'text-violet-400' },
  '🎩': { icon: ChefHat, color: 'text-violet-400' },
  '⏱': { icon: Clock, color: 'text-sky-400' },
  '⏱️': { icon: Clock, color: 'text-sky-400' },
  '⏰': { icon: Clock, color: 'text-sky-400' },
  '💡': { icon: Lightbulb, color: 'text-amber-400' },
  '🍳': { icon: CookingPot, color: 'text-orange-400' },
  '🔄': { icon: RefreshCcw, color: 'text-blue-400' },
  '📖': { icon: BookOpen, color: 'text-indigo-400' },
  '📋': { icon: ClipboardList, color: 'text-teal-400' },
  '🥩': { icon: Beef, color: 'text-red-400' },
  '🥦': { icon: Leaf, color: 'text-green-400' },
  '🍚': { icon: Wheat, color: 'text-amber-400' },
  '🥚': { icon: Egg, color: 'text-yellow-400' },
  '🥕': { icon: Carrot, color: 'text-orange-400' },
  '🍎': { icon: Apple, color: 'text-red-400' },
  '🌿': { icon: Leaf, color: 'text-emerald-400' },
  '🥗': { icon: Salad, color: 'text-green-400' },
  '🥬': { icon: Leaf, color: 'text-green-400' },
  '🍗': { icon: Beef, color: 'text-amber-400' },
  '🍖': { icon: Beef, color: 'text-red-400' },
  '🐟': { icon: Fish, color: 'text-blue-400' },
  '🐠': { icon: Fish, color: 'text-cyan-400' },
  '🍲': { icon: CookingPot, color: 'text-orange-400' },
  '💪': { icon: Dumbbell, color: 'text-blue-400' },
  '🔥': { icon: Flame, color: 'text-orange-500' },
  '❤️': { icon: Heart, color: 'text-rose-400' },
  '🌟': { icon: Sparkles, color: 'text-yellow-400' },
  '⭐': { icon: Sparkles, color: 'text-yellow-400' },
  '✨': { icon: Sparkles, color: 'text-purple-400' },
  '👋': { icon: Hand, color: 'text-amber-400' },
  '🌶': { icon: Flame, color: 'text-red-400' },
  '🌶️': { icon: Flame, color: 'text-red-400' },
  '🍋': { icon: Apple, color: 'text-yellow-400' },
  '🍅': { icon: Apple, color: 'text-red-400' },
  '📊': { icon: Flame, color: 'text-emerald-400' },
};

const CARD_EMOJI_RE = new RegExp(
  '(' + Object.keys(EMOJI_ICON_MAP).map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')',
  'g',
);

/** Replace emoji in text with inline Lucide icons */
function RichText({ text }: { text: string }) {
  const segments = text.split(CARD_EMOJI_RE);
  return (
    <>
      {segments.map((seg, i) => {
        const entry = EMOJI_ICON_MAP[seg];
        if (entry) {
          const Icon = entry.icon;
          return <Icon key={i} className={cn('inline-block w-3.5 h-3.5 align-text-bottom mx-0.5', entry.color)} />;
        }
        return <span key={i}>{seg}</span>;
      })}
    </>
  );
}

// ── Tag colours ───────────────────────────────────────────────────────────────

const TAG_STYLES: Record<string, string> = {
  high_protein: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
  low_calorie:  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  balanced:     'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

const TAG_ICONS: Record<string, any> = {
  high_protein: Dumbbell,
  low_calorie:  Leaf,
  balanced:     Scale,
};

const TAG_LABELS: Record<string, string> = {
  high_protein: 'high protein',
  low_calorie:  'low calorie',
  balanced:     'balanced',
};

// ── ProductCard ───────────────────────────────────────────────────────────────

function ProductCardView({ card }: { card: ProductCard }) {
  const TagIcon = card.reason_tag ? TAG_ICONS[card.reason_tag] : null;

  return (
    <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5 group">
      {/* Image */}
      {card.image_url && (
        <div className="relative h-36 sm:h-40 w-full bg-muted/20 overflow-hidden">
          <Image
            src={card.image_url}
            alt={card.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <p className="font-extrabold text-sm text-foreground leading-tight">{card.name}</p>
          {card.reason_tag && TAG_LABELS[card.reason_tag] && (
            <span className={cn(
              'shrink-0 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border',
              TAG_STYLES[card.reason_tag],
            )}>
              {TagIcon && <TagIcon className="w-2.5 h-2.5" />}
              {TAG_LABELS[card.reason_tag]}
            </span>
          )}
        </div>

        {/* Highlight — with emoji → icon replacement */}
        {card.highlight && (
          <p className="text-[11px] text-muted-foreground/70 font-medium leading-relaxed">
            <RichText text={card.highlight} />
          </p>
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
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-muted/15 p-1.5 border border-border/10">
      <span className={cn('flex items-center gap-0.5', color)}>
        {icon}
        <span className="text-[11px] font-black tabular-nums">{Math.round(value)}</span>
      </span>
      <span className="text-[7px] font-bold text-muted-foreground/50 uppercase tracking-widest">{label}</span>
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
    <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5 group">
      {card.image_url && (
        <div className="relative h-36 sm:h-40 w-full bg-muted/20 overflow-hidden">
          <Image src={card.image_url} alt={card.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="400px" />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
        </div>
      )}
      <div className="p-4 space-y-3">
        <p className="font-extrabold text-sm text-foreground">{card.name}</p>
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
