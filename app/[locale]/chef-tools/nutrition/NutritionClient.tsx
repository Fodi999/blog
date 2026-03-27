'use client';

import { useState, useCallback, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import type { ApiIngredient } from '@/lib/api';

// UUID → category key mapping (derived from API data)
const CATEGORY_MAP: Record<string, string> = {
  '5a841ce0-2ea5-4230-a1f7-011fa445afdc': 'vegetables',
  '40ce05d1-70c1-4766-b697-45ac6c857d4a': 'spices',
  '503794cf-37e0-48c1-a6d8-b5c3f21e03a1': 'fish',
  'd4a64b25-a187-4ec0-9518-3e8954a138fa': 'fruits',
  'eb707494-78f8-427f-9408-9c297a882ae0': 'meat',
  'b33520f3-e788-40a1-9f27-186cad5d96da': 'dairy',
  'd532ac04-0d29-4a76-ab6e-9d08e183119c': 'grains',
  'ec31941e-8ec6-41d7-9485-73ed9006d34d': 'sauces',
  '1e9fdeb2-4f7a-4013-8fa7-0abb16573a0a': 'nuts',
  '85ea8da9-236a-4bb7-906f-cc4fe2e0c47f': 'sweets',
  '102d4138-7137-4de7-8ef3-853c1662305d': 'drinks',
  '9d882580-9b21-42cc-b731-56d78cd779bc': 'legumes',
  'e49781ea-2c07-46af-b417-548ac6d3d788': 'preserved',
  '415c59fd-ce2c-41eb-9312-131e055049ba': 'oils',
  '737707e6-a641-4739-98f7-bad9f18a2e33': 'other',
};

// Category display order
const CATEGORY_ORDER = [
  'vegetables', 'fruits', 'meat', 'fish', 'dairy',
  'grains', 'legumes', 'nuts', 'oils', 'sauces',
  'spices', 'sweets', 'drinks', 'preserved', 'other',
];

type Props = {
  initialIngredients: ApiIngredient[];
  locale: string;
  i18n: {
    searchPlaceholder: string;
    noResults: string;
    calories: string;
    protein: string;
    fat: string;
    carbs: string;
    name: string;
    per100g: string;
    allCategories: string;
    categories: Record<string, string>;
  };
};

function localizedName(item: ApiIngredient, locale: string): string {
  if (locale === 'pl' && item.name_pl) return item.name_pl;
  if (locale === 'ru' && item.name_ru) return item.name_ru;
  if (locale === 'uk' && item.name_uk) return item.name_uk;
  return item.name_en ?? item.name;
}

export function NutritionClient({ initialIngredients, locale, i18n }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ApiIngredient[]>(initialIngredients);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Build list of categories that actually exist in data
  const availableCategories = useMemo(() => {
    const seen = new Set<string>();
    initialIngredients.forEach((item) => {
      const key = item.category_id ? CATEGORY_MAP[item.category_id] : undefined;
      if (key) seen.add(key);
    });
    return CATEGORY_ORDER.filter((c) => seen.has(c));
  }, [initialIngredients]);

  const search = useCallback(
    async (q: string) => {
      setQuery(q);
      setActiveCategory(null);
      if (!q.trim()) {
        setResults(initialIngredients);
        return;
      }
      setLoading(true);
      try {
        const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';
        const res = await fetch(`${BASE}/public/ingredients?q=${encodeURIComponent(q)}&limit=40`);
        if (!res.ok) throw new Error();
        type ListItem = {
          slug: string;
          name_en: string;
          name_ru?: string;
          name_pl?: string;
          name_uk?: string;
          image_url?: string | null;
          category_id?: string;
          calories_per_100g?: number | null;
        };
        type DetailItem = {
          slug: string;
          name_en: string;
          name_ru?: string;
          name_pl?: string;
          name_uk?: string;
          image_url?: string | null;
          nutrition?: { calories_per_100g: number; protein_per_100g: number; fat_per_100g: number; carbs_per_100g: number } | null;
        };
        const data: { items: ListItem[] } = await res.json();
        const filtered = data.items.filter((i) => i.calories_per_100g != null);

        const details = await Promise.all(
          filtered.map((i) =>
            fetch(`${BASE}/public/ingredients/${encodeURIComponent(i.slug)}`)
              .then((r) => r.ok ? r.json() as Promise<DetailItem> : null)
              .catch(() => null),
          ),
        );

        setResults(
          filtered.map((i, idx) => {
            const d = details[idx];
            return {
              slug: i.slug,
              name: i.name_en,
              name_en: i.name_en,
              name_ru: d?.name_ru ?? i.name_ru,
              name_pl: d?.name_pl ?? i.name_pl,
              name_uk: d?.name_uk ?? i.name_uk,
              image_url: d?.image_url ?? i.image_url,
              category_id: i.category_id,
              calories: d?.nutrition?.calories_per_100g ?? i.calories_per_100g!,
              protein: d?.nutrition?.protein_per_100g ?? null,
              fat: d?.nutrition?.fat_per_100g ?? null,
              carbs: d?.nutrition?.carbs_per_100g ?? null,
            };
          }),
        );
      } catch {
        // keep previous results
      } finally {
        setLoading(false);
      }
    },
    [initialIngredients],
  );

  // Filter by category (client-side, instant)
  const displayed = useMemo(() => {
    const base = results;
    if (!activeCategory) return base;
    return base.filter((item) => {
      const key = item.category_id ? CATEGORY_MAP[item.category_id] : undefined;
      return key === activeCategory;
    });
  }, [results, activeCategory]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder={i18n.searchPlaceholder}
          className="pl-10 h-11 text-sm font-medium border-border/60 focus-visible:border-primary/60"
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Category filters */}
      {!query.trim() && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors ${
              activeCategory === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {i18n.allCategories}
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {i18n.categories[cat] ?? cat}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      {displayed.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">{i18n.noResults}</p>
      ) : (
        <div className="border border-border/60 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="text-left px-4 py-3 font-black uppercase tracking-wide text-xs text-muted-foreground">
                  {i18n.name}
                </th>
                <th className="text-right px-4 py-3 font-black uppercase tracking-wide text-xs text-muted-foreground">
                  {i18n.calories}
                </th>
                <th className="text-right px-4 py-3 font-black uppercase tracking-wide text-xs text-muted-foreground hidden sm:table-cell">
                  {i18n.protein}
                </th>
                <th className="text-right px-4 py-3 font-black uppercase tracking-wide text-xs text-muted-foreground hidden sm:table-cell">
                  {i18n.fat}
                </th>
                <th className="text-right px-4 py-3 font-black uppercase tracking-wide text-xs text-muted-foreground hidden sm:table-cell">
                  {i18n.carbs}
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {displayed.map((item, idx) => (
                <tr
                  key={item.slug ?? item.name}
                  className={`group border-b border-border/40 last:border-0 hover:bg-primary/5 transition-colors ${
                    idx % 2 === 0 ? '' : 'bg-muted/20'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-muted">
                          <Image
                            src={item.image_url}
                            alt={localizedName(item, locale)}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 shrink-0" />
                      )}
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {localizedName(item, locale)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">
                    {item.calories}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                    {item.protein != null ? item.protein : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                    {item.fat != null ? item.fat : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                    {item.carbs != null ? item.carbs : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.slug && (
                      <Link
                        href={`/chef-tools/nutrition/${item.slug}` as never}
                        className="inline-flex items-center gap-1 text-primary text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ArrowRight className="h-3 w-3 stroke-[3px]" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-muted/20 border-t border-border/40 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {i18n.per100g}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {displayed.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
