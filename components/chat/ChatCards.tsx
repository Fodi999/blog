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
  Copy, Check, AlertTriangle, Target, Gauge, Tag, Minus, Plus, Users, BarChart3,
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
const i18n: Record<string, { dishType: L; complexity: L; goal: L; tag: L; allergen: L; role: L; balance: [string, string, string]; portion: string; copy: string; perServing: string; total: string; steps: string; context: string; unresolved: string; noAllergens: string; protein: string; fat: string; carbs: string; scale: string; original: string; brutto: string; netto: string; ingredients: string; min: string; hr: string; product: string; loss: string; kcal: string; g: string; protShort: string; fatShort: string; carbsShort: string; carbsLabel: string; per100g: string; perOneServing: string; servingsLabel: string; copyTitle: string; removedNote: string }> = {
  ru: {
    dishType: { soup: 'Суп', stew: 'Тушение', salad: 'Салат', stirfry: 'Вок', stir_fry: 'Вок', grill: 'Гриль', bake: 'Выпечка', pasta: 'Паста', raw: 'Сырое', default: 'Блюдо' },
    complexity: { easy: 'Легко', medium: 'Средне', hard: 'Сложно' },
    goal: { high_protein: 'Высокий белок', low_calorie: 'Низкокалорийное', balanced: 'Сбалансировано' },
    tag: { vegan: 'Веган', vegetarian: 'Вегетар.', pescatarian: 'Пескатар.' },
    allergen: { gluten: 'Глютен', lactose: 'Лактоза', nuts: 'Орехи', eggs: 'Яйца', fish: 'Рыба', shellfish: 'Моллюски', soy: 'Соя' },
    role: { protein: 'белок', side: 'овоч', aromatic: 'аромат', spice: 'специя', oil: 'масло', condiment: 'заправка', liquid: 'жидк.', base: 'база', other: 'прочее' },
    balance: ['Высокий', 'Средний', 'Низкий'],
    portion: 'порц.', copy: 'Рецепт скопирован', perServing: 'На порцию', total: 'Итого', steps: 'Приготовление', context: 'Анализ блюда', unresolved: 'Нет в базе',
    noAllergens: 'Без аллергенов', protein: 'белок', fat: 'жиры', carbs: 'углеводы', scale: 'Масштаб', original: 'оригинал', brutto: 'брутто', netto: 'нетто',
    ingredients: 'Ингредиенты', min: 'мин', hr: 'ч',
    product: 'продукт', loss: 'потери', kcal: 'ккал', g: 'г', protShort: 'Б', fatShort: 'Ж', carbsShort: 'У', carbsLabel: 'углев', per100g: '/100г', perOneServing: 'На 1 порцию',
    servingsLabel: 'Порции:', copyTitle: 'Скопировать рецепт',
    removedNote: 'Убрано как неподходящее',
  },
  en: {
    dishType: { soup: 'Soup', stew: 'Stew', salad: 'Salad', stirfry: 'Stir-fry', stir_fry: 'Stir-fry', grill: 'Grill', bake: 'Bake', pasta: 'Pasta', raw: 'Raw', default: 'Dish' },
    complexity: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
    goal: { high_protein: 'High protein', low_calorie: 'Low calorie', balanced: 'Balanced' },
    tag: { vegan: 'Vegan', vegetarian: 'Vegetarian', pescatarian: 'Pescatarian' },
    allergen: { gluten: 'Gluten', lactose: 'Lactose', nuts: 'Nuts', eggs: 'Eggs', fish: 'Fish', shellfish: 'Shellfish', soy: 'Soy' },
    role: { protein: 'protein', side: 'veg', aromatic: 'arom.', spice: 'spice', oil: 'oil', condiment: 'dressing', liquid: 'liquid', base: 'base', other: 'other' },
    balance: ['High', 'Medium', 'Low'],
    portion: 'serv.', copy: 'Recipe copied', perServing: 'Per serving', total: 'Total', steps: 'Steps', context: 'Analysis', unresolved: 'Not in DB',
    noAllergens: 'No allergens', protein: 'protein', fat: 'fat', carbs: 'carbs', scale: 'Scale', original: 'orig', brutto: 'gross', netto: 'net',
    ingredients: 'Ingredients', min: 'min', hr: 'h',
    product: 'product', loss: 'loss', kcal: 'kcal', g: 'g', protShort: 'P', fatShort: 'F', carbsShort: 'C', carbsLabel: 'carbs', per100g: '/100g', perOneServing: 'Per serving',
    servingsLabel: 'Servings:', copyTitle: 'Copy recipe',
    removedNote: 'Removed as unsuitable',
  },
  pl: {
    dishType: { soup: 'Zupa', stew: 'Duszenie', salad: 'Sałatka', stirfry: 'Wok', stir_fry: 'Wok', grill: 'Grill', bake: 'Pieczenie', pasta: 'Makaron', raw: 'Surowe', default: 'Danie' },
    complexity: { easy: 'Łatwe', medium: 'Średnie', hard: 'Trudne' },
    goal: { high_protein: 'Dużo białka', low_calorie: 'Niskokaloryczne', balanced: 'Zbalansowane' },
    tag: { vegan: 'Wegańskie', vegetarian: 'Wegetar.', pescatarian: 'Peskatariań.' },
    allergen: { gluten: 'Gluten', lactose: 'Laktoza', nuts: 'Orzechy', eggs: 'Jajka', fish: 'Ryby', shellfish: 'Skorupiaki', soy: 'Soja' },
    role: { protein: 'białko', side: 'warzywo', aromatic: 'aromat', spice: 'przyprawa', oil: 'olej', condiment: 'sos', liquid: 'płyn', base: 'baza', other: 'inne' },
    balance: ['Wysoki', 'Średni', 'Niski'],
    portion: 'porcji', copy: 'Przepis skopiowany', perServing: 'Na porcję', total: 'Razem', steps: 'Przygotowanie', context: 'Analiza dania', unresolved: 'Brak w bazie',
    noAllergens: 'Bez alergenów', protein: 'białko', fat: 'tłuszcze', carbs: 'węglowodany', scale: 'Skala', original: 'oryginał', brutto: 'brutto', netto: 'netto',
    ingredients: 'Składniki', min: 'min', hr: 'godz.',
    product: 'produkt', loss: 'straty', kcal: 'kcal', g: 'g', protShort: 'B', fatShort: 'T', carbsShort: 'W', carbsLabel: 'węgl', per100g: '/100g', perOneServing: 'Na 1 porcję',
    servingsLabel: 'Porcje:', copyTitle: 'Skopiuj przepis',
    removedNote: 'Pominięto niepasujące składniki',
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
    removedNote: 'Вилучено як невідповідне',
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
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold text-muted-foreground w-20 shrink-0 capitalize">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-bold text-muted-foreground/70 w-20 text-right tabular-nums whitespace-nowrap">
        {Math.round(value)}{gUnit ?? 'g'} · {level}
      </span>
    </div>
  );
}

function RecipeCardView({ card, lang }: { card: RecipeCard; lang?: string }) {
  const t = i18n[lang ?? 'ru'] ?? i18n.ru;
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // ── Modes & UI State ──
  const [displayMode, setDisplayMode] = useState<'QUICK' | 'COOK' | 'ANALYSIS'>('QUICK');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleStep = (step: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step); else next.add(step);
      return next;
    });
  };

  // ── Serving scaler ──
  const baseServings = card.servings;
  const [servings, setServings] = useState(baseServings);
  const scale = servings / baseServings;

  useEffect(() => {
    let id1: number, id2: number;
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setVisible(true));
    });
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
  }, []);

  const dishIcon = DISH_TYPE_ICON[card.dish_type] ?? '🍽️';
  const title = card.display_name ?? card.dish_name_local ?? card.dish_name;
  const totalTime = card.steps.reduce((sum, s) => sum + (s.time_min ?? 0), 0);
  const portionG = Math.round(card.total_output_g / card.servings);

  const fmtTime = (min: number): string => {
    if (min <= 0) return '';
    const rounded = Math.round(min / 5) * 5 || min;
    if (rounded < 60) return `${rounded} ${t.min}`;
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    return m === 0 ? `${h} ${t.hr}` : `${h} ${t.hr} ${m} ${t.min}`;
  };

  const roleOrder = ['protein', 'base', 'side', 'aromatic', 'oil', 'spice', 'condiment', 'liquid', 'other'];
  const sortedIngredients = [...card.ingredients]
    .filter(i => i.gross_g > 0 || i.net_g > 0)
    .sort((a, b) => (roleOrder.indexOf(a.role) === -1 ? 99 : roleOrder.indexOf(a.role)) - (roleOrder.indexOf(b.role) === -1 ? 99 : roleOrder.indexOf(b.role)));

  const sumGross = (card.total_gross_g ?? card.ingredients.reduce((s, i) => s + i.gross_g, 0)) * scale;
  const sumNet = card.total_output_g * scale;
  const sumLoss = (card.total_loss_g ?? (sumGross / scale - sumNet / scale)) * scale;
  const lossPct = card.loss_percent ?? (sumGross > 0 ? Math.round((sumLoss / sumGross) * 100) : 0);
  const sumKcal = Math.round(card.ingredients.reduce((s, i) => s + i.kcal, 0) * scale);

  const perProt = Math.round(card.per_serving_protein);
  const perFat = Math.round(card.per_serving_fat);
  const perCarbs = Math.round(card.per_serving_carbs);
  const perKcal = Math.round(card.per_serving_kcal);

  // ── Copy recipe ──
  const [copied, setCopied] = useState(false);
  const copyRecipe = useCallback(() => {
    const lines = [`${dishIcon} ${title}`, `${servings} ${t.portion} · ${perKcal} ${t.kcal}/porc · ${portionG}g`, ''];
    lines.push(`📋 ${t.ingredients}:`);
    sortedIngredients.forEach(ing => lines.push(`  • ${ing.name} — ${Math.round(ing.gross_g * scale)}g`));
    lines.push('', `👨‍🍳 ${t.steps}:`);
    card.steps.forEach(s => lines.push(`  ${s.step}. ${s.text} ${s.time_min ? `(${s.time_min} ${t.min})` : ''}`));
    navigator.clipboard.writeText(lines.join('\n')).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }, [card, title, servings, perKcal, portionG, scale, sortedIngredients, t, dishIcon]);

  return (
    <div ref={cardRef} className={cn(
      'rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl overflow-hidden transition-all duration-700 ease-out',
      visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[0.98]',
    )}>
      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-20 bg-card/90 backdrop-blur-md border-b border-border/10 px-3 py-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{dishIcon}</span>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-foreground truncate leading-tight uppercase italic">{title}</h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground font-black uppercase tracking-tighter">
                <span>{servings} {t.portion}</span>
                <span className="opacity-20">/</span>
                <span>~{portionG}g</span>
                <span className="opacity-20">/</span>
                <span className="text-orange-500">{perKcal} {t.kcal}</span>
                {totalTime > 0 && (
                  <>
                    <span className="opacity-20">/</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {fmtTime(totalTime)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Portions Selector */}
            <div className="flex items-center bg-muted/20 rounded-lg p-0.5 border border-border/10">
              <button onClick={() => setServings(s => Math.max(1, s - 1))} className="w-6 h-6 flex items-center justify-center hover:bg-muted/40 rounded transition-colors"><Minus className="w-3 h-3" /></button>
              <span className="w-5 text-center text-[11px] font-black">{servings}</span>
              <button onClick={() => setServings(s => s + 1)} className="w-6 h-6 flex items-center justify-center hover:bg-muted/40 rounded transition-colors"><Plus className="w-3 h-3" /></button>
            </div>
          </div>
        </div>

        {/* Macros Summary (High density) */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/5">
          <div className="flex gap-3 text-[11px] font-black tracking-tighter">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground/40">{t.protShort}</span>
              <span className="text-blue-500">{perProt}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground/40">{t.fatShort}</span>
              <span className="text-yellow-500">{perFat}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground/40">{t.carbsShort}</span>
              <span className="text-green-500">{perCarbs}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
               onClick={() => { setDisplayMode(m => m === 'QUICK' ? 'COOK' : m === 'COOK' ? 'ANALYSIS' : 'QUICK') }}
               className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
            >
              {displayMode}
            </button>
            <button onClick={copyRecipe} className={cn('p-1.5 rounded-lg transition-all', copied ? 'text-emerald-500' : 'text-muted-foreground/30 hover:text-foreground')}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* ── SECTION: INGREDIENTS ── */}
        <div className="rounded-xl border border-border/10 bg-muted/5 overflow-hidden">
          <button
            onClick={() => toggleSection('ing')}
            className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-muted/10 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-black tracking-[0.15em] text-muted-foreground/60 group-hover:text-foreground transition-colors">{t.ingredients} ({sortedIngredients.length})</span>
            </div>
            {expandedSections.has('ing') || displayMode === 'ANALYSIS' ? <Minus className="w-3 h-3 text-muted-foreground" /> : <Plus className="w-3 h-3 text-muted-foreground" />}
          </button>

          {(expandedSections.has('ing') || displayMode === 'ANALYSIS') && (
            <div className="px-1 pb-2 border-t border-border/5 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="grid grid-cols-[1fr_50px_45px_45px] gap-1 px-2 py-1 text-[8px] font-black tracking-widest text-muted-foreground/30">
                <span>{t.product}</span>
                <span className="text-right">{t.brutto}</span>
                <span className="text-right">{t.loss}</span>
                <span className="text-right">{t.kcal}</span>
              </div>
              <div className="space-y-0.5">
                {sortedIngredients.map((ing, i) => {
                  const gross = Math.round(ing.gross_g * scale);
                  const net = Math.round(ing.net_g * scale);
                  const loss = gross - net;
                  const rc = ROLE_COLORS[ing.role] ?? ROLE_COLORS.other;
                  return (
                    <div key={i} className={cn("grid grid-cols-[1fr_50px_45px_45px] gap-1 px-2 py-1.5 rounded-lg items-center border-l-2 bg-muted/10 hover:bg-muted/20 transition-all", rc.border)}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-foreground truncate">{ing.name}</span>
                        {ing.state && <span className="text-[10px] text-muted-foreground/40 whitespace-nowrap">{STATE_EMOJI[ing.state] ?? ''} {ing.state}</span>}
                      </div>
                      <span className="text-[10px] font-bold text-right text-muted-foreground/60 tabular-nums">{gross}g</span>
                      <span className={cn("text-[10px] font-bold text-right tabular-nums", loss > 0 ? "text-rose-500/50" : "text-muted-foreground/20")}>{loss > 0 ? `-${loss}g` : '—'}</span>
                      <span className="text-[10px] font-bold text-right text-orange-500/60 tabular-nums">{Math.round(ing.kcal * scale)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between text-[11px] font-black">
                 <span className="text-primary/40 tracking-widest">{t.total}</span>
                 <div className="flex gap-3">
                   <span className="text-muted-foreground">{Math.round(sumNet)}g</span>
                   <span className="text-orange-500">{sumKcal} {t.kcal}</span>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION: PREPARATION ── */}
        <div className="rounded-xl border border-border/10 bg-muted/5 overflow-hidden">
          <button
            onClick={() => toggleSection('steps')}
            className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-muted/10 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <CookingPot className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-black tracking-[0.15em] text-muted-foreground/60 group-hover:text-foreground transition-colors">{t.steps} ({card.steps.length})</span>
            </div>
            {expandedSections.has('steps') || displayMode === 'COOK' ? <Minus className="w-3 h-3 text-muted-foreground" /> : <Plus className="w-3 h-3 text-muted-foreground" />}
          </button>

          {(expandedSections.has('steps') || displayMode === 'COOK') && (
            <div className="px-2 pb-3 border-t border-border/5 space-y-1 pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
              {card.steps.map((step, i) => {
                const isExp = expandedSteps.has(step.step) || displayMode === 'COOK';
                return (
                  <div key={i} className="rounded-lg bg-card/40 border border-border/10 overflow-hidden">
                    <button
                      onClick={() => toggleStep(step.step)}
                      className="flex items-start gap-3 w-full p-2.5 text-left hover:bg-primary/5 transition-colors group"
                    >
                      <span className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-[10px] font-black text-muted-foreground shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-all">{step.step}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-bold text-foreground leading-tight transition-all", isExp ? "" : "truncate")}>{step.text}</p>
                        {step.time_min && (
                           <div className="flex items-center gap-1 mt-1 text-[9px] font-black text-primary/60 uppercase">
                             <Clock className="w-2.5 h-2.5" />
                             {step.time_min} {t.min}
                           </div>
                        )}
                      </div>
                    </button>
                    {isExp && (step.tip || step.temp_c) && (
                      <div className="px-3 pb-3 pt-1 pl-11 space-y-2 animate-in fade-in duration-300">
                        {step.temp_c && (
                           <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-orange-500">
                             <Thermometer className="w-3 h-3" />
                             {step.temp_c}°C
                           </div>
                        )}
                        {step.tip && (
                          <div className="flex items-start gap-2 p-2 rounded bg-amber-500/5 border border-amber-500/10">
                            <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-medium text-amber-800/70 dark:text-amber-200/60 leading-relaxed italic">{step.tip}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SECTION: ANALYSIS ── */}
        <div className="rounded-xl border border-border/10 bg-muted/5 overflow-hidden">
          <button
            onClick={() => toggleSection('meta')}
            className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-muted/10 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-black tracking-[0.15em] text-muted-foreground/60 group-hover:text-foreground transition-colors">{t.context}</span>
            </div>
            {expandedSections.has('meta') || displayMode === 'ANALYSIS' ? <Minus className="w-3 h-3 text-muted-foreground" /> : <Plus className="w-3 h-3 text-muted-foreground" />}
          </button>

          {(expandedSections.has('meta') || displayMode === 'ANALYSIS') && (
            <div className="px-3 pb-3 pt-2 border-t border-border/5 space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
              {/* Complexity & Goal */}
              <div className="flex flex-wrap gap-1.5 font-black">
                {card.complexity && (
                  <span className={cn(
                    "px-2 py-1 rounded-md text-[9px] uppercase tracking-widest border",
                    card.complexity === 'easy' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                    card.complexity === 'medium' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                    "bg-red-500/10 text-red-500 border-red-500/20"
                  )}>
                    {t.complexity[card.complexity] ?? card.complexity}
                  </span>
                )}
                {card.goal && (
                   <span className="px-2 py-1 rounded-md text-[9px] uppercase tracking-widest bg-violet-500/10 text-violet-500 border border-violet-500/20">
                     {t.goal[card.goal] ?? card.goal}
                   </span>
                )}
                {card.tags?.map(tag => (
                   <span key={tag} className="px-2 py-1 rounded-md text-[9px] uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                     {t.tag[tag] ?? tag}
                   </span>
                ))}
              </div>

              {/* Allergens Warn */}
              {card.allergens && card.allergens.length > 0 ? (
                <div className="flex items-center gap-2 p-2 rounded bg-rose-500/5 border border-rose-500/10">
                  <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                  <div className="flex flex-wrap gap-x-2 text-[9px] font-black uppercase text-rose-500/70 tracking-widest">
                    {card.allergens.map(a => t.allergen[a] ?? a).join(' · ')}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded bg-emerald-500/5 border border-emerald-500/10 text-[9px] font-black uppercase text-emerald-500/60 tracking-widest">
                  <Check className="w-3 h-3" />
                  {t.noAllergens}
                </div>
              )}

              {/* Data Summary */}
              <div className="space-y-1 mt-2">
                <BalanceBar label={t.protein} value={perProt} max={50} color="bg-blue-500" levels={t.balance} gUnit={t.g} />
                <BalanceBar label={t.fat} value={perFat} max={45} color="bg-yellow-500" levels={t.balance} gUnit={t.g} />
                <BalanceBar label={t.carbs} value={perCarbs} max={80} color="bg-green-500" levels={t.balance} gUnit={t.g} />
              </div>

              <div className="pt-2 text-center">
                 <span className="text-[9px] font-bold text-rose-500/60 tracking-widest">
                   {t.loss} −{Math.round(sumLoss)}{t.g} ({lossPct}%)
                 </span>
              </div>

              {/* Removed ingredients notice */}
              {card.removed_ingredients && card.removed_ingredients.length > 0 && (
                <div className="flex items-start gap-2 p-2 rounded bg-amber-500/5 border border-amber-500/10 mt-2">
                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] font-black text-amber-600/80 dark:text-amber-400/80 block mb-0.5">{t.removedNote}:</span>
                    <div className="flex flex-wrap gap-1">
                      {card.removed_ingredients.map((r, i) => (
                        <span key={i} className="text-[8px] font-bold text-amber-500/60 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {r.slug} <span className="opacity-50">({r.reason})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
      {/* Recipe cards — wider for better legibility */}
      {recipeCards.map((card, i) => (
        <div key={`recipe-${i}`} className="max-w-2xl">
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
