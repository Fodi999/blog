'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { 
  Search, Package, Flame, Beef, Droplets, Wheat, 
  ChevronRight, X, LayoutGrid, ArrowRight 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CATEGORY_ORDER } from './ingredient-utils';
import { cn } from '@/lib/utils';

export type IngredientItem = {
  slug: string;
  name: string;
  nameEn: string;
  image: string | null;
  category: string;
  calories: number;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

type CategoryLabels = Record<string, string>;

type I18n = {
  title: string;
  searchPlaceholder: string;
  allCategories: string;
  viewProduct: string;
  noResults: string;
  totalCount: string;
  perPage: string;
  resetFilters: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
  unit100g: string;
  categoryLabels: CategoryLabels;
};

export function IngredientsClient({
  items,
  i18n,
  locale,
}: {
  items: IngredientItem[];
  i18n: I18n;
  locale: string;
}) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const seen = new Set<string>();
    items.forEach((item) => seen.add(item.category));
    return CATEGORY_ORDER.filter((c) => seen.has(c));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.slug.includes(q);
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [items, search, activeCategory]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* ── Sticky Search Header ── */}
      <div className="sticky top-24 z-[20] py-4 -mx-1 px-1">
        <div className="relative max-w-xl group">
          <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center h-14 rounded-2xl bg-muted/80 dark:bg-white/[0.03] backdrop-blur-3xl border border-border dark:border-white/10 shadow-2xl overflow-hidden px-4 group-focus-within:border-primary/50 transition-all duration-500">
             <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-500" />
             <input
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder={i18n.searchPlaceholder}
               className="flex-1 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground text-sm font-black uppercase tracking-widest px-4 italic"
             />
             {search && (
               <button
                 onClick={() => setSearch('')}
                 className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/5 transition-all"
                 type="button"
               >
                 <X className="h-4 w-4" />
               </button>
             )}
          </div>
        </div>
      </div>

      {/* ── Category Horizontal Scale ── */}
      <div className="category-scroll-row flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible sm:pb-0 items-center">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            "shrink-0 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 italic border",
            activeCategory === 'all'
              ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.05]'
              : 'bg-muted dark:bg-white/[0.02] border-border dark:border-white/5 text-muted-foreground hover:border-primary/20 hover:text-foreground'
          )}
        >
          {i18n.allCategories}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "shrink-0 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 italic border",
              activeCategory === cat
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.05]'
                : 'bg-muted dark:bg-white/[0.02] border-border dark:border-white/5 text-muted-foreground hover:border-primary/20 hover:text-foreground'
            )}
          >
            {i18n.categoryLabels[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* ── Meta Info Row ── */}
      <div className="flex items-center justify-between px-2 pt-2">
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] italic">
          <span className="text-primary">{filtered.length}</span> <span className="opacity-50">{i18n.totalCount}</span>
        </p>
        {(search || activeCategory !== 'all') && (
          <button
            onClick={() => { setSearch(''); setActiveCategory('all'); }}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-foreground transition-all italic flex items-center gap-2 group"
            type="button"
          >
            <X className="h-3 w-3 group-hover:rotate-90 transition-transform" />
            {i18n.resetFilters}
          </button>
        )}
      </div>

      {/* ── Grid: Deep Obsidian Ingredient Cards ── */}
      {filtered.length === 0 ? (
        <div className="p-16 sm:p-24 text-center rounded-[3rem] sm:rounded-[4rem] border-2 border-dashed border-border dark:border-white/5 bg-muted/20 dark:bg-white/[0.01]">
           <LayoutGrid className="h-12 sm:h-16 w-12 sm:w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
           <p className="text-xs sm:text-sm text-muted-foreground font-black uppercase tracking-widest italic">
             {i18n.noResults}
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
          {filtered.map((item) => (
            <Link
              key={item.slug}
              href={`/chef-tools/ingredients/${item.slug}` as any}
              className="group flex flex-col p-3.5 sm:p-5 rounded-[2rem] sm:rounded-[2.5rem] bg-card dark:bg-white/[0.02] backdrop-blur-2xl border border-border dark:border-white/5 hover:border-primary/30 hover:bg-muted dark:hover:bg-white/[0.05] transition-all duration-700 hover-lift hover-glow shadow-2xl dark:shadow-black/20"
            >
              <div className="relative w-full aspect-square rounded-[1.5rem] sm:rounded-[1.8rem] overflow-hidden bg-muted dark:bg-slate-900 border border-border/50 dark:border-white/5 mb-4 sm:mb-5">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 brightness-95 dark:brightness-90 group-hover:brightness-100"
                    sizes="(max-width: 640px) 150px, 200px"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20">
                    <Package className="h-8 sm:h-10 w-8 sm:w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 dark:from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </div>

              <div className="px-0.5 sm:px-1 flex-1">
                <p className="text-[11px] sm:text-[13px] font-black text-foreground group-hover:text-primary transition-colors leading-tight italic uppercase tracking-tight mb-3 sm:mb-4 min-h-[2.5em] line-clamp-2">
                  {item.name}
                </p>

                <div className="flex items-center justify-between mb-2.5 sm:mb-3 border-t border-border/50 dark:border-white/5 pt-2.5 sm:pt-3">
                  <div className="flex items-center gap-1.5 group/kcal">
                    <Flame className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-orange-500 group-hover/kcal:animate-pulse" />
                    <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground italic flex items-center gap-1">
                      {item.calories} <span className="text-[7px] sm:text-[8px] opacity-60 font-bold">KCAL</span>
                      <span className="text-[7px] opacity-30 font-bold">/ {i18n.unit100g}</span>
                    </span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <div className="flex flex-col items-center p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-muted/50 dark:bg-white/[0.03] border border-border/50 dark:border-white/5">
                    <Beef className="h-2 sm:h-2.5 w-2 sm:w-2.5 text-red-500 mb-1 opacity-60" />
                    <span className="text-[8px] sm:text-[9px] font-black text-muted-foreground italic">
                      {item.protein != null ? `${Math.round(item.protein)}g` : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-muted/50 dark:bg-white/[0.03] border border-border/50 dark:border-white/5">
                    <Droplets className="h-2 sm:h-2.5 w-2 sm:w-2.5 text-blue-500 mb-1 opacity-60" />
                    <span className="text-[8px] sm:text-[9px] font-black text-muted-foreground italic">
                      {item.fat != null ? `${Math.round(item.fat)}g` : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-muted/50 dark:bg-white/[0.03] border border-border/50 dark:border-white/5">
                    <Wheat className="h-2 sm:h-2.5 w-2 sm:w-2.5 text-green-500 mb-1 opacity-60" />
                    <span className="text-[8px] sm:text-[9px] font-black text-muted-foreground italic">
                      {item.carbs != null ? `${Math.round(item.carbs)}g` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* SEO Footer Context */}
      <div className="mt-12 text-center py-12 border-t border-border/50 dark:border-white/5">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground italic">
            Deep Culinary Data Engine<span className="text-primary italic">.</span>
         </p>
      </div>
    </div>
  );
}
