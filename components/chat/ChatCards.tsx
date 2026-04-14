'use client';

/**
 * ChatCards — pure render components for ChefOS chat cards.
 * No logic — only takes data from API and renders it.
 *
 * Contract: cards[] from POST /public/chat
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Flame, Dumbbell, Droplets, Wheat, ArrowRight, Leaf, Scale,
  Beef, Egg, Carrot, Apple, Fish, CookingPot, UtensilsCrossed,
  Sparkles, ChefHat, Clock, RefreshCcw, BookOpen, ClipboardList,
  Lightbulb, Heart, Hand, Salad, TrendingDown, Activity, Thermometer,
  Copy, Check, AlertTriangle, Target, Gauge, Tag, Minus, Plus, Users,
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

/** State emoji — covers all 4 languages (state now arrives localized from backend) */
const STATE_EMOJI: Record<string, string> = {
  // English
  boiled: '♨️', sautéed: '🍳', fried: '🍳', baked: '🔥',
  grilled: '🔥', steamed: '💨', raw: '🥬', smoked: '🌫️',
  // Russian
  'варёный': '♨️', 'варёная': '♨️', 'варёное': '♨️',
  'пассерованный': '🍳', 'пассерованная': '🍳', 'пассерованное': '🍳',
  'жареный': '🍳', 'жареная': '🍳', 'жареное': '🍳',
  'запечённый': '🔥', 'запечённая': '🔥', 'запечённое': '🔥',
  'гриль': '🔥',
  'на пару': '💨',
  'сырой': '🥬', 'сырая': '🥬', 'сырое': '🥬',
  'копчёный': '🌫️', 'копчёная': '🌫️', 'копчёное': '🌫️',
  // Polish
  'gotowany': '♨️', 'podsmażony': '🍳', 'smażony': '🍳',
  'pieczony': '🔥', 'grillowany': '🔥',
  'na parze': '💨', 'surowy': '🥬', 'wędzony': '🌫️',
  // Ukrainian
  'варений': '♨️', 'спасерований': '🍳', 'смажений': '🍳',
  'запечений': '🔥',
  'на парі': '💨', 'сирий': '🥬', 'копчений': '🌫️',
};

/** Role colors — STRONG visual hierarchy: protein > vegetable > fat > spice */
const ROLE_COLORS: Record<string, { bg: string; border: string; dot: string }> = {
  protein:   { bg: 'bg-red-500/12 text-red-600 dark:text-red-400',      border: 'border-l-red-500',    dot: 'bg-red-500' },
  base:      { bg: 'bg-amber-500/12 text-amber-700 dark:text-amber-300', border: 'border-l-amber-500',  dot: 'bg-amber-500' },
  side:      { bg: 'bg-green-500/12 text-green-600 dark:text-green-400', border: 'border-l-green-500',  dot: 'bg-green-500' },
  aromatic:  { bg: 'bg-orange-500/12 text-orange-600 dark:text-orange-400', border: 'border-l-orange-500', dot: 'bg-orange-500' },
  oil:       { bg: 'bg-yellow-500/12 text-yellow-700 dark:text-yellow-400', border: 'border-l-yellow-500', dot: 'bg-yellow-500' },
  spice:     { bg: 'bg-purple-500/12 text-purple-600 dark:text-purple-400', border: 'border-l-purple-500', dot: 'bg-purple-500' },
  condiment: { bg: 'bg-pink-500/12 text-pink-600 dark:text-pink-400',   border: 'border-l-pink-500',   dot: 'bg-pink-500' },
  liquid:    { bg: 'bg-blue-500/12 text-blue-600 dark:text-blue-400',   border: 'border-l-blue-500',   dot: 'bg-blue-500' },
  other:     { bg: 'bg-slate-500/12 text-slate-600 dark:text-slate-400', border: 'border-l-slate-400',  dot: 'bg-slate-500' },
};

const DISH_TYPE_ICON: Record<string, string> = {
  soup: '🍲', stew: '🫕', salad: '🥗', stirfry: '🥘', stir_fry: '🥘',
  grill: '🔥', bake: '🧁', pasta: '🍝', raw: '🐟', default: '🍽️',
};

type L = Record<string, string>;
const i18n: Record<string, { dishType: L; complexity: L; goal: L; tag: L; allergen: L; role: L; balance: [string, string, string]; portion: string; copy: string; perServing: string; total: string; steps: string; context: string; unresolved: string; noAllergens: string; protein: string; fat: string; carbs: string; scale: string; original: string; brutto: string; netto: string; ingredients: string; min: string; hr: string; product: string; loss: string; kcal: string; g: string; protShort: string; fatShort: string; carbsShort: string; carbsLabel: string; per100g: string; perOneServing: string; servingsLabel: string; copyTitle: string }> = {
  ru: {
    dishType: { soup: 'Суп', stew: 'Тушение', salad: 'Салат', stirfry: 'Вок', stir_fry: 'Вок', grill: 'Гриль', bake: 'Выпечка', pasta: 'Паста', raw: 'Сырое', default: 'Блюдо' },
    complexity: { easy: 'Легко', medium: 'Средне', hard: 'Сложно' },
    goal: { high_protein: 'Высокий белок', low_calorie: 'Низкокалорийное', balanced: 'Сбалансировано' },
    tag: { vegan: 'Веган', vegetarian: 'Вегетарианское', pescatarian: 'Пескатарианское' },
    allergen: { gluten: 'Глютен', lactose: 'Лактоза', nuts: 'Орехи', eggs: 'Яйца', fish: 'Рыба', shellfish: 'Моллюски', soy: 'Соя' },
    role: { protein: 'белок', side: 'овощ', aromatic: 'аромат', spice: 'специя', oil: 'масло', condiment: 'заправка', liquid: 'жидк.', base: 'база', other: 'прочее' },
    balance: ['Высокий', 'Средний', 'Низкий'],
    portion: 'порц.', copy: 'Рецепт скопирован', perServing: 'На порцию', total: 'Итого', steps: 'Приготовление', context: 'Контекст блюда', unresolved: 'Нет в базе',
    noAllergens: 'Без основных аллергенов', protein: 'белок', fat: 'жиры', carbs: 'углеводы', scale: 'Масштаб', original: 'оригинал', brutto: 'брутто', netto: 'нетто',
    ingredients: 'Ингредиенты', min: 'мин', hr: 'ч',
    product: 'Продукт', loss: 'Потери', kcal: 'ккал', g: 'г', protShort: 'б', fatShort: 'ж', carbsShort: 'у', carbsLabel: 'углев', per100g: '/100г', perOneServing: 'На 1 порцию',
    servingsLabel: 'Порции:', copyTitle: 'Скопировать рецепт',
  },
  en: {
    dishType: { soup: 'Soup', stew: 'Stew', salad: 'Salad', stirfry: 'Stir-fry', stir_fry: 'Stir-fry', grill: 'Grill', bake: 'Bake', pasta: 'Pasta', raw: 'Raw', default: 'Dish' },
    complexity: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
    goal: { high_protein: 'High protein', low_calorie: 'Low calorie', balanced: 'Balanced' },
    tag: { vegan: 'Vegan', vegetarian: 'Vegetarian', pescatarian: 'Pescatarian' },
    allergen: { gluten: 'Gluten', lactose: 'Lactose', nuts: 'Nuts', eggs: 'Eggs', fish: 'Fish', shellfish: 'Shellfish', soy: 'Soy' },
    role: { protein: 'protein', side: 'veg', aromatic: 'arom.', spice: 'spice', oil: 'oil', condiment: 'dressing', liquid: 'liquid', base: 'base', other: 'other' },
    balance: ['High', 'Medium', 'Low'],
    portion: 'serv.', copy: 'Recipe copied', perServing: 'Per serving', total: 'Total', steps: 'Steps', context: 'Dish context', unresolved: 'Not in DB',
    noAllergens: 'No major allergens', protein: 'protein', fat: 'fat', carbs: 'carbs', scale: 'Scale', original: 'original', brutto: 'gross', netto: 'net',
    ingredients: 'Ingredients', min: 'min', hr: 'h',
    product: 'Product', loss: 'Loss', kcal: 'kcal', g: 'g', protShort: 'P', fatShort: 'F', carbsShort: 'C', carbsLabel: 'carbs', per100g: '/100g', perOneServing: 'Per serving',
    servingsLabel: 'Servings:', copyTitle: 'Copy recipe',
  },
  pl: {
    dishType: { soup: 'Zupa', stew: 'Duszenie', salad: 'Sałatka', stirfry: 'Wok', stir_fry: 'Wok', grill: 'Grill', bake: 'Pieczenie', pasta: 'Makaron', raw: 'Surowe', default: 'Danie' },
    complexity: { easy: 'Łatwe', medium: 'Średnie', hard: 'Trudne' },
    goal: { high_protein: 'Dużo białka', low_calorie: 'Niskokaloryczne', balanced: 'Zbalansowane' },
    tag: { vegan: 'Wegańskie', vegetarian: 'Wegetariańskie', pescatarian: 'Peskatariańskie' },
    allergen: { gluten: 'Gluten', lactose: 'Laktoza', nuts: 'Orzechy', eggs: 'Jajka', fish: 'Ryby', shellfish: 'Skorupiaki', soy: 'Soja' },
    role: { protein: 'białko', side: 'warzywo', aromatic: 'aromat', spice: 'przyprawa', oil: 'olej', condiment: 'sos', liquid: 'płyn', base: 'baza', other: 'inne' },
    balance: ['Wysoki', 'Średni', 'Niski'],
    portion: 'porcji', copy: 'Przepis skopiowany', perServing: 'Na porcję', total: 'Razem', steps: 'Przygotowanie', context: 'Kontekst dania', unresolved: 'Brak w bazie',
    noAllergens: 'Bez głównych alergenów', protein: 'białko', fat: 'tłuszcze', carbs: 'węglowodany', scale: 'Skala', original: 'oryginał', brutto: 'brutto', netto: 'netto',
    ingredients: 'Składniki', min: 'min', hr: 'godz',
    product: 'Produkt', loss: 'Straty', kcal: 'kcal', g: 'g', protShort: 'B', fatShort: 'T', carbsShort: 'W', carbsLabel: 'węgl', per100g: '/100g', perOneServing: 'Na 1 porcję',
    servingsLabel: 'Porcje:', copyTitle: 'Skopiuj przepis',
  },
  uk: {
    dishType: { soup: 'Суп', stew: 'Тушкування', salad: 'Салат', stirfry: 'Вок', stir_fry: 'Вок', grill: 'Гриль', bake: 'Випічка', pasta: 'Паста', raw: 'Сире', default: 'Страва' },
    complexity: { easy: 'Легко', medium: 'Середньо', hard: 'Складно' },
    goal: { high_protein: 'Високий білок', low_calorie: 'Низькокалорійне', balanced: 'Збалансовано' },
    tag: { vegan: 'Веган', vegetarian: 'Вегетаріанське', pescatarian: 'Пескатаріанське' },
    allergen: { gluten: 'Глютен', lactose: 'Лактоза', nuts: 'Горіхи', eggs: 'Яйця', fish: 'Риба', shellfish: 'Молюски', soy: 'Соя' },
    role: { protein: 'білок', side: 'овоч', aromatic: 'аромат', spice: 'спеція', oil: 'олія', condiment: 'заправка', liquid: 'рідина', base: 'база', other: 'інше' },
    balance: ['Високий', 'Середній', 'Низький'],
    portion: 'порц.', copy: 'Рецепт скопійовано', perServing: 'На порцію', total: 'Разом', steps: 'Приготування', context: 'Контекст страви', unresolved: 'Немає в базі',
    noAllergens: 'Без основних алергенів', protein: 'білок', fat: 'жири', carbs: 'вуглеводи', scale: 'Масштаб', original: 'оригінал', brutto: 'брутто', netto: 'нетто',
    ingredients: 'Інгредієнти', min: 'хв', hr: 'год',
    product: 'Продукт', loss: 'Втрати', kcal: 'ккал', g: 'г', protShort: 'б', fatShort: 'ж', carbsShort: 'в', carbsLabel: 'вугл', per100g: '/100г', perOneServing: 'На 1 порцію',
    servingsLabel: 'Порції:', copyTitle: 'Скопіювати рецепт',
  },
};

/** Balance level indicator */
function BalanceBar({ label, value, max, color, levels, gUnit }: {
  label: string; value: number; max: number; color: string; levels?: [string, string, string]; gUnit?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const [hi, mid, lo] = levels ?? ['High', 'Medium', 'Low'];
  const level = pct > 66 ? hi : pct > 33 ? mid : lo;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-muted-foreground w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-bold text-muted-foreground/70 w-16 text-right">{Math.round(value)}{gUnit ?? 'g'} · {level}</span>
    </div>
  );
}

function RecipeCardView({ card, lang }: { card: RecipeCard; lang?: string }) {
  const t = i18n[lang ?? 'ru'] ?? i18n.ru;
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // ── Serving scaler ──
  const baseServings = card.servings;
  const [servings, setServings] = useState(baseServings);
  const scale = servings / baseServings;

  useEffect(() => {
    // Double-RAF: first RAF lets the browser paint the opacity-0 frame,
    // second RAF triggers the transition so there's no flicker.
    let id1: number;
    let id2: number;
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, []);

  const dishIcon = DISH_TYPE_ICON[card.dish_type] ?? '🍽️';
  const title = card.display_name ?? card.dish_name_local ?? card.dish_name;
  const totalTime = card.steps.reduce((sum, s) => sum + (s.time_min ?? 0), 0);
  const portionG = Math.round(card.total_output_g / card.servings);

  // ── Human-friendly time ──
  const fmtTime = (min: number): string => {
    if (min <= 0) return '';
    const rounded = Math.round(min / 5) * 5 || min;
    if (rounded < 60) return `~${rounded} ${t.min}`;
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    if (m === 0) return `~${h} ${t.hr}`;
    return `~${h} ${t.hr} ${m} ${t.min}`;
  };

  // All ingredients sorted by kitchen importance: protein → base → side → aromatic → oil → spice → condiment → liquid
  // Filter out unresolved (slug=null, gross_g=0) — LLM noise with no useful data
  const roleOrder = ['protein', 'base', 'side', 'aromatic', 'oil', 'spice', 'condiment', 'liquid', 'other'];
  const sortedIngredients = [...card.ingredients]
    .filter(i => i.gross_g > 0 || i.net_g > 0)
    .sort(
      (a, b) => (roleOrder.indexOf(a.role) === -1 ? 99 : roleOrder.indexOf(a.role)) - (roleOrder.indexOf(b.role) === -1 ? 99 : roleOrder.indexOf(b.role))
    );

  // Totals (scaled)
  const sumGrossBase = card.total_gross_g ?? card.ingredients.reduce((s, i) => s + i.gross_g, 0);
  const sumNetBase = card.total_output_g;
  const sumGross = sumGrossBase * scale;
  const sumNet = sumNetBase * scale;
  const sumLossBase = card.total_loss_g ?? (sumGrossBase - sumNetBase);
  const sumLoss = sumLossBase * scale;
  const lossPct = card.loss_percent ?? (sumGrossBase > 0 ? Math.round((sumLossBase / sumGrossBase) * 100) : 0);
  const kcal100 = card.kcal_per_100g ?? (sumNetBase > 0 ? Math.round((card.total_kcal / sumNetBase) * 100) : 0);
  const sumKcal = Math.round(card.ingredients.reduce((s, i) => s + i.kcal, 0) * scale);

  // Per-serving
  const perProt = card.per_serving_protein;
  const perFat = card.per_serving_fat;
  const perCarbs = card.per_serving_carbs;
  const perKcal = card.per_serving_kcal;

  // ── Copy recipe ──
  const [copied, setCopied] = useState(false);

  const copyRecipe = useCallback(() => {
    const lines: string[] = [];
    lines.push(`🍽 ${title}`);
    lines.push(`${servings} ${t.portion} × ${portionG}${t.g} = ${Math.round(sumNet)}${t.g}`);
    if (totalTime > 0) lines.push(`⏱ ${fmtTime(totalTime)}`);
    if (scale !== 1) lines.push(`📐 ${t.scale}: ×${scale % 1 === 0 ? scale : scale.toFixed(1)} (${t.original} ${baseServings} ${t.portion})`);
    lines.push('');

    lines.push(`${t.perOneServing}: ${portionG}${t.g} · ${perKcal} ${t.kcal} (${t.protShort}${Math.round(perProt)} ${t.fatShort}${Math.round(perFat)} ${t.carbsShort}${Math.round(perCarbs)})`);
    lines.push('');

    lines.push(`📋 ${t.ingredients}:`);
    sortedIngredients.forEach(ing => {
      const g = Math.round(ing.gross_g * scale);
      const n = Math.round(ing.net_g * scale);
      const loss = g - n;
      const lossStr = loss > 1 ? ` → ${n}${t.g} (−${loss}${t.g})` : '';
      lines.push(`  • ${ing.name} — ${g}${t.g}${lossStr}`);
    });
    lines.push('');
    lines.push(`${t.total}: ${Math.round(sumGross)}${t.g} ${t.brutto} → ${Math.round(sumNet)}${t.g} ${t.netto} (−${Math.round(sumLoss)}${t.g}, −${Math.round(lossPct)}%)`);
    lines.push('');

    lines.push(`👨‍🍳 ${t.steps}:`);
    card.steps.forEach(step => {
      let line = `  ${step.step}. ${step.text}`;
      const meta: string[] = [];
      if (step.time_min && step.time_min > 0) meta.push(`~${step.time_min} ${t.min}`);
      if (step.temp_c && step.temp_c > 0) meta.push(`${step.temp_c}°C`);
      if (meta.length) line += ` (${meta.join(', ')})`;
      lines.push(line);
      if (step.tip) lines.push(`     💡 ${step.tip}`);
    });

    // Dish context
    lines.push('');
    const ctxParts: string[] = [];
    if (card.dish_type) ctxParts.push(`${t.dishType[card.dish_type] ?? card.dish_type}`);
    if (card.complexity) ctxParts.push(`${t.complexity[card.complexity] ?? card.complexity}`);
    if (card.goal) ctxParts.push(`${t.goal[card.goal] ?? card.goal}`);
    if (ctxParts.length) lines.push(ctxParts.join(' · '));
    if (card.tags?.length) lines.push(`🏷 ${card.tags.map(tg => t.tag[tg] ?? tg).join(', ')}`);
    if (card.allergens?.length) lines.push(`⚠️ ${card.allergens.map(a => t.allergen[a] ?? a).join(', ')}`);

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [card, title, portionG, totalTime, perKcal, perProt, perFat, perCarbs, sortedIngredients, sumGross, sumNet, sumLoss, lossPct, fmtTime, servings, scale, baseServings]);

  // Zone animation helper: stagger each zone by 120ms
  const zone = (delay: number) => ({
    className: cn(
      'transition-all duration-500 ease-out',
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
    ),
    style: { transitionDelay: `${delay}ms` },
  });

  return (
    <div
      ref={cardRef}
      className={cn(
        'rounded-2xl border border-border/30 bg-card/50 backdrop-blur-md overflow-hidden',
        'transition-all duration-700 ease-out hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20',
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[0.97]',
      )}
    >

      {/* ═══════════════════ ZONE 1: HEADER ═══════════════════ */}
      <div {...zone(80)} >
      <div className="px-5 pt-5 pb-4 border-b border-border/15">
        {/* Title row */}
        <div className="flex items-start gap-2.5 mb-3">
          <span className="text-3xl leading-none mt-0.5">{dishIcon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-base text-foreground leading-tight">{title}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <UtensilsCrossed className="w-3 h-3" />
                {servings} {t.portion} × {portionG}{t.g} = <b className="text-foreground ml-0.5">{Math.round(sumNet)}{t.g}</b>
              </span>
              {totalTime > 0 && (
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {fmtTime(totalTime)}
                </span>
              )}
            </div>
          </div>

          {/* Copy recipe button */}
          <button
            onClick={copyRecipe}
            className={cn(
              'shrink-0 mt-0.5 p-1.5 rounded-lg transition-all duration-300',
              'hover:bg-muted/40 active:scale-90',
              copied
                ? 'text-emerald-500'
                : 'text-muted-foreground/40 hover:text-muted-foreground/70',
            )}
            title={t.copyTitle}
          >
            {copied
              ? <Check className="w-4 h-4" />
              : <Copy className="w-4 h-4" />
            }
          </button>
        </div>

        {/* ── Serving scaler ── */}
        <div className="flex items-center gap-2 mb-3 bg-muted/10 border border-border/15 rounded-xl px-3 py-2">
          <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-[10px] font-bold text-muted-foreground shrink-0">{t.servingsLabel}</span>

          {/* Minus */}
          <button
            onClick={() => setServings(s => Math.max(1, s - 1))}
            disabled={servings <= 1}
            className="w-6 h-6 rounded-md bg-muted/30 flex items-center justify-center hover:bg-muted/50 active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus className="w-3 h-3" />
          </button>

          {/* Presets */}
          {[baseServings, baseServings * 2, baseServings * 5, 10].filter((v, i, a) => a.indexOf(v) === i).map(n => (
            <button
              key={n}
              onClick={() => setServings(n)}
              className={cn(
                'min-w-[32px] h-7 rounded-lg text-[11px] font-black transition-all duration-200 active:scale-90',
                servings === n
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/20 text-muted-foreground hover:bg-muted/40',
              )}
            >
              {n}
            </button>
          ))}

          {/* Plus */}
          <button
            onClick={() => setServings(s => s + 1)}
            className="w-6 h-6 rounded-md bg-muted/30 flex items-center justify-center hover:bg-muted/50 active:scale-90 transition-all"
          >
            <Plus className="w-3 h-3" />
          </button>

          {/* Scale indicator */}
          {scale !== 1 && (
            <span className="ml-auto text-[10px] font-bold text-primary/70">
              ×{scale % 1 === 0 ? scale : scale.toFixed(1)}
            </span>
          )}
        </div>

        {/* ── Per-serving block — MUST HAVE ── */}
        <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 mb-3">
          <div className="text-[9px] font-black uppercase tracking-widest text-primary/60 mb-1.5">{t.perOneServing}</div>
          <div className="flex items-baseline gap-4">
            <div>
              <span className="text-2xl font-black text-foreground">{portionG}</span>
              <span className="text-xs text-muted-foreground ml-1">{t.g}</span>
            </div>
            <div>
              <span className="text-2xl font-black text-orange-500">{perKcal}</span>
              <span className="text-xs text-muted-foreground ml-1">{t.kcal}</span>
            </div>
            <div className="flex gap-3 ml-auto text-[11px]">
              <span className="text-blue-500 font-bold">{Math.round(perProt)}{t.protShort}</span>
              <span className="text-yellow-500 font-bold">{Math.round(perFat)}{t.fatShort}</span>
              <span className="text-green-500 font-bold">{Math.round(perCarbs)}{t.carbsShort}</span>
            </div>
          </div>
        </div>

        {/* КБЖУ per serving chips */}
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          <MacroChip icon={<Flame className="w-3 h-3" />} label={t.kcal} value={card.per_serving_kcal} color="text-orange-500" />
          <MacroChip icon={<Dumbbell className="w-3 h-3" />} label={t.protein} value={card.per_serving_protein} color="text-blue-500" />
          <MacroChip icon={<Droplets className="w-3 h-3" />} label={t.fat} value={card.per_serving_fat} color="text-yellow-500" />
          <MacroChip icon={<Wheat className="w-3 h-3" />} label={t.carbsLabel} value={card.per_serving_carbs} color="text-green-500" />
          <MacroChip icon={<Activity className="w-3 h-3" />} label={t.per100g} value={kcal100} color="text-pink-500" />
        </div>

        {/* Balance bars */}
        <div className="space-y-1">
          <BalanceBar label={t.protein} value={perProt} max={50} color="bg-blue-500" levels={t.balance} gUnit={t.g} />
          <BalanceBar label={t.fat} value={perFat} max={45} color="bg-yellow-500" levels={t.balance} gUnit={t.g} />
          <BalanceBar label={t.carbs} value={perCarbs} max={80} color="bg-green-500" levels={t.balance} gUnit={t.g} />
        </div>

        {/* ── Dish context block ── */}
        <div className="mt-3 bg-muted/10 border border-border/15 rounded-xl px-4 py-3 space-y-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">{t.context}</div>

          <div className="flex flex-wrap gap-2">
            {/* Dish type */}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary/8 text-primary rounded-md px-2 py-0.5">
              <CookingPot className="w-3 h-3" />
              {t.dishType[card.dish_type] ?? card.dish_type}
            </span>

            {/* Complexity */}
            {card.complexity && (
              <span className={cn(
                'inline-flex items-center gap-1 text-[10px] font-bold rounded-md px-2 py-0.5',
                card.complexity === 'easy' && 'bg-green-500/10 text-green-600',
                card.complexity === 'medium' && 'bg-yellow-500/10 text-yellow-600',
                card.complexity === 'hard' && 'bg-red-500/10 text-red-600',
              )}>
                <Gauge className="w-3 h-3" />
                {t.complexity[card.complexity] ?? card.complexity}
              </span>
            )}

            {/* Goal */}
            {card.goal && card.goal !== 'balanced' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-violet-500/10 text-violet-600 rounded-md px-2 py-0.5">
                <Target className="w-3 h-3" />
                {t.goal[card.goal] ?? card.goal}
              </span>
            )}
            {card.goal === 'balanced' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-sky-500/10 text-sky-600 rounded-md px-2 py-0.5">
                <Target className="w-3 h-3" />
                {t.goal.balanced}
              </span>
            )}
          </div>

          {/* Diet tags */}
          {card.tags && card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 rounded-md px-2 py-0.5">
                  <Tag className="w-2.5 h-2.5" />
                  {t.tag[tag] ?? tag}
                </span>
              ))}
            </div>
          )}

          {/* Allergens */}
          {card.allergens && card.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              {card.allergens.map(a => (
                <span key={a} className="inline-flex items-center text-[10px] font-bold bg-amber-500/10 text-amber-600 rounded-md px-2 py-0.5">
                  {t.allergen[a] ?? a}
                </span>
              ))}
            </div>
          )}

          {/* No allergens = clean */}
          {(!card.allergens || card.allergens.length === 0) && (
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold">
              <Check className="w-3 h-3" />
              {t.noAllergens}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* ═══════════════════ ZONE 2: INGREDIENT TABLE ═══════════════════ */}
      <div {...zone(220)} >
      <div className="px-5 py-4 border-b border-border/15">
        <div className="flex items-center gap-1.5 mb-2.5">
          <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.ingredients}</span>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_56px_56px_48px_44px] gap-x-1.5 items-center px-2 py-1 mb-1">
          <span className="w-12" />
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{t.product}</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 text-right">{t.brutto}</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 text-right">{t.netto}</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 text-right">{t.loss}</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 text-right">{t.kcal}</span>
        </div>

        {/* Ingredient rows */}
        <div className="space-y-0.5">
          {sortedIngredients.map((ing, i) => {
            const stateEmoji = STATE_EMOJI[ing.state] ?? '';
            const stateLabel = ing.state;
            const rc = ROLE_COLORS[ing.role] ?? { bg: 'bg-muted/20 text-muted-foreground', border: 'border-l-muted', dot: 'bg-muted-foreground' };
            const roleLabel = t.role[ing.role] ?? ing.role;
            const grossScaled = ing.gross_g * scale;
            const netScaled = ing.net_g * scale;
            const loss = grossScaled - netScaled;
            const lossStr = loss > 1 ? `−${Math.round(loss)}` : '—';
            const kcalScaled = Math.round(ing.kcal * scale);

            return (
              <div
                key={`${ing.slug ?? ing.name}-${i}`}
                className={cn(
                  'grid grid-cols-[auto_1fr_56px_56px_48px_44px] gap-x-1.5 items-center py-1.5 px-2 rounded-lg hover:bg-muted/20 transition-all duration-400 ease-out border-l-2',
                  rc.border,
                  visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3',
                )}
                style={{ transitionDelay: `${280 + i * 50}ms` }}
              >
                {/* Role badge */}
                <span className={cn(
                  'shrink-0 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded w-12 text-center',
                  rc.bg,
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
                  {Math.round(grossScaled)}{t.g}
                </span>

                {/* Нетто */}
                <span className="text-[11px] tabular-nums font-bold text-foreground text-right">
                  {Math.round(netScaled)}{t.g}
                </span>

                {/* Потери */}
                <span className="text-[10px] tabular-nums text-rose-500/70 text-right">
                  {lossStr}
                </span>

                {/* Ккал */}
                <span className="text-[10px] tabular-nums text-orange-500/80 font-bold text-right">
                  {kcalScaled > 0 ? kcalScaled : '—'}
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
            {t.total}
          </span>
          <span className="text-[11px] tabular-nums font-black text-muted-foreground text-right">
            {Math.round(sumGross)}{t.g}
          </span>
          <span className="text-[11px] tabular-nums font-black text-foreground text-right">
            {Math.round(sumNet)}{t.g}
          </span>
          <span className="text-[10px] tabular-nums font-bold text-rose-500 text-right" title={`−${Math.round(sumLoss)}${t.g}`}>
            −{Math.round(sumLoss)}{t.g}
          </span>
          <span className="text-[10px] tabular-nums font-black text-orange-500 text-right">
            {sumKcal}
          </span>
        </div>

        {/* Loss summary — readable */}
        <div className="mt-2 text-center">
          <span className="text-[10px] text-rose-500/80 font-bold">
            {t.loss}: −{Math.round(sumLoss)}{t.g} (−{Math.round(lossPct)}%)
          </span>
        </div>
      </div>
      </div>

      {/* ═══════════════════ ZONE 3: COOKING STEPS ═══════════════════ */}
      <div {...zone(400)} >
      <div className="px-5 py-4">
        <div className="flex items-center gap-1.5 mb-2.5">
          <ChefHat className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.steps}</span>
          {totalTime > 0 && (
            <span className="text-[9px] text-muted-foreground/50 ml-auto flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {fmtTime(totalTime)}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {card.steps.map((step, si) => (
            <div
              key={step.step}
              className={cn(
                'group transition-all duration-400 ease-out',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
              )}
              style={{ transitionDelay: `${480 + si * 80}ms` }}
            >
              <div className="flex gap-2.5 items-start">
                {/* Step number bubble */}
                <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <span className="text-[10px] font-black text-primary">{step.step}</span>
                </div>
                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground leading-relaxed">{step.text}</p>
                  {/* Meta row: time + temperature */}
                  {(step.time_min || step.temp_c) && (
                    <div className="flex items-center gap-3 mt-1">
                      {step.time_min != null && step.time_min > 0 && (
                        <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          ~{step.time_min} {t.min}
                        </span>
                      )}
                      {step.temp_c != null && step.temp_c > 0 && (
                        <span className="text-[10px] text-orange-500/70 flex items-center gap-0.5 font-medium">
                          <Thermometer className="w-2.5 h-2.5" />
                          {step.temp_c}°C
                        </span>
                      )}
                    </div>
                  )}
                  {/* Chef tip */}
                  {step.tip && (
                    <div className="mt-1.5 flex items-start gap-1.5 bg-amber-500/8 border border-amber-500/15 rounded-lg px-2.5 py-1.5">
                      <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-snug">{step.tip}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}


// ── Public export — renders any Card by type ──────────────────────────────────

export function ChatCardView({ card, lang }: { card: Card; lang?: string }) {
  switch (card.type) {
    case 'product':    return <ProductCardView card={card} />;
    case 'conversion': return <ConversionCardView card={card} />;
    case 'nutrition':  return <NutritionCardView card={card} />;
    case 'recipe':     return <RecipeCardView card={card} lang={lang} />;
  }
}

/** Renders a cards[] array as a responsive grid (1 col → 2 col → 3 col). */
export function ChatCardsGrid({ cards, lang }: { cards: Card[]; lang?: string }) {
  if (!cards.length) return null;

  // Recipe cards are large — render full-width outside the grid
  const recipeCards = cards.filter(c => c.type === 'recipe');
  const otherCards = cards.filter(c => c.type !== 'recipe');

  return (
    <div className="mt-2 space-y-3">
      {/* Recipe cards — always full width */}
      {recipeCards.map((card, i) => (
        <div key={`recipe-${i}`} className="max-w-lg">
          <ChatCardView card={card} lang={lang} />
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
            <ChatCardView key={i} card={card} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
