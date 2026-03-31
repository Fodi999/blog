'use client';

import { useState, useCallback } from 'react';
import type { StructuredIngredient } from '@/lib/api';

// ── Emoji mapping ────────────────────────────────────────────────────

const typeEmoji: Record<string, string> = {
  seafood: '🐟', meat: '🥩', poultry: '🍗', dairy: '🧀', egg: '🥚',
  grain: '🌾', bread: '🍞', legume: '🫘', vegetable: '🥬', fruit: '🍎',
  nut: '🥜', oil: '🫒', spice: '🌶️', condiment: '🥢', sauce: '🥫',
  mushroom: '🍄', sweetener: '🍯', beverage: '🥤',
};

// ── Locale labels ────────────────────────────────────────────────────

const LOCALE_LABELS: Record<string, {
  title: string;
  servings: string;
  total: string;
  perServing: string;
}> = {
  en: { title: 'Ingredients', servings: 'servings', total: 'Total', perServing: 'per serving' },
  ru: { title: 'Ингредиенты', servings: 'порций', total: 'Итого', perServing: 'на порцию' },
  pl: { title: 'Składniki', servings: 'porcji', total: 'Razem', perServing: 'na porcję' },
  uk: { title: 'Інгредієнти', servings: 'порцій', total: 'Разом', perServing: 'на порцію' },
};

// ── Props ────────────────────────────────────────────────────────────

interface Props {
  ingredients: StructuredIngredient[];
  locale: string;
}

// ══════════════════════════════════════════════════════════════════════
// IngredientsList — with portion multiplier + scroll highlight
// ══════════════════════════════════════════════════════════════════════

export function IngredientsList({ ingredients, locale }: Props) {
  const [multiplier, setMultiplier] = useState(1);
  const [highlightSlug, setHighlightSlug] = useState<string | null>(null);
  const labels = LOCALE_LABELS[locale] ?? LOCALE_LABELS.en;

  if (!ingredients || ingredients.length === 0) return null;

  const totalGrams = ingredients.reduce((s, i) => s + i.grams * multiplier, 0);
  const totalKcal = ingredients.reduce((s, i) => s + i.kcal * multiplier, 0);
  const totalProtein = ingredients.reduce((s, i) => s + i.protein * multiplier, 0);
  const totalFat = ingredients.reduce((s, i) => s + i.fat * multiplier, 0);
  const totalCarbs = ingredients.reduce((s, i) => s + i.carbs * multiplier, 0);

  return (
    <section className="mb-10">
      {/* Header: title + multiplier toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{labels.title}</h2>
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5">
          {[1, 2, 4].map((m) => (
            <button
              key={m}
              onClick={() => setMultiplier(m)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                multiplier === m
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ×{m}
            </button>
          ))}
          <span className="text-xs text-muted-foreground px-1.5 hidden sm:inline">
            {labels.servings}
          </span>
        </div>
      </div>

      {/* Ingredient list */}
      <div className="bg-muted/15 rounded-xl border divide-y">
        {ingredients.map((ing) => {
          const grams = Math.round(ing.grams * multiplier);
          const kcal = Math.round(ing.kcal * multiplier);
          const protein = +(ing.protein * multiplier).toFixed(1);
          const emoji = ing.product_type ? typeEmoji[ing.product_type] : '🥄';
          const isHighlighted = highlightSlug === ing.slug;

          return (
            <div
              key={ing.slug}
              id={`blog-ing-${ing.slug}`}
              className={`flex items-center gap-3 px-4 py-3 transition-all ${
                isHighlighted ? 'bg-primary/10 ring-2 ring-primary/30' : ''
              }`}
            >
              {/* Image or emoji */}
              {ing.image_url ? (
                <img
                  src={ing.image_url}
                  alt={ing.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <span className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg flex-shrink-0">
                  {emoji}
                </span>
              )}

              {/* Name + micro info */}
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm sm:text-base block truncate">
                  {ing.name}
                </span>
                <span className="text-[11px] text-muted-foreground hidden sm:block">
                  {ing.product_type && (
                    <span className="capitalize">{ing.product_type}</span>
                  )}
                  {protein > 0 && <span className="ml-2">Б {protein}г</span>}
                </span>
              </div>

              {/* Grams */}
              <span className="text-sm font-semibold tabular-nums w-16 text-right">
                {grams} г
              </span>

              {/* Kcal */}
              <span className="text-xs text-muted-foreground tabular-nums w-16 text-right hidden sm:block">
                {kcal} kcal
              </span>
            </div>
          );
        })}

        {/* Totals row */}
        <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 font-semibold">
          <span className="w-10 flex-shrink-0 text-center text-lg">📊</span>
          <span className="flex-1 text-sm">{labels.total}</span>
          <span className="text-sm tabular-nums w-16 text-right">
            {Math.round(totalGrams)} г
          </span>
          <span className="text-xs tabular-nums w-16 text-right hidden sm:block">
            {Math.round(totalKcal)} kcal
          </span>
        </div>
      </div>

      {/* Macro summary bar */}
      <div className="flex justify-center gap-6 mt-3 text-xs text-muted-foreground">
        <span>🔥 {Math.round(totalKcal)} kcal</span>
        <span>💪 {totalProtein.toFixed(1)}g protein</span>
        <span>🧈 {totalFat.toFixed(1)}g fat</span>
        <span>🌾 {totalCarbs.toFixed(1)}g carbs</span>
      </div>

      {/* Per-serving note */}
      {multiplier > 1 && (
        <p className="text-[11px] text-muted-foreground text-center mt-1">
          ×{multiplier} {labels.servings} · {labels.perServing}: ~{Math.round(totalKcal / multiplier)} kcal
        </p>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Helper: scroll to ingredient in the list (used from recipe steps)
// ══════════════════════════════════════════════════════════════════════

export function scrollToIngredient(slug: string) {
  const el = document.getElementById(`blog-ing-${slug}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('bg-primary/10', 'ring-2', 'ring-primary/30');
    setTimeout(() => {
      el.classList.remove('bg-primary/10', 'ring-2', 'ring-primary/30');
    }, 2000);
  }
}
