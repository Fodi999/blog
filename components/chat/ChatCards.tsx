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
  Lightbulb, Heart, Hand, Salad, TrendingDown, Activity,
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

const ROLE_LABEL_RU: Record<string, string> = {
  protein: 'белок', side: 'овощ', aromatic: 'аромат', spice: 'специя',
  oil: 'масло', condiment: 'заправка', liquid: 'жидк.', base: 'база',
};

/** Balance level indicator */
function BalanceBar({ label, value, max, color }: {
  label: string; value: number; max: number; color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const level = pct > 66 ? 'Высокий' : pct > 33 ? 'Средний' : 'Низкий';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-muted-foreground w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-bold text-muted-foreground/70 w-16 text-right">{Math.round(value)}г · {level}</span>
    </div>
  );
}

function RecipeCardView({ card }: { card: RecipeCard }) {
  const dishIcon = DISH_TYPE_ICON[card.dish_type] ?? '🍽️';
  const title = card.display_name ?? card.dish_name_local ?? card.dish_name;
  const totalTime = card.steps.reduce((sum, s) => sum + (s.time_min ?? 0), 0);
  const portionG = Math.round(card.total_output_g / card.servings);

  // ── Human-friendly time ──
  const fmtTime = (min: number): string => {
    if (min <= 0) return '';
    const rounded = Math.round(min / 5) * 5;
    if (rounded < 60) return `~${rounded} мин`;
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    if (m === 0) return `~${h} ч`;
    return `~${h} ч ${m} мин`;
  };

  // All ingredients for table (sorted: protein → side → aromatic → oil → spice → condiment → liquid)
  const roleOrder = ['protein', 'side', 'base', 'aromatic', 'oil', 'spice', 'condiment', 'liquid'];
  const sortedIngredients = [...card.ingredients].sort(
    (a, b) => (roleOrder.indexOf(a.role) ?? 99) - (roleOrder.indexOf(b.role) ?? 99)
  );

  // Totals computed from ingredient rows
  const sumGross = card.total_gross_g ?? card.ingredients.reduce((s, i) => s + i.gross_g, 0);
  const sumNet = card.total_output_g;
  const sumLoss = card.total_loss_g ?? (sumGross - sumNet);
  const lossPct = card.loss_percent ?? (sumGross > 0 ? Math.round((sumLoss / sumGross) * 100) : 0);
  const kcal100 = card.kcal_per_100g ?? (sumNet > 0 ? Math.round((card.total_kcal / sumNet) * 100) : 0);
  const sumKcal = card.ingredients.reduce((s, i) => s + i.kcal, 0);

  // Balance reference: ~25g protein, ~20g fat, ~60g carbs per serving (for bar max)
  const perProt = card.per_serving_protein;
  const perFat = card.per_serving_fat;
  const perCarbs = card.per_serving_carbs;

  return (
    <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20">

      {/* ═══════════════════ ZONE 1: HEADER ═══════════════════ */}
      <div className="px-5 pt-5 pb-4 border-b border-border/15">
        {/* Title row */}
        <div className="flex items-start gap-2.5 mb-3">
          <span className="text-3xl leading-none mt-0.5">{dishIcon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-base text-foreground leading-tight">{title}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <UtensilsCrossed className="w-3 h-3" />
                {card.servings} порц. × {portionG}г = <b className="text-foreground ml-0.5">{Math.round(card.total_output_g)}г</b>
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

        {/* КБЖУ per serving chips */}
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          <MacroChip icon={<Flame className="w-3 h-3" />} label="ккал" value={card.per_serving_kcal} color="text-orange-500" />
          <MacroChip icon={<Dumbbell className="w-3 h-3" />} label="белок" value={card.per_serving_protein} color="text-blue-500" />
          <MacroChip icon={<Droplets className="w-3 h-3" />} label="жиры" value={card.per_serving_fat} color="text-yellow-500" />
          <MacroChip icon={<Wheat className="w-3 h-3" />} label="углев" value={card.per_serving_carbs} color="text-green-500" />
          <MacroChip icon={<Activity className="w-3 h-3" />} label="/100г" value={kcal100} color="text-pink-500" />
        </div>

        {/* Balance bars */}
        <div className="space-y-1">
          <BalanceBar label="Белки" value={perProt} max={50} color="bg-blue-500" />
          <BalanceBar label="Жиры" value={perFat} max={45} color="bg-yellow-500" />
          <BalanceBar label="Углеводы" value={perCarbs} max={80} color="bg-green-500" />
        </div>
      </div>

      {/* ═══════════════════ ZONE 2: INGREDIENT TABLE ═══════════════════ */}
      <div className="px-5 py-4 border-b border-border/15">
        <div className="flex items-center gap-1.5 mb-2.5">
          <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ингредиенты</span>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_56px_56px_48px_44px] gap-x-1.5 items-center px-2 py-1 mb-1">
          <span className="w-12" />
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Продукт</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 text-right">Брутто</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 text-right">Нетто</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 text-right">Потери</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 text-right">Ккал</span>
        </div>

        {/* Ingredient rows */}
        <div className="space-y-0.5">
          {sortedIngredients.map((ing, i) => {
            const stateEmoji = STATE_EMOJI[ing.state] ?? '';
            const stateLabel = STATE_LABEL_RU[ing.state] ?? ing.state;
            const roleColor = ROLE_COLORS[ing.role] ?? 'bg-muted/20 text-muted-foreground border-border/20';
            const roleLabel = ROLE_LABEL_RU[ing.role] ?? ing.role;
            const loss = ing.gross_g - ing.net_g;
            const lossStr = loss > 1 ? `${Math.round(loss)}` : '—';

            return (
              <div
                key={`${ing.slug ?? ing.name}-${i}`}
                className="grid grid-cols-[auto_1fr_56px_56px_48px_44px] gap-x-1.5 items-center py-1 px-2 rounded-lg hover:bg-muted/20 transition-colors"
              >
                {/* Role badge */}
                <span className={cn(
                  'shrink-0 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border w-12 text-center',
                  roleColor,
                )}>
                  {roleLabel}
                </span>

                {/* Name + state */}
                <span className="text-xs font-semibold text-foreground truncate">
                  {ing.name}
                  <span className="ml-1 text-muted-foreground/50 font-normal text-[10px]">
                    {stateEmoji} {stateLabel}
                  </span>
                </span>

                {/* Брутто */}
                <span className="text-[11px] tabular-nums font-bold text-muted-foreground text-right">
                  {Math.round(ing.gross_g)}г
                </span>

                {/* Нетто */}
                <span className="text-[11px] tabular-nums font-bold text-foreground text-right">
                  {Math.round(ing.net_g)}г
                </span>

                {/* Потери */}
                <span className="text-[10px] tabular-nums text-muted-foreground/60 text-right">
                  {lossStr}
                </span>

                {/* Ккал */}
                <span className="text-[10px] tabular-nums text-orange-500/80 font-bold text-right">
                  {ing.kcal > 0 ? ing.kcal : '—'}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Summary row ── */}
        <div className="grid grid-cols-[auto_1fr_56px_56px_48px_44px] gap-x-1.5 items-center px-2 py-2 mt-2 rounded-lg bg-muted/15 border border-border/10">
          <span className="w-12" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Итого
          </span>
          <span className="text-[11px] tabular-nums font-black text-muted-foreground text-right">
            {Math.round(sumGross)}г
          </span>
          <span className="text-[11px] tabular-nums font-black text-foreground text-right">
            {Math.round(sumNet)}г
          </span>
          <span className="text-[10px] tabular-nums font-bold text-rose-500/80 text-right">
            {Math.round(lossPct)}%
          </span>
          <span className="text-[10px] tabular-nums font-black text-orange-500 text-right">
            {sumKcal}
          </span>
        </div>
      </div>

      {/* ═══════════════════ ZONE 3: COOKING STEPS ═══════════════════ */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-1.5 mb-2.5">
          <ChefHat className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Приготовление</span>
          {totalTime > 0 && (
            <span className="text-[9px] text-muted-foreground/50 ml-auto flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {fmtTime(totalTime)}
            </span>
          )}
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
