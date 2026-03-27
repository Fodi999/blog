'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  Search,
  Table2,
  FlaskConical,
  Fish,
  Beef,
  Milk,
  Wheat,
  Apple,
  Salad,
  Nut,
  Sprout,
  Grape,
  ChevronDown,
  Timer,
  Globe,
  Waves,
  Mountain,
  Trophy,
  Swords,
  ExternalLink,
  Droplets,
} from 'lucide-react';
import { type AnalyzerIngredient, type FishSeasonStatus } from '@/lib/api';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

/* ═══════════════════════════ Types ═══════════════════════════ */

export type SeasonMap = Record<string, FishSeasonStatus>;

export interface I18n {
  searchPlaceholder: string;
  searchLabel: string;
  noResults: string;
  portionLabel: string;
  per100g: string;
  forAmount: string;
  macros: string;
  vitamins: string;
  nutritionScore: string;
  compareWith: string;
  compareSelect: string;
  compareTitle: string;
  winner: string;
  tie: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
  fiber: string;
  sugar: string;
  b12: string;
  vitD: string;
  iron: string;
  magnesium: string;
  kcal: string;
  sushiGrade: string;
  wild: string;
  farmed: string;
  typicalPortion: string;
  inSeasonNow: string;
  peakSeason: string;
  unitG: string;
  unitOz: string;
  unitPortion: string;
  unitCup: string;
  noVitamins: string;
  tabTable: string;
  tabAnalyzer: string;
  tableSearchPlaceholder: string;
  tableName: string;
  allCategories: string;
  categories: Record<string, string>;
}

interface NutritionResponse {
  query: string;
  slug: string | null;
  name: string;
  product_type: string | null;
  image_url: string | null;
  water_type: string | null;
  wild_farmed: string | null;
  sushi_grade: boolean | null;
  amount_g: number;
  unit: string;
  unit_label: string;
  per_100g: {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    fiber_g: number;
    sugar_g: number;
    salt_g: number;
    sodium_mg: number;
  };
  for_amount: {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    fiber_g: number;
    sugar_g: number;
    salt_g: number;
    sodium_mg: number;
  };
  macros_ratio: {
    protein_pct: number;
    fat_pct: number;
    carbs_pct: number;
  };
  nutrition_score: number;
  vitamins: {
    vitamin_b12_mcg: number | null;
    vitamin_d_mcg: number | null;
    iron_mg: number | null;
    magnesium_mg: number | null;
  };
  typical_portion_g: number | null;
  found_in_db: boolean;
  lang: string;
}

interface CompareSide {
  query: string;
  slug: string | null;
  name: string;
  product_type: string | null;
  image_url: string | null;
  water_type: string | null;
  wild_farmed: string | null;
  sushi_grade: boolean | null;
  per_100g: {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    fiber_g: number;
    sugar_g: number;
    salt_g: number;
    sodium_mg: number;
  };
  macros_ratio: {
    protein_pct: number;
    fat_pct: number;
    carbs_pct: number;
  };
  nutrition_score: number;
  vitamins: {
    vitamin_b12_mcg: number | null;
    vitamin_d_mcg: number | null;
    iron_mg: number | null;
    magnesium_mg: number | null;
  };
  found_in_db: boolean;
}

interface CompareWinner {
  calories_lower: 'food1' | 'food2' | 'tie';
  protein_higher: 'food1' | 'food2' | 'tie';
  fat_lower: 'food1' | 'food2' | 'tie';
  carbs_lower: 'food1' | 'food2' | 'tie';
  fiber_higher: 'food1' | 'food2' | 'tie';
  nutrition_score: 'food1' | 'food2' | 'tie';
}

interface CompareResponse {
  food1: CompareSide;
  food2: CompareSide;
  winner: CompareWinner;
  lang: string;
}

interface SeasonMonth {
  month: number;
  month_name: string;
  status: 'peak' | 'good' | 'limited' | 'off';
  available: boolean;
  note: string | null;
}

interface SeasonalityResponse {
  slug: string;
  name: string;
  product_type: string | null;
  image_url: string | null;
  region: string;
  lang: string;
  season: SeasonMonth[];
}

/* ═══════════════════════════ Constants ═══════════════════════════ */

// All client-side fetches go through Next.js API proxy to avoid CORS
const PROXY = '/api/analyzer';

const SEASON_BG: Record<string, string> = {
  peak: 'bg-green-500',
  good: 'bg-lime-400',
  limited: 'bg-amber-400',
  off: 'bg-muted border border-border/50',
};

const ProductIcon = ({ type, className }: { type: string | null; className?: string }) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('fish') || t.includes('seafood')) return <Fish className={className} />;
  if (t.includes('meat') || t.includes('beef') || t.includes('pork') || t.includes('chicken')) return <Beef className={className} />;
  if (t.includes('dairy') || t.includes('milk') || t.includes('cheese')) return <Milk className={className} />;
  if (t.includes('grain') || t.includes('bread') || t.includes('wheat') || t.includes('cereal')) return <Wheat className={className} />;
  if (t.includes('fruit') || t.includes('apple') || t.includes('berry')) return <Apple className={className} />;
  if (t.includes('veg') || t.includes('sal')) return <Salad className={className} />;
  if (t.includes('nut') || t.includes('seed')) return <Nut className={className} />;
  if (t.includes('legume') || t.includes('bean') || t.includes('pea')) return <Sprout className={className} />;
  if (t.includes('spice') || t.includes('herb')) return <Sprout className={className} />;
  return <FlaskConical className={className} />;
};

const CATEGORY_MAP: Record<string, string> = {
  seafood: 'fish',
  fish: 'fish',
  vegetable: 'vegetables',
  vegetables: 'vegetables',
  fruit: 'fruits',
  fruits: 'fruits',
  meat: 'meat',
  dairy: 'dairy',
  grain: 'grains',
  grains: 'grains',
  legume: 'legumes',
  legumes: 'legumes',
  nut: 'nuts',
  nuts: 'nuts',
  spice: 'spices',
  spices: 'spices',
  sauce: 'sauces',
  sauces: 'sauces',
  sweet: 'sweets',
  sweets: 'sweets',
  drink: 'drinks',
  drinks: 'drinks',
  preserved: 'preserved',
  oil: 'oils',
  oils: 'oils',
  other: 'other',
};

const CATEGORY_ORDER = [
  'vegetables',
  'fruits',
  'meat',
  'fish',
  'dairy',
  'grains',
  'legumes',
  'nuts',
  'oils',
  'sauces',
  'spices',
  'sweets',
  'drinks',
  'preserved',
  'other',
];

/* ═══════════════════════════ API Helpers ═══════════════════════════ */

const IngredientAPI = {
  search: async (
    query: string,
    lang = 'en',
    limit = 10,
  ): Promise<{ total: number; items: AnalyzerIngredient[] }> => {
    const r = await fetch(
      `${PROXY}/search?search=${encodeURIComponent(query)}&lang=${lang}&limit=${limit}`,
    );
    return r.json();
  },

  nutrition: async (
    name: string,
    amount = 100,
    unit = 'g',
    lang = 'en',
  ): Promise<NutritionResponse> => {
    const r = await fetch(
      `${PROXY}/nutrition?name=${encodeURIComponent(name)}&amount=${amount}&unit=${unit}&lang=${lang}`,
    );
    return r.json();
  },

  compare: async (
    food1: string,
    food2: string,
    lang = 'en',
  ): Promise<CompareResponse> => {
    const r = await fetch(
      `${PROXY}/compare?food1=${encodeURIComponent(food1)}&food2=${encodeURIComponent(food2)}&lang=${lang}`,
    );
    return r.json();
  },

  seasonality: async (
    slug: string,
    lang = 'en',
    region = 'PL',
  ): Promise<SeasonalityResponse> => {
    const r = await fetch(
      `${PROXY}/seasonality?slug=${slug}&lang=${lang}&region=${region}`,
    );
    return r.json();
  },
};

/* ═══════════════════════════ Helpers ═══════════════════════════ */

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

function scoreColor(s: number) {
  if (s >= 70) return 'text-green-600 dark:text-green-400';
  if (s >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500';
}

function scoreBadgeVariant(
  s: number,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s >= 70) return 'default';
  if (s >= 40) return 'secondary';
  return 'destructive';
}

function scoreBadgeClass(s: number): string {
  if (s >= 70) return 'ds-score-high';
  if (s >= 40) return 'ds-score-mid';
  return 'ds-score-low';
}

/* ═══════════════════════════ Sub-components ═══════════════════════════ */

function MacroBar({
  label,
  pct,
  color,
  value,
  icon,
}: {
  label: string;
  pct: number;
  color: string;
  value: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon ? (
            <span className="text-muted-foreground">{icon}</span>
          ) : (
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
          )}
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
        </div>
        <span className="text-[11px] font-black text-foreground">
          {value}g{' '}
          <span className="text-muted-foreground/60 font-medium">
            ({Math.round(pct)}%)
          </span>
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

function NutritionRow({
  label,
  val,
  unit,
}: {
  label: string;
  val: number;
  unit: string;
}) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground">
        {val} {unit}
      </span>
    </div>
  );
}

function VitaminRow({
  label,
  val,
  unit,
}: {
  label: string;
  val: number | null;
  unit: string;
}) {
  if (val === null || val === 0) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground">
        {val} {unit}
      </span>
    </div>
  );
}

function CompareRow({
  label,
  v1,
  v2,
  unit,
  winner,
  food1Name,
  food2Name,
}: {
  label: string;
  v1: number;
  v2: number;
  unit: string;
  winner: string;
  food1Name: string;
  food2Name: string;
}) {
  const max = Math.max(v1, v2, 0.01);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
        <span className="font-bold uppercase tracking-wider">{label}</span>
        {winner !== 'tie' && (
          <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
            <Trophy className="h-3 w-3" /> {winner === 'food1' ? food1Name : food2Name}
          </span>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-xs w-14 text-right font-bold text-primary">
          {v1}
          {unit}
        </span>
        <div className="flex-1 flex gap-0.5 h-4 rounded overflow-hidden">
          <div className="flex-1 flex justify-end bg-muted/30">
            <div
              className="h-full bg-primary/70 rounded-l transition-all duration-500"
              style={{ width: `${(v1 / max) * 100}%` }}
            />
          </div>
          <div className="flex-1 bg-muted/30">
            <div
              className="h-full bg-amber-400/70 rounded-r transition-all duration-500"
              style={{ width: `${(v2 / max) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-xs w-14 font-bold text-amber-600 dark:text-amber-400">
          {v2}
          {unit}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════ Nutrition Table ═══════════════════════════ */

function NutritionTableView({
  items,
  i18n,
  locale,
  onSelectIngredient,
}: {
  items: AnalyzerIngredient[];
  i18n: I18n;
  locale: string;
  onSelectIngredient: (item: AnalyzerIngredient) => void;
}) {
  const [tableQuery, setTableQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const availableCategories = useMemo(() => {
    const seen = new Set<string>();
    items.forEach((item) => {
      const key = item.product_type
        ? CATEGORY_MAP[item.product_type.toLowerCase()]
        : undefined;
      if (key) seen.add(key);
    });
    return CATEGORY_ORDER.filter((c) => seen.has(c));
  }, [items]);

  const displayed = useMemo(() => {
    let base = items;
    if (tableQuery.trim()) {
      const q = tableQuery.toLowerCase().trim();
      const nq = normalize(q);
      base = base.filter((item) => {
        const name = item.name.toLowerCase();
        const slug = item.slug.toLowerCase();
        const nn = normalize(name);
        return name.includes(q) || slug.includes(q) || nn.includes(nq);
      });
    }
    if (activeCategory) {
      base = base.filter((item) => {
        const key = item.product_type
          ? CATEGORY_MAP[item.product_type.toLowerCase()]
          : undefined;
        return key === activeCategory;
      });
    }
    return base;
  }, [items, tableQuery, activeCategory]);

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={tableQuery}
          onChange={(e) => {
            setTableQuery(e.target.value);
            setActiveCategory(null);
          }}
          placeholder={i18n.tableSearchPlaceholder}
          className="pl-9 h-10"
        />
      </div>

      {/* Category badges */}
      {!tableQuery.trim() && (
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={activeCategory === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setActiveCategory(null)}
          >
            {i18n.allCategories}
          </Badge>
          {availableCategories.map((cat) => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
            >
              {i18n.categories[cat] ?? cat}
            </Badge>
          ))}
        </div>
      )}

      {/* shadcn Table */}
      {displayed.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">
          {i18n.noResults}
        </p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-black uppercase tracking-wide text-xs">
                  {i18n.tableName}
                </TableHead>
                <TableHead className="text-right font-black uppercase tracking-wide text-xs">
                  {i18n.kcal}
                </TableHead>
                <TableHead className="text-right font-black uppercase tracking-wide text-xs hidden sm:table-cell">
                  {i18n.protein}
                </TableHead>
                <TableHead className="text-right font-black uppercase tracking-wide text-xs hidden sm:table-cell">
                  {i18n.fat}
                </TableHead>
                <TableHead className="text-right font-black uppercase tracking-wide text-xs hidden sm:table-cell">
                  {i18n.carbs}
                </TableHead>
                <TableHead className="text-right font-black uppercase tracking-wide text-xs hidden md:table-cell">
                  Score
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((item) => (
                <TableRow
                  key={item.slug ?? item.name}
                  onClick={() => onSelectIngredient(item)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-muted">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                          <ProductIcon type={item.product_type} className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {item.per_100g.calories}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                    {item.per_100g.protein_g}g
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                    {item.per_100g.fat_g}g
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                    {item.per_100g.carbs_g}g
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${scoreBadgeClass(item.nutrition_score ?? 0)}`}
                    >
                      {item.nutrition_score ?? '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right w-10">
                    <Link
                      href={`/${locale}/chef-tools/nutrition/${item.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title="Open detail page"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-2 border-t flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {i18n.per100g}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {displayed.length} / {items.length}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════ Main Component ═══════════════════════════ */

export function IngredientAnalyzerClient({
  allIngredients,
  i18n,
  locale,
  seasonMap,
}: {
  allIngredients: AnalyzerIngredient[];
  i18n: I18n;
  locale: string;
  seasonMap: SeasonMap;
}) {
  const lang =
    locale === 'pl'
      ? 'pl'
      : locale === 'ru'
        ? 'ru'
        : locale === 'uk'
          ? 'uk'
          : 'en';

  /* ── State ── */
  const [activeTab, setActiveTab] = useState('table');

  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<AnalyzerIngredient[]>([]);
  const [showSugg, setShowSugg] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const [allIngredientsList, setAllIngredientsList] = useState<
    AnalyzerIngredient[]
  >([]);

  const [selected, setSelected] = useState('salmon');
  const [amount, setAmount] = useState(100);
  const [unit, setUnit] = useState('g');
  const [region, setRegion] = useState('PL');

  const [nutrition, setNutrition] = useState<NutritionResponse | null>(null);
  const [loadingNutr, setLoadingNutr] = useState(false);
  const [compare, setCompare] = useState<CompareResponse | null>(null);
  const [loadingCmp, setLoadingCmp] = useState(false);
  const [seasonality, setSeasonality] = useState<SeasonalityResponse | null>(
    null,
  );
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [compareWith, setCompareWith] = useState('tuna');
  const [cmpSearch, setCmpSearch] = useState('');
  const [showCmpDropdown, setShowCmpDropdown] = useState(false);
  const cmpWrapRef = useRef<HTMLDivElement>(null);

  const amountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  /* ── Effects ── */

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target as Node)
      ) {
        setShowSugg(false);
      }
      if (
        cmpWrapRef.current &&
        !cmpWrapRef.current.contains(e.target as Node)
      ) {
        setShowCmpDropdown(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    IngredientAPI.search('', lang, 200)
      .then((d) => setAllIngredientsList(d.items))
      .catch(() => {});
  }, [lang]);

  useEffect(() => {
    if (search.length < 1) {
      setSuggestions([]);
      setShowSugg(false);
      return;
    }
    const query = search.toLowerCase().trim();
    const nq = normalize(query);

    const filtered = allIngredientsList
      .filter((item) => {
        const name = item.name.toLowerCase();
        const slug = item.slug.toLowerCase();
        const nn = normalize(name);
        return name.includes(query) || slug.includes(query) || nn.includes(nq);
      })
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(query);
        const bStarts = b.name.toLowerCase().startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0;
      })
      .slice(0, 10);

    setSuggestions(filtered);
    setShowSugg(filtered.length > 0);
    setActiveIdx(-1);
  }, [search, allIngredientsList]);

  const fetchNutrition = useCallback(
    (slug: string, amt: number, u: string) => {
      setLoadingNutr(true);
      IngredientAPI.nutrition(slug, amt, u, lang)
        .then((d) => {
          setNutrition(d);
          setLoadingNutr(false);
        })
        .catch(() => setLoadingNutr(false));
    },
    [lang],
  );

  useEffect(() => {
    if (!selected) return;
    fetchNutrition(selected, amount, unit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, lang, fetchNutrition]);

  useEffect(() => {
    if (!selected) return;
    setLoadingSeason(true);
    IngredientAPI.seasonality(selected, lang, region)
      .then((d) => {
        setSeasonality(d);
        setLoadingSeason(false);
      })
      .catch(() => setLoadingSeason(false));
  }, [selected, lang, region]);

  useEffect(() => {
    if (!selected || !compareWith || selected === compareWith) return;
    setLoadingCmp(true);
    IngredientAPI.compare(selected, compareWith, lang)
      .then((d) => {
        setCompare(d);
        setLoadingCmp(false);
      })
      .catch(() => setLoadingCmp(false));
  }, [selected, compareWith, lang]);

  /* ── Handlers ── */

  function pickSuggestion(item: AnalyzerIngredient) {
    const slug = item.slug || item.name.toLowerCase();
    setSelected(slug);
    setSearch(item.name);
    setShowSugg(false);
    setActiveIdx(-1);
    setAmount(item.typical_portion_g ?? 100);
    setUnit('g');
  }

  function handleTableSelect(item: AnalyzerIngredient) {
    pickSuggestion(item);
    setActiveTab('analyzer');
  }

  function handleAmountChange(val: number) {
    setAmount(val);
    if (amountTimer.current) clearTimeout(amountTimer.current);
    amountTimer.current = setTimeout(
      () => fetchNutrition(selected, val, unit),
      400,
    );
  }

  function handleUnitChange(u: string) {
    setUnit(u);
    fetchNutrition(selected, amount, u);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSugg || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setShowSugg(false);
    }
  }

  /* ── Computed ── */

  const n = nutrition;
  const currentMonthIdx = new Date().getMonth();
  const currentSeason = seasonality?.season.find(
    (m) => m.month === currentMonthIdx + 1,
  );

  /* ═══════════════════════════ Render ═══════════════════════════ */

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 items-center">
          <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
            Region:
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="border border-input rounded-md px-3 py-1.5 text-xs font-bold bg-transparent focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            <option value="PL">🇵🇱 Poland</option>
            <option value="EU">🇪🇺 Europe</option>
            <option value="ES">🇪🇸 Spain</option>
            <option value="UA">🇺🇦 Ukraine</option>
            <option value="GLOBAL">🌍 Global</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
            Live API • {allIngredientsList.length || 111} Ingredients
          </span>
        </div>
      </div>

      {/* ── shadcn Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger
            value="table"
            className="gap-2 font-black uppercase tracking-widest text-xs"
          >
            <Table2 className="h-4 w-4" />
            {i18n.tabTable}
          </TabsTrigger>
          <TabsTrigger
            value="analyzer"
            className="gap-2 font-black uppercase tracking-widest text-xs"
          >
            <FlaskConical className="h-4 w-4" />
            {i18n.tabAnalyzer}
          </TabsTrigger>
        </TabsList>

        {/* ════════ TABLE TAB ════════ */}
        <TabsContent value="table">
          <NutritionTableView
            items={
              allIngredientsList.length > 0
                ? allIngredientsList
                : allIngredients
            }
            i18n={i18n}
            locale={locale}
            onSelectIngredient={handleTableSelect}
          />
        </TabsContent>

        {/* ════════ ANALYZER TAB ════════ */}
        <TabsContent value="analyzer" className="space-y-6">
          {/* Search bar */}
          <div ref={searchWrapRef} className="relative max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9 pr-9 h-12 text-base"
                placeholder={i18n.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSugg(true);
                }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck={false}
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSuggestions([]);
                    setShowSugg(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Suggestions dropdown */}
            {showSugg && suggestions.length > 0 && (
              <Card className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden shadow-xl">
                {suggestions.map((item, idx) => (
                  <button
                    key={item.slug}
                    onMouseDown={() => pickSuggestion(item)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      idx === activeIdx ? 'bg-accent' : 'hover:bg-muted/60'
                    }`}
                  >
                    {item.image_url ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-muted">
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                        <ProductIcon type={item.product_type} className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.product_type} · {item.per_100g.calories}{' '}
                        {i18n.kcal}/100g · {i18n.nutritionScore}{' '}
                        {item.nutrition_score}
                      </p>
                    </div>
                  </button>
                ))}
              </Card>
            )}
          </div>

          {/* Nutrition detail */}
          {(n || loadingNutr) && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* ── Left column: product info + portion + values ── */}
              <Card>
                <CardContent className="p-5 space-y-5">
                  {/* Product header */}
                  {loadingNutr && !n ? (
                    <div className="flex gap-4">
                      <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <Skeleton className="h-7 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ) : (
                    n && (
                      <div className="flex gap-4 items-start rounded-xl bg-gradient-to-b from-background to-muted/30 p-3 -mx-3">
                        {n.image_url ? (
                          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border">
                            <Image
                              src={n.image_url}
                              alt={n.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-muted shrink-0 flex items-center justify-center border">
                            <ProductIcon type={n.product_type} className="h-10 w-10 text-muted-foreground/60" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-2xl font-black uppercase tracking-tight leading-tight">
                            {n.name}
                          </h2>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {n.product_type && (
                              <Badge variant="outline">{n.product_type}</Badge>
                            )}
                            {n.water_type && (
                              <Badge variant="secondary" className="gap-1 px-2">
                                {n.water_type === 'sea' ? (
                                  <Waves className="h-3 w-3 opacity-70" />
                                ) : (
                                  <Mountain className="h-3 w-3 opacity-70" />
                                )}
                                {n.water_type === 'sea'
                                  ? 'sea'
                                  : 'freshwater'}
                              </Badge>
                            )}
                            {n.wild_farmed && n.wild_farmed !== 'both' && (
                              <Badge variant="secondary" className="gap-1 px-2">
                                <Globe className="h-3 w-3 opacity-70" />
                                {n.wild_farmed === 'wild'
                                  ? i18n.wild
                                  : i18n.farmed}
                              </Badge>
                            )}
                            {n.sushi_grade && (
                              <Badge>{i18n.sushiGrade}</Badge>
                            )}
                          </div>
                          {currentSeason && currentSeason.status !== 'off' && (
                            <Badge variant="secondary" className="mt-2 gap-1.5 px-2">
                              {currentSeason.status === 'peak' ? (
                                <Timer className="h-3 w-3 text-green-500" />
                              ) : (
                                <Timer className="h-3 w-3 text-amber-500" />
                              )}
                              {currentSeason.status === 'peak'
                                ? i18n.peakSeason
                                : i18n.inSeasonNow}
                            </Badge>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-lg px-3 py-1.5 font-black ${scoreBadgeClass(n.nutrition_score)}`}
                        >
                          {n.nutrition_score}
                        </Badge>
                      </div>
                    )
                  )}

                  {/* Portion selector */}
                  <Card className="bg-muted/30 shadow-none">
                    <CardContent className="p-4">
                      <p className="text-[10px] text-muted-foreground font-black mb-2 uppercase tracking-widest">
                        {i18n.portionLabel}
                      </p>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Input
                          type="number"
                          min={1}
                          max={2000}
                          value={amount}
                          onChange={(e) =>
                            handleAmountChange(
                              Math.max(1, Number(e.target.value)),
                            )
                          }
                          className="w-24 text-lg font-black text-center h-10"
                        />
                        <select
                          value={unit}
                          onChange={(e) => handleUnitChange(e.target.value)}
                          className="border border-input rounded-md px-2 py-1.5 text-sm font-bold bg-transparent focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                        >
                          <option value="g">{i18n.unitG}</option>
                          <option value="oz">{i18n.unitOz}</option>
                          <option value="cup">{i18n.unitCup}</option>
                          <option value="portion">{i18n.unitPortion}</option>
                        </select>
                        {n?.typical_portion_g && (
                          <button
                            onClick={() => {
                              setAmount(n.typical_portion_g!);
                              handleAmountChange(n.typical_portion_g!);
                            }}
                            className="text-[10px] font-bold text-primary underline hover:no-underline"
                          >
                            {i18n.typicalPortion} ({n.typical_portion_g}g)
                          </button>
                        )}
                      </div>
                      {n && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                          {n.amount_g}g total
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Nutrition values */}
                  <div>
                    <p className="text-[10px] text-muted-foreground font-black mb-2 uppercase tracking-widest">
                      {i18n.forAmount} {n?.amount_g ?? amount}g
                    </p>
                    {loadingNutr ? (
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-32" />
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                          <Skeleton key={i} className="h-7 w-full" />
                        ))}
                      </div>
                    ) : (
                      n && (
                        <>
                          <div className="text-3xl font-black text-primary mb-3">
                            {n.for_amount.calories}{' '}
                            <span className="text-base font-bold text-muted-foreground">
                              {i18n.kcal}
                            </span>
                          </div>
                          <NutritionRow
                            label={i18n.protein}
                            val={n.for_amount.protein_g}
                            unit="g"
                          />
                          <NutritionRow
                            label={i18n.fat}
                            val={n.for_amount.fat_g}
                            unit="g"
                          />
                          <NutritionRow
                            label={i18n.carbs}
                            val={n.for_amount.carbs_g}
                            unit="g"
                          />
                          <NutritionRow
                            label={i18n.fiber}
                            val={n.for_amount.fiber_g}
                            unit="g"
                          />
                          <NutritionRow
                            label={i18n.sugar}
                            val={n.for_amount.sugar_g}
                            unit="g"
                          />
                          <NutritionRow
                            label="Salt"
                            val={n.for_amount.salt_g}
                            unit="g"
                          />
                          <NutritionRow
                            label="Sodium"
                            val={n.for_amount.sodium_mg}
                            unit="mg"
                          />
                        </>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ── Right column: macros, vitamins, seasonality ── */}
              <div className="space-y-4">
                {/* Macros */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                      {i18n.macros}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingNutr ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-8 w-full" />
                        ))}
                      </div>
                    ) : (
                      n && (
                        <>
                          <div className="space-y-3">
                            <MacroBar
                              label={i18n.protein}
                              pct={n.macros_ratio.protein_pct}
                              color="ds-bar-protein"
                              value={n.for_amount.protein_g}
                              icon={<Beef className="h-3.5 w-3.5" />}
                            />
                            <MacroBar
                              label={i18n.fat}
                              pct={n.macros_ratio.fat_pct}
                              color="ds-bar-fat"
                              value={n.for_amount.fat_g}
                              icon={<Droplets className="h-3.5 w-3.5" />}
                            />
                            <MacroBar
                              label={i18n.carbs}
                              pct={n.macros_ratio.carbs_pct}
                              color="ds-bar-carbs"
                              value={n.for_amount.carbs_g}
                              icon={<Wheat className="h-3.5 w-3.5" />}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground/60 mt-3">
                            {i18n.per100g}: {n.per_100g.protein_g}g P ·{' '}
                            {n.per_100g.fat_g}g F · {n.per_100g.carbs_g}g C
                          </p>
                        </>
                      )
                    )}
                  </CardContent>
                </Card>

                {/* Vitamins */}
                {loadingNutr ? (
                  <Card>
                    <CardContent className="p-5">
                      <Skeleton className="h-4 w-32 mb-3" />
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-7 w-full mb-1" />
                      ))}
                    </CardContent>
                  </Card>
                ) : (
                  n &&
                  (n.vitamins.vitamin_b12_mcg !== null ||
                    n.vitamins.vitamin_d_mcg !== null ||
                    n.vitamins.iron_mg !== null ||
                    n.vitamins.magnesium_mg !== null) && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                          {i18n.vitamins}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-[9px] text-muted-foreground/50 mb-2">
                          Values per 100g
                        </p>
                        <VitaminRow
                          label={i18n.b12}
                          val={n.vitamins.vitamin_b12_mcg}
                          unit="µg"
                        />
                        <VitaminRow
                          label={i18n.vitD}
                          val={n.vitamins.vitamin_d_mcg}
                          unit="µg"
                        />
                        <VitaminRow
                          label={i18n.iron}
                          val={n.vitamins.iron_mg}
                          unit="mg"
                        />
                        <VitaminRow
                          label={i18n.magnesium}
                          val={n.vitamins.magnesium_mg}
                          unit="mg"
                        />
                      </CardContent>
                    </Card>
                  )
                )}

                {/* Seasonality calendar */}
                {loadingSeason ? (
                  <Card>
                    <CardContent className="p-5">
                      <Skeleton className="h-4 w-40 mb-3" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ) : (
                  seasonality &&
                  seasonality.season.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs text-foreground font-semibold uppercase tracking-widest">
                            Seasonal Calendar ({seasonality.region})
                          </CardTitle>
                          {currentSeason && (
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${
                                currentSeason.status === 'peak' ? 'bg-green-500 animate-pulse' :
                                currentSeason.status === 'good' ? 'bg-lime-500' :
                                currentSeason.status === 'limited' ? 'bg-amber-400' :
                                'bg-muted-foreground/30'
                              }`} />
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                currentSeason.status === 'peak' ? 'text-green-600 dark:text-green-400' :
                                currentSeason.status === 'good' ? 'text-lime-600 dark:text-lime-400' :
                                currentSeason.status === 'limited' ? 'text-amber-500' :
                                'text-muted-foreground/50'
                              }`}>
                                {currentSeason.status === 'off' ? 'Off season' : 'In season'}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-12 gap-0.5">
                          {seasonality.season.map((m) => (
                            <div key={m.month} className="text-center">
                              <div
                                className={`h-7 rounded-sm transition-all ${SEASON_BG[m.status]} ${
                                  m.month === currentMonthIdx + 1
                                    ? 'ring-2 ring-primary ring-offset-1'
                                    : ''
                                }`}
                                title={`${m.month_name}: ${m.status}`}
                              />
                              <div className="text-[8px] text-foreground/60 mt-0.5 font-bold">
                                {m.month_name.slice(0, 1)}
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Legend */}
                        <div className="flex flex-wrap gap-3 mt-3 pt-2 border-t border-border/50">
                          {(['peak','good','limited','off'] as const).map((s) => (
                            <div key={s} className="flex items-center gap-1">
                              <div className={`w-2.5 h-2.5 rounded-sm ${SEASON_BG[s]}`} />
                              <span className="text-[9px] text-muted-foreground font-medium capitalize">{s}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </div>
          )}

          {/* Compare section */}
          {n && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                  {i18n.compareWith}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 items-center mb-5 flex-wrap">
                  <Badge className="text-sm">{n.name}</Badge>
                  <div className="bg-muted w-8 h-8 rounded-full flex items-center justify-center">
                    <Swords className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Searchable compare dropdown */}
                  <div ref={cmpWrapRef} className="relative flex-1 min-w-[180px] max-w-[260px]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCmpDropdown((v) => !v);
                        setCmpSearch('');
                      }}
                      className="w-full flex items-center justify-between gap-2 border border-input rounded-md px-3 py-1.5 text-sm font-bold bg-transparent hover:bg-muted/40 focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                    >
                      <span className="truncate">
                        {(allIngredientsList.length > 0 ? allIngredientsList : allIngredients)
                          .find((i) => i.slug === compareWith)?.name ?? compareWith}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${showCmpDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showCmpDropdown && (
                      <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-xl overflow-hidden">
                        {/* Search inside dropdown */}
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                              autoFocus
                              value={cmpSearch}
                              onChange={(e) => setCmpSearch(e.target.value)}
                              placeholder={i18n.searchPlaceholder}
                              className="pl-7 h-8 text-sm"
                            />
                          </div>
                        </div>
                        {/* Options list */}
                        <div className="max-h-52 overflow-y-auto">
                          {(allIngredientsList.length > 0 ? allIngredientsList : allIngredients)
                            .filter((i) => {
                              if (i.slug === selected) return false;
                              if (!cmpSearch.trim()) return true;
                              const q = cmpSearch.toLowerCase();
                              const nq = normalize(q);
                              return (
                                i.name.toLowerCase().includes(q) ||
                                i.slug.toLowerCase().includes(q) ||
                                normalize(i.name.toLowerCase()).includes(nq)
                              );
                            })
                            .map((i) => (
                              <button
                                key={i.slug}
                                type="button"
                                onMouseDown={() => {
                                  setCompareWith(i.slug);
                                  setShowCmpDropdown(false);
                                  setCmpSearch('');
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                                  i.slug === compareWith ? 'bg-accent font-bold' : 'hover:bg-muted/60'
                                }`}
                              >
                                {i.image_url ? (
                                  <div className="w-6 h-6 rounded overflow-hidden shrink-0 bg-muted">
                                    <Image src={i.image_url} alt={i.name} width={24} height={24} className="w-full h-full object-cover" unoptimized />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded bg-muted shrink-0 flex items-center justify-center">
                                    <ProductIcon type={i.product_type} className="h-3.5 w-3.5 text-muted-foreground" />
                                  </div>
                                )}
                                <span className="truncate">{i.name}</span>
                                <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                                  {i.per_100g.calories} kcal
                                </span>
                              </button>
                            ))}
                        </div>
                      </Card>
                    )}
                  </div>
                </div>

                {loadingCmp ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  compare && (
                    <>
                      <div className="flex gap-2 flex-wrap mb-4">
                        {(
                          Object.entries(compare.winner) as [string, string][]
                        ).map(([key, val]) => {
                          if (val === 'tie') return null;
                          const winnerName =
                            val === 'food1'
                              ? compare.food1.name
                              : compare.food2.name;
                          return (
                            <Badge
                              key={key}
                              variant="secondary"
                              className="text-[10px] gap-1"
                            >
                              <Trophy className="h-3 w-3 text-green-600 dark:text-green-400" />
                              <span className="font-bold">{winnerName}</span> — {key.replace('_', ' ')}
                            </Badge>
                          );
                        })}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                          <span className="text-xs font-black text-primary truncate">
                            {compare.food1.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400 truncate">
                            {compare.food2.name}
                          </span>
                        </div>
                      </div>
                      <CompareRow
                        label={i18n.calories}
                        v1={compare.food1.per_100g.calories}
                        v2={compare.food2.per_100g.calories}
                        unit={` ${i18n.kcal}`}
                        winner={compare.winner.calories_lower}
                        food1Name={compare.food1.name}
                        food2Name={compare.food2.name}
                      />
                      <CompareRow
                        label={i18n.protein}
                        v1={compare.food1.per_100g.protein_g}
                        v2={compare.food2.per_100g.protein_g}
                        unit="g"
                        winner={compare.winner.protein_higher}
                        food1Name={compare.food1.name}
                        food2Name={compare.food2.name}
                      />
                      <CompareRow
                        label={i18n.fat}
                        v1={compare.food1.per_100g.fat_g}
                        v2={compare.food2.per_100g.fat_g}
                        unit="g"
                        winner={compare.winner.fat_lower}
                        food1Name={compare.food1.name}
                        food2Name={compare.food2.name}
                      />
                      <CompareRow
                        label={i18n.carbs}
                        v1={compare.food1.per_100g.carbs_g}
                        v2={compare.food2.per_100g.carbs_g}
                        unit="g"
                        winner={compare.winner.carbs_lower}
                        food1Name={compare.food1.name}
                        food2Name={compare.food2.name}
                      />
                      <CompareRow
                        label="Score"
                        v1={compare.food1.nutrition_score}
                        v2={compare.food2.nutrition_score}
                        unit=""
                        winner={compare.winner.nutrition_score}
                        food1Name={compare.food1.name}
                        food2Name={compare.food2.name}
                      />
                    </>
                  )
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
