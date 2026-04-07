'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HeroIngredient {
  slug: string;
  name: string;
  image_url: string;
  calories: number;
  protein: number | null;
}

interface Props {
  ingredients: HeroIngredient[];
  totalCount: number;
  locale: string;
  i18n: {
    catalogLabel: string;
    ingredientsLabel: string;
    kcalLabel: string;
    ctaText: string;
    valueProps: string[];
  };
}

/* ── Animated counter ────────────────────────────────────────── */
function AnimatedNumber({ value, duration = 1800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.floor(value / 60));
    const interval = duration / (value / step);

    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{display}</>;
}

/* ── Main Component ──────────────────────────────────────────── */
export function HeroIngredientCards({
  ingredients,
  totalCount,
  locale,
  i18n,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isBottomVisible, setIsBottomVisible] = useState(false);

  // Use ingredients as-is (pre-selected on server to avoid hydration mismatch)
  const cards = ingredients.slice(0, 8);

  // Stagger card appearance
  useEffect(() => {
    if (cards.length === 0) return;

    const timers: NodeJS.Timeout[] = [];
    cards.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleCount((prev) => Math.max(prev, i + 1));
        }, 300 + i * 200)
      );
    });

    // Show bottom section after cards
    timers.push(
      setTimeout(() => setIsBottomVisible(true), 300 + cards.length * 200 + 200)
    );

    return () => timers.forEach(clearTimeout);
  }, [cards]);

  if (cards.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* ── Cards grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((item, i) => (
          <div
            key={item.slug}
            className={cn(
              'group relative rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden transition-all duration-700',
              'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1',
              i < visibleCount
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-8 scale-95'
            )}
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            <div className="aspect-square relative overflow-hidden">
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs sm:text-sm font-bold truncate leading-tight">
                  {item.name}
                </p>
                <p className="text-white/60 text-[10px] sm:text-xs font-medium mt-0.5">
                  {item.calories} {i18n.kcalLabel}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Value proposition + CTA ── */}
      <div
        className={cn(
          'transition-all duration-700',
          isBottomVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-6'
        )}
      >
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8 px-6 py-5 rounded-2xl border border-primary/15 bg-primary/[0.03] backdrop-blur-sm">
          {/* Counter */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <span className="text-primary text-xl font-black">
                {isBottomVisible && <AnimatedNumber value={totalCount} />}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-foreground leading-tight uppercase tracking-tight">
                {i18n.catalogLabel}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                {i18n.ingredientsLabel}
              </p>
            </div>
          </div>

          {/* Separator */}
          <div className="hidden sm:block w-px h-10 bg-border/40" />

          {/* Value props */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 flex-1 justify-center sm:justify-start">
            {i18n.valueProps.map((prop, idx) => (
              <span key={idx} className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary/60" />
                {prop}
              </span>
            ))}
          </div>

          {/* CTA */}
          <a
            href={`/${locale}/chef-tools/ingredients`}
            className="group/cta inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-black uppercase tracking-wider transition-all duration-300 shrink-0"
          >
            <Search className="h-3.5 w-3.5" />
            {i18n.ctaText}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
