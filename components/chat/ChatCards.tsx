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
import type { Card, ProductCard, ConversionCard, NutritionCard, RecipeCard } from '@/lib/chef-chat-api';

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


// ── RecipeCard (TechCard) ─────────────────────────────────────────────────────

/** State label in Russian with gender emoji */
const STATE_EMOJI: Record<string, string> = {
  boiled: '♨️', sauteed: '🍳', fried: '🍳', baked: '🔥',
  grilled: '🔥', steamed: '💨', raw: '🥬', smoked: '🌫️',
};

const STATE_LABEL_RU: Record<string, string> = {
  boiled: 'варёный', sauteed: 'пассер.', fried: 'жареный',
  baked: 'запечён.', grilled: 'гриль', steamed: 'на пару',
  raw: 'сырой', smoked: 'копчён.',
};

const ROLE_COLORS: Record<string, string> = {
  protein: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  side: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  aromatic: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  spice: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  oil: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  condiment: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  liquid: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  base: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
};

const DISH_TYPE_ICON: Record<string, string> = {
  soup: '🍲', stew: '🫕', salad: '🥗', stirfry: '🥘', stir_fry: '🥘',
  grill: '🔥', bake: '🧁', pasta: '🍝', raw: '🐟', default: '🍽️',
};

function RecipeCardView({ card }: { card: RecipeCard }) {
  const dishIcon = DISH_TYPE_ICON[card.dish_type] ?? '🍽️';
  const title = card.display_name ?? card.dish_name_local ?? card.dish_name;
  const totalTime = card.steps.reduce((sum, s) => sum + (s.time_min ?? 0), 0);

  // ── Human-friendly time: 89→~1.5 ч, 25→~25 мин ──
  const fmtTime = (min: number): string => {
    if (min <= 0) return '';
    // Round to nearest 5
    const rounded = Math.round(min / 5) * 5;
    if (rounded < 60) return `~${rounded} мин`;
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    if (m === 0) return `~${h} ч`;
    return `~${h} ч ${m} мин`;
  };

  // Filter out water for display (show separately)
  const foodIngredients = card.ingredients.filter(i => i.role !== 'liquid');
  const liquidIngredient = card.ingredients.find(i => i.role === 'liquid');
  // Separate oil (special rendering — no state, add context)
  const oilIngredients = foodIngredients.filter(i => i.role === 'oil');
  const regularIngredients = foodIngredients.filter(i => i.role !== 'oil');

  return (
    <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20">

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{dishIcon}</span>
          <div>
            <h3 className="font-black text-base text-foreground leading-tight">{title}</h3>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <UtensilsCrossed className="w-3 h-3" />
                {card.servings} порц. (~{Math.round(card.total_output_g / card.servings)}г)
              </span>
              {totalTime > 0 && (
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {fmtTime(totalTime)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── КБЖУ summary bar ── */}
      <div className="mx-5 mb-3 grid grid-cols-4 gap-1.5">
        <MacroChip icon={<Flame className="w-3 h-3" />} label="ккал" value={card.per_serving_kcal} color="text-orange-500" />
        <MacroChip icon={<Dumbbell className="w-3 h-3" />} label="белок" value={card.per_serving_protein} color="text-blue-500" />
        <MacroChip icon={<Droplets className="w-3 h-3" />} label="жиры" value={card.per_serving_fat} color="text-yellow-500" />
        <MacroChip icon={<Wheat className="w-3 h-3" />} label="углев" value={card.per_serving_carbs} color="text-green-500" />
      </div>

      {/* ── Ingredients table ── */}
      <div className="px-5 pb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ингредиенты</span>
        </div>
        <div className="space-y-1">
          {regularIngredients.map((ing, i) => {
            const stateEmoji = STATE_EMOJI[ing.state] ?? '';
            const stateLabel = STATE_LABEL_RU[ing.state] ?? ing.state;
            const roleColor = ROLE_COLORS[ing.role] ?? 'bg-muted/20 text-muted-foreground border-border/20';
            const showYield = Math.abs(ing.gross_g - ing.net_g) > 2;

            return (
              <div
                key={`${ing.slug}-${i}`}
                className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-muted/20 transition-colors group"
              >
                {/* Role badge */}
                <span className={cn(
                  'shrink-0 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border',
                  roleColor,
                )}>
                  {ing.role === 'side' ? 'овощ' : ing.role === 'protein' ? 'белок' : ing.role === 'spice' ? 'специя' : ing.role === 'base' ? 'база' : ing.role}
                </span>

                {/* Name + state */}
                <span className="flex-1 min-w-0 text-xs font-semibold text-foreground truncate">
                  {ing.name}
                  <span className="ml-1 text-muted-foreground/60 font-normal">
                    {stateEmoji} {stateLabel}
                  </span>
                </span>

                {/* Grams */}
                <span className="shrink-0 text-[11px] tabular-nums font-bold text-muted-foreground">
                  {showYield ? (
                    <>{Math.round(ing.gross_g)}г <span className="text-muted-foreground/40">→</span> {Math.round(ing.net_g)}г</>
                  ) : (
                    <>{Math.round(ing.gross_g)}г</>
                  )}
                </span>

                {/* kcal */}
                <span className="shrink-0 text-[10px] tabular-nums text-orange-500/70 font-bold w-10 text-right">
                  {ing.kcal > 0 ? `${ing.kcal}` : '—'}
                </span>
              </div>
            );
          })}

          {/* ── Oil (special: no state label, add context) ── */}
          {oilIngredients.map((ing, i) => (
            <div
              key={`oil-${i}`}
              className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-muted/20 transition-colors"
            >
              <span className={cn(
                'shrink-0 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border',
                ROLE_COLORS.oil,
              )}>
                масло
              </span>
              <span className="flex-1 min-w-0 text-xs font-semibold text-foreground truncate">
                {ing.name}
                <span className="ml-1 text-muted-foreground/60 font-normal">для зажарки</span>
              </span>
              <span className="shrink-0 text-[11px] tabular-nums font-bold text-muted-foreground">
                {Math.round(ing.gross_g)}г
              </span>
              <span className="shrink-0 text-[10px] tabular-nums text-orange-500/70 font-bold w-10 text-right">
                {ing.kcal > 0 ? `${ing.kcal}` : '—'}
              </span>
            </div>
          ))}

          {/* ── Liquid (water/broth) ── */}
          {liquidIngredient && (
            <div className="flex items-center gap-2 py-1 px-2 rounded-lg">
              <span className={cn(
                'shrink-0 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border',
                ROLE_COLORS.liquid,
              )}>
                жидк.
              </span>
              <span className="flex-1 min-w-0 text-xs font-semibold text-foreground">
                💧 Бульон (или вода)
              </span>
              <span className="shrink-0 text-[11px] tabular-nums font-bold text-muted-foreground">
                {Math.round(liquidIngredient.net_g)} мл
              </span>
              <span className="shrink-0 text-[10px] tabular-nums text-orange-500/70 font-bold w-10 text-right">—</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Cooking steps ── */}
      <div className="px-5 pb-5">
        <div className="flex items-center gap-1.5 mb-2">
          <ChefHat className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Приготовление</span>
        </div>
        <div className="space-y-2">
          {card.steps.map(step => (
            <div key={step.step} className="flex gap-2.5 items-start group">
              {/* Step number bubble */}
              <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <span className="text-[10px] font-black text-primary">{step.step}</span>
              </div>
              {/* Step text */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground leading-relaxed">{step.text}</p>
                {step.time_min != null && step.time_min > 0 && (
                  <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    ~{step.time_min} мин
                  </span>
                )}
              </div>
            </div>
          ))}
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
    case 'recipe':     return <RecipeCardView card={card} />;
  }
}

/** Renders a cards[] array as a responsive grid (1 col → 2 col → 3 col). */
export function ChatCardsGrid({ cards }: { cards: Card[] }) {
  if (!cards.length) return null;

  // Recipe cards are large — render full-width outside the grid
  const recipeCards = cards.filter(c => c.type === 'recipe');
  const otherCards = cards.filter(c => c.type !== 'recipe');

  return (
    <div className="mt-2 space-y-3">
      {/* Recipe cards — always full width */}
      {recipeCards.map((card, i) => (
        <div key={`recipe-${i}`} className="max-w-lg">
          <ChatCardView card={card} />
        </div>
      ))}

      {/* Other cards — responsive grid */}
      {otherCards.length > 0 && (
        <div className={cn(
          'grid gap-3',
          otherCards.length === 1 ? 'grid-cols-1 max-w-sm' :
          otherCards.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                                    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        )}>
          {otherCards.map((card, i) => (
            <ChatCardView key={i} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
