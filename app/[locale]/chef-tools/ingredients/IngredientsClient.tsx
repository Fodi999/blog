'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { Search, Package, Flame, Beef, Droplets, Wheat, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CATEGORY_ORDER } from './ingredient-utils';

export type IngredientItem = {
  slug: string;
  name: string;
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
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
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

  // Collect categories that actually exist
  const categories = useMemo(() => {
    const seen = new Set<string>();
    items.forEach((item) => seen.add(item.category));
    return CATEGORY_ORDER.filter((c) => seen.has(c));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [items, search, activeCategory]);

  return (
    <div className="space-y-6">
      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={i18n.searchPlaceholder}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap items-center">
          <Badge
            variant={activeCategory === 'all' ? 'default' : 'outline'}
            className="cursor-pointer text-[10px] font-black uppercase tracking-wider px-2.5 py-1 h-auto"
            onClick={() => setActiveCategory('all')}
          >
            {i18n.allCategories}
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              className="cursor-pointer text-[10px] font-black uppercase tracking-wider px-2.5 py-1 h-auto"
              onClick={() => setActiveCategory(cat)}
            >
              {i18n.categoryLabels[cat] ?? cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Results count */}
      {(search || activeCategory !== 'all') && (
        <p className="text-[11px] text-muted-foreground font-medium">
          {filtered.length} {i18n.totalCount}
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground font-medium">
          {i18n.noResults}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((item) => (
            <Link
              key={item.slug}
              href={`/chef-tools/nutrition/${item.slug}?from=catalog` as any}
              className="group"
            >
              <Card className="h-full hover:border-primary/30 hover:shadow-md transition-all cursor-pointer overflow-hidden">
                {/* Image */}
                <div className="aspect-square bg-muted border-b border-border/40 flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={120}
                      height={120}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <Package className="h-8 w-8 text-muted-foreground/30" />
                  )}
                </div>

                <CardContent className="p-2.5">
                  {/* Name */}
                  <p className="font-black text-foreground text-[11px] uppercase tracking-tight leading-tight mb-2 line-clamp-2 min-h-[2.5em]">
                    {item.name}
                  </p>

                  {/* Calories */}
                  <div className="flex items-center gap-1 mb-1.5">
                    <Flame className="h-3 w-3 text-orange-500 shrink-0" />
                    <span className="text-[11px] font-black text-foreground">
                      {item.calories}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-medium">
                      {i18n.calories}
                    </span>
                  </div>

                  {/* Macros row */}
                  <div className="flex gap-1.5">
                    <div className="flex items-center gap-0.5">
                      <Beef className="h-2.5 w-2.5 text-red-500 shrink-0" />
                      <span className="text-[9px] font-bold text-muted-foreground">
                        {item.protein != null ? `${item.protein}g` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Droplets className="h-2.5 w-2.5 text-yellow-500 shrink-0" />
                      <span className="text-[9px] font-bold text-muted-foreground">
                        {item.fat != null ? `${item.fat}g` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Wheat className="h-2.5 w-2.5 text-green-500 shrink-0" />
                      <span className="text-[9px] font-bold text-muted-foreground">
                        {item.carbs != null ? `${item.carbs}g` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Per label */}
                  <p className="text-[8px] text-muted-foreground/50 font-medium mt-1">
                    {i18n.perPage}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
