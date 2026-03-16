'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2, Star, Utensils } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { API_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

type Pairing = {
  slug: string;
  name_en?: string;
  name_ru?: string;
  name_pl?: string;
  name_uk?: string;
  image_url?: string;
  pair_score?: number;
  flavor_score?: number;
  nutrition_score?: number;
  culinary_score?: number;
};

type Culinary = {
  sweetness?: number;
  acidity?: number;
  bitterness?: number;
  umami?: number;
  aroma?: number;
  texture?: string;
};

type BasicInfo = {
  name_en?: string;
  name_ru?: string;
  name_pl?: string;
  name_uk?: string;
  image_url?: string;
  product_type?: string;
};

type NutritionData = {
  slug: string;
  basic: BasicInfo;
  macros?: {
    calories_kcal?: number;
    protein_g?: number;
    fat_g?: number;
    carbs_g?: number;
  };
  culinary?: Culinary;
  pairings: Pairing[];
};

type SearchResult = {
  slug: string;
  name: string;
  image_url?: string;
};

// ── Popular ingredients for quick access ─────────────────────────────────────

const POPULAR_SLUGS = [
  { slug: 'tomato', key: 'tomato' },
  { slug: 'salmon', key: 'salmon' },
  { slug: 'chicken-breast', key: 'chicken' },
  { slug: 'basil', key: 'basil' },
  { slug: 'mozzarella-cheese', key: 'mozzarella' },
  { slug: 'lemon', key: 'lemon' },
  { slug: 'garlic', key: 'garlic' },
  { slug: 'avocado', key: 'avocado' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function localizedName(
  item: { name_en?: string; name_ru?: string; name_pl?: string; name_uk?: string; slug?: string },
  locale: string,
): string {
  const map: Record<string, string | undefined> = {
    en: item.name_en,
    ru: item.name_ru,
    pl: item.name_pl,
    uk: item.name_uk,
  };
  return map[locale] || item.name_en || item.slug || '';
}

// ── Component ────────────────────────────────────────────────────────────────

export function FlavorPairingClient() {
  const locale = useLocale();
  const t = useTranslations('chefTools.tools.flavorPairing');

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<NutritionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await fetch(
        `${API_URL}/public/tools/product-search?q=${encodeURIComponent(q)}&lang=${locale}&limit=8`,
      );
      if (res.ok) {
        const json = await res.json();
        setSearchResults((json.results || json.products || []).map((p: any) => ({
          slug: p.slug,
          name: p.name || p.name_en || p.slug,
          image_url: p.image_url,
        })));
      }
    } catch { /* ignore */ }
  }, [locale]);

  const loadPairings = async (slug: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    setSearchOpen(false);
    setSearchResults([]);

    try {
      const res = await fetch(`${API_URL}/public/nutrition/${slug}`);
      if (!res.ok) throw new Error(`Not found: ${slug}`);
      const json: NutritionData = await res.json();
      setData(json);
      setQuery(localizedName(json.basic, locale));
    } catch (err: any) {
      setError(err.message || t('failedLoad'));
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const scoreStars = (score?: number) => {
    const s = score || 0;
    if (s >= 9) return '★★★★★';
    if (s >= 7) return '★★★★';
    if (s >= 5) return '★★★';
    if (s >= 3) return '★★';
    return '★';
  };

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="relative max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
              search(e.target.value);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-3 text-sm bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {searchOpen && searchResults.length > 0 && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-background border border-border/60 rounded-xl shadow-lg max-h-56 overflow-y-auto">
            {searchResults.map(item => (
              <button
                key={item.slug}
                onClick={() => loadPairings(item.slug)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 flex items-center gap-3"
              >
                {item.image_url && (
                  <img src={item.image_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                )}
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular chips */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          {t('popularIngredients')}
        </p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SLUGS.map(p => (
            <button
              key={p.slug}
              onClick={() => loadPairings(p.slug)}
              className="px-3 py-1.5 text-sm font-semibold border border-border/60 rounded-lg hover:border-primary/40 hover:text-primary transition-colors"
            >
              {t(`popular.${p.key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-8">
          {/* Selected ingredient header */}
          <div className="flex items-center gap-4 p-4 border border-border/60 rounded-2xl bg-muted/20">
            {data.basic.image_url && (
              <img
                src={data.basic.image_url}
                alt={localizedName(data.basic, locale)}
                className="w-16 h-16 rounded-xl object-cover"
              />
            )}
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">
                {localizedName(data.basic, locale)}
              </h2>
              {data.basic.product_type && (
                <span className="text-xs text-muted-foreground font-medium">
                  {data.basic.product_type}
                </span>
              )}
              {data.macros && (
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{Math.round(data.macros.calories_kcal ?? 0)} kcal</span>
                  <span>P: {Number(data.macros.protein_g ?? 0).toFixed(1)}g</span>
                  <span>F: {Number(data.macros.fat_g ?? 0).toFixed(1)}g</span>
                  <span>C: {Number(data.macros.carbs_g ?? 0).toFixed(1)}g</span>
                </div>
              )}
            </div>
          </div>

          {/* Culinary profile */}
          {data.culinary && (
            <div className="border border-border/60 rounded-2xl p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
                {t('culinaryProfile')}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {([
                  { key: 'sweetness', value: data.culinary.sweetness },
                  { key: 'acidity', value: data.culinary.acidity },
                  { key: 'bitterness', value: data.culinary.bitterness },
                  { key: 'umami', value: data.culinary.umami },
                  { key: 'aroma', value: data.culinary.aroma },
                ] as const).map(d => (
                  <div key={d.key} className="text-center">
                    <div className="text-2xl font-black">{d.value ?? '—'}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {t(d.key)}
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${((d.value ?? 0) / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {data.culinary.texture && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {t('texture')}: <span className="font-bold text-foreground">{data.culinary.texture}</span>
                </p>
              )}
            </div>
          )}

          {/* Best Pairings */}
          {data.pairings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Utensils className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black uppercase tracking-tight italic">
                  {t('bestPairings')}
                </h3>
                <span className="text-xs text-muted-foreground ml-auto">
                  {data.pairings.length} {t('matches')}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.pairings.map((p, idx) => (
                  <button
                    key={p.slug}
                    onClick={() => loadPairings(p.slug)}
                    className={cn(
                      "group text-left border rounded-2xl p-4 transition-all duration-200 bg-background",
                      idx === 0
                        ? "border-primary/40 shadow-md shadow-primary/5"
                        : "border-border/60 hover:border-primary/30 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={localizedName(p, locale)}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-black uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                            {localizedName(p, locale)}
                          </h4>
                          {idx === 0 && (
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-black ${scoreColor(p.pair_score ?? undefined)}`}>
                            {p.pair_score?.toFixed(1) ?? '—'}
                          </span>
                          <span className="text-[10px] text-amber-500">
                            {scoreStars(p.pair_score ?? undefined)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score breakdown */}
                    <div className="flex gap-3 mt-3 text-[10px] text-muted-foreground">
                      <span>{t('flavor')}: {p.flavor_score?.toFixed(1) ?? '—'}</span>
                      <span>{t('nutritionScore')}: {p.nutrition_score?.toFixed(1) ?? '—'}</span>
                      <span>{t('culinary')}: {p.culinary_score?.toFixed(1) ?? '—'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {data.pairings.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Utensils className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{t('noPairings')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
