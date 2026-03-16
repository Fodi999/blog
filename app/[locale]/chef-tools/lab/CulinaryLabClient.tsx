"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  ChefHat,
  Loader2,
  Sparkles,
  AlertTriangle,
  Search,
  Utensils,
  Star,
  FlameKindling,
  Apple,
  Zap,
  Scale,
  ArrowRight,
  Check,
  BarChart3,
  HeartPulse,
  ShieldAlert,
  CircleAlert,
  Info,
  Leaf,
  Candy,
  Share2,
  Link,
  Copy,
  CheckCheck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { API_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

type IngredientRow = { slug: string; name: string; grams: number; image_url?: string; amount?: number; unit?: string };

type NutritionSummary = {
  calories: number; protein: number; fat: number;
  carbs: number; fiber: number; sugar: number;
};

type FlavorSummary = {
  sweetness: number; acidity: number; bitterness: number;
  umami: number; fat: number; aroma: number;
  balance_score: number; weak: string[]; strong: string[];
};

type SuggestionItem = {
  slug: string; name: string; name_en?: string; name_ru?: string; name_pl?: string; name_uk?: string;
  image_url?: string; score: number; reasons: string[]; fills: string[];
};

type MacrosSummary = { protein_pct: number; fat_pct: number; carbs_pct: number };

type IngredientDetail = {
  slug: string; name: string; name_en?: string; name_ru?: string; name_pl?: string; name_uk?: string;
  image_url?: string; grams: number; calories: number; protein: number; fat: number; carbs: number;
  fiber: number; sugar: number; product_type?: string; found: boolean;
};

type RuleIssue = {
  category: string; severity: string; rule: string;
  title_key: string; description_key: string;
  fix_slugs: string[]; fix_keys: string[];
  value?: number; threshold?: number; impact?: number;
};

type CategoryScores = {
  flavor: number; nutrition: number;
  dominance: number; structure: number;
};

type RuleDiagnosis = {
  health_score: number; issues: RuleIssue[];
  category_scores: CategoryScores;
  critical_count: number; warning_count: number; info_count: number;
};

type AnalyzeResponse = {
  nutrition: NutritionSummary; per_portion?: NutritionSummary;
  portions: number; macros: MacrosSummary; score: number;
  flavor: FlavorSummary; diet: string[];
  suggestions: SuggestionItem[]; ingredients: IngredientDetail[];
  flavor_contributions?: FlavorContribution[];
  diagnosis?: RuleDiagnosis;
};

type FlavorContribution = {
  slug: string;
  sweetness: number; acidity: number; bitterness: number;
  umami: number; fat: number; aroma: number;
  pct_sweetness: number; pct_acidity: number; pct_bitterness: number;
  pct_umami: number; pct_fat: number; pct_aroma: number;
};

type SearchResult = { slug: string; name: string; image_url?: string };

type Pairing = {
  slug: string; name_en?: string; name_ru?: string;
  name_pl?: string; name_uk?: string; image_url?: string;
  pair_score?: number; flavor_score?: number;
  nutrition_score?: number; culinary_score?: number;
};

type PairingData = {
  slug: string;
  basic: { name_en?: string; name_ru?: string; name_pl?: string; name_uk?: string; image_url?: string; product_type?: string };
  macros?: { calories_kcal?: number; protein_g?: number; fat_g?: number; carbs_g?: number };
  culinary?: { sweetness?: number; acidity?: number; bitterness?: number; umami?: number; aroma?: number; texture?: string };
  pairings: Pairing[];
};

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const QUICK_RECIPES = [
  {
    key: "pastaPomodoro",
    ingredients: [
      { slug: "pasta", grams: 200 },
      { slug: "tomato", grams: 300 },
      { slug: "olive-oil", grams: 20 },
      { slug: "garlic", grams: 10 },
      { slug: "basil", grams: 5 },
    ],
  },
  {
    key: "greekSalad",
    ingredients: [
      { slug: "tomato", grams: 200 },
      { slug: "cucumber", grams: 150 },
      { slug: "onion", grams: 50 },
      { slug: "olive-oil", grams: 30 },
      { slug: "hard-cheese", grams: 100 },
    ],
  },
  {
    key: "salmonBowl",
    ingredients: [
      { slug: "salmon", grams: 150 },
      { slug: "rice", grams: 200 },
      { slug: "avocado", grams: 80 },
      { slug: "cucumber", grams: 50 },
      { slug: "soy-sauce", grams: 15 },
    ],
  },
];

const POPULAR_SLUGS = [
  { slug: "tomato", key: "tomato" },
  { slug: "salmon", key: "salmon" },
  { slug: "chicken-breast", key: "chicken" },
  { slug: "basil", key: "basil" },
  { slug: "mozzarella-cheese", key: "mozzarella" },
  { slug: "lemon", key: "lemon" },
  { slug: "garlic", key: "garlic" },
  { slug: "avocado", key: "avocado" },
];

const CONVERTER_QUICK = [
  { slug: "wheat-flour", from: "cup", to: "g", amount: 1 },
  { slug: "butter", from: "tbsp", to: "g", amount: 1 },
  { slug: "sugar", from: "cup", to: "g", amount: 1 },
  { slug: "rice", from: "cup", to: "g", amount: 1 },
  { slug: "olive-oil", from: "tbsp", to: "g", amount: 1 },
  { slug: "honey", from: "tbsp", to: "g", amount: 1 },
];

const FROM_UNITS = ["cup", "tbsp", "tsp", "g", "kg", "oz", "ml", "l"];
const TO_UNITS = ["g", "oz", "kg", "lb", "ml", "cup", "tbsp", "tsp"];

const UNIT_LABELS: Record<string, Record<string, string>> = {
  cup: { en: "cup", ru: "\u0441\u0442\u0430\u043a\u0430\u043d", pl: "szklanka", uk: "\u0441\u043a\u043b\u044f\u043d\u043a\u0430" },
  tbsp: { en: "tbsp", ru: "\u0441\u0442.\u043b.", pl: "\u0142y\u017cka", uk: "\u0441\u0442.\u043b." },
  tsp: { en: "tsp", ru: "\u0447.\u043b.", pl: "\u0142y\u017ceczka", uk: "\u0447.\u043b." },
  g: { en: "g", ru: "\u0433", pl: "g", uk: "\u0433" },
  kg: { en: "kg", ru: "\u043a\u0433", pl: "kg", uk: "\u043a\u0433" },
  oz: { en: "oz", ru: "\u0443\u043d\u0446.", pl: "uncja", uk: "\u0443\u043d\u0446." },
  lb: { en: "lb", ru: "\u0444\u0443\u043d\u0442", pl: "funt", uk: "\u0444\u0443\u043d\u0442" },
  ml: { en: "ml", ru: "\u043c\u043b", pl: "ml", uk: "\u043c\u043b" },
  l: { en: "l", ru: "\u043b", pl: "l", uk: "\u043b" },
};

const MODES = ["recipeAnalyzer", "ingredientExplorer", "unitConverter", "flavorPairing"] as const;
type Mode = (typeof MODES)[number];

const MODE_ICONS: Record<Mode, any> = {
  recipeAnalyzer: ChefHat,
  ingredientExplorer: Apple,
  unitConverter: Scale,
  flavorPairing: Utensils,
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function localizedName(
  item: { name_en?: string; name_ru?: string; name_pl?: string; name_uk?: string; slug?: string },
  locale: string,
): string {
  const map: Record<string, string | undefined> = { en: item.name_en, ru: item.name_ru, pl: item.name_pl, uk: item.name_uk };
  return map[locale] || item.name_en || item.slug || "";
}

function scoreColor(s?: number) {
  if (!s) return "text-muted-foreground";
  if (s >= 8) return "text-green-500";
  if (s >= 6) return "text-amber-500";
  return "text-muted-foreground";
}

function scoreStars(s?: number) {
  const v = s || 0;
  if (v >= 9) return "\u2605\u2605\u2605\u2605\u2605";
  if (v >= 7) return "\u2605\u2605\u2605\u2605";
  if (v >= 5) return "\u2605\u2605\u2605";
  if (v >= 3) return "\u2605\u2605";
  return "\u2605";
}

function unitLabel(code: string, locale: string) {
  return UNIT_LABELS[code]?.[locale] ?? UNIT_LABELS[code]?.en ?? code;
}

/** Professional weight formatting: 535 г, 1,200 кг — locale-aware decimal sep */
function formatWeight(grams: number, locale: string): string {
  const localeMap: Record<string, string> = { ru: "ru-RU", pl: "pl-PL", uk: "uk-UA", en: "en-US" };
  const intl = localeMap[locale] || "en-US";
  if (grams >= 1000) {
    const kg = grams / 1000;
    return new Intl.NumberFormat(intl, { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(kg)
      + " " + unitLabel("kg", locale);
  }
  return new Intl.NumberFormat(intl, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(grams))
    + " " + unitLabel("g", locale);
}

// ── Universal input: volume → grams via density ──────────────────────────────

/** Volume in ml per unit */
const UNIT_ML: Record<string, number> = {
  tsp: 4.929, tbsp: 14.787, cup: 236.588, pinch: 0.308, dash: 0.616,
  ml: 1, l: 1000, fl_oz: 29.574, pint: 473.176, quart: 946.353, gallon: 3785.41,
};

/** Approximate density (g/ml) for common products — used when DB has no density */
const DENSITY: Record<string, number> = {
  "wheat-flour": 0.53, "all-purpose-flour": 0.53, flour: 0.53,
  sugar: 0.85, "brown-sugar": 0.83, "powdered-sugar": 0.56,
  salt: 1.22, "kosher-salt": 0.69, "sea-salt": 1.18,
  "black-pepper": 0.47, pepper: 0.47, "garlic-powder": 0.53,
  "chili-powder": 0.45, "chipotle-chili-powder": 0.45,
  "baking-soda": 0.89, "baking-powder": 0.77,
  butter: 0.91, "olive-oil": 0.92, "vegetable-oil": 0.92, oil: 0.92,
  honey: 1.42, "maple-syrup": 1.32, "soy-sauce": 1.07,
  milk: 1.03, cream: 1.01, "sour-cream": 1.01,
  rice: 0.85, oats: 0.34, cocoa: 0.42,
  water: 1.0, broth: 1.0, stock: 1.0, "chicken-broth": 1.0, "bone-broth": 1.0,
  "cayenne-pepper": 0.45, paprika: 0.46, cinnamon: 0.56, cumin: 0.43, turmeric: 0.68,
};

/** Mass in grams per unit (non-volume) */
const UNIT_G: Record<string, number> = {
  g: 1, kg: 1000, oz: 28.35, lb: 453.59,
};

/** Input units available for the dropdown */
const INPUT_UNITS = ["g", "kg", "tsp", "tbsp", "cup", "ml", "l", "pinch", "dash", "oz", "lb"] as const;

/** Localized unit labels for dropdown */
const INPUT_UNIT_LABELS: Record<string, Record<string, string>> = {
  g:     { en: "g",       ru: "г",       pl: "g",     uk: "г" },
  kg:    { en: "kg",      ru: "кг",      pl: "kg",    uk: "кг" },
  tsp:   { en: "tsp",     ru: "ч.л.",    pl: "łyżecz.", uk: "ч.л." },
  tbsp:  { en: "tbsp",    ru: "ст.л.",   pl: "łyżka",  uk: "ст.л." },
  cup:   { en: "cup",     ru: "стак.",   pl: "szkl.",   uk: "стак." },
  ml:    { en: "ml",      ru: "мл",      pl: "ml",    uk: "мл" },
  l:     { en: "l",       ru: "л",       pl: "l",     uk: "л" },
  pinch: { en: "pinch",   ru: "щеп.",    pl: "szczypta", uk: "щіп." },
  dash:  { en: "dash",    ru: "капля",   pl: "odrobina", uk: "крапля" },
  oz:    { en: "oz",      ru: "унц.",    pl: "oz",    uk: "унц." },
  lb:    { en: "lb",      ru: "фунт",    pl: "lb",    uk: "фунт" },
};

function inputUnitLabel(unit: string, locale: string) {
  return INPUT_UNIT_LABELS[unit]?.[locale] ?? INPUT_UNIT_LABELS[unit]?.en ?? unit;
}

/** Convert amount + unit → grams, using density for volume units */
function toGrams(amount: number, unit: string, slug: string): number {
  if (UNIT_G[unit] != null) return amount * UNIT_G[unit];
  const ml = UNIT_ML[unit];
  if (ml != null) {
    const density = DENSITY[slug] ?? 1.0;
    return amount * ml * density;
  }
  return amount; // fallback: treat as grams
}

/** Map English reason strings from the suggestion engine to localized text */
function localizeReason(reason: string, t: any): string {
  // "fills flavor gap: bitterness, acidity" → "заполняет пробел: горечь, кислотность"
  if (reason.startsWith("fills flavor gap:")) {
    const dims = reason.replace("fills flavor gap:", "").trim();
    const localized = dims.split(",").map((d) => {
      const key = d.trim();
      try { return t(`sg.fills.${key}`); } catch { return key; }
    }).join(", ");
    return `${t("sg.fillsGap")}: ${localized}`;
  }
  if (reason.startsWith("strong pairing affinity")) return t("sg.pairing");
  if (reason === "adds nutritional value") return t("sg.nutritional_boost");
  if (reason === "aromatic boost") return t("sg.aromatic_boost");
  if (reason === "general complement") return t("sg.pairing");
  return reason;
}

const FILL_KEYS = new Set(["sweetness", "acidity", "bitterness", "umami", "fat", "aroma"]);

function localizeFill(fill: string, t: any): string {
  if (FILL_KEYS.has(fill)) {
    try { return t(`sg.fills.${fill}`); } catch { return fill; }
  }
  return fill;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export function CulinaryLabClient() {
  const locale = useLocale();
  const t = useTranslations("chefTools.tools.lab");

  const [mode, setMode] = useState<Mode>("recipeAnalyzer");

  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="space-y-8">
      {/* Mode Tab Bar */}
      <TabsList className="flex gap-1 p-1 rounded-2xl bg-muted/40 border border-border/40 w-full overflow-x-auto scrollbar-none h-auto">
        {MODES.map((m) => {
          const Icon = MODE_ICONS[m];
          return (
            <TabsTrigger
              key={m}
              value={m}
              className={cn(
                "flex items-center justify-center gap-1.5 flex-1 px-3 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.12em] transition-all duration-200 whitespace-nowrap",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/25",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t(`modes.${m}`)}</span>
              <span className="sm:hidden">{t(`modes.${m}`).split(" ")[0]}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {/* Mode Panels */}
      <TabsContent value="recipeAnalyzer"><RecipeAnalyzerMode locale={locale} t={t} /></TabsContent>
      <TabsContent value="ingredientExplorer"><IngredientExplorerMode locale={locale} t={t} /></TabsContent>
      <TabsContent value="unitConverter"><UnitConverterMode locale={locale} t={t} /></TabsContent>
      <TabsContent value="flavorPairing"><FlavorPairingMode locale={locale} t={t} /></TabsContent>
    </Tabs>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODE 1: RECIPE ANALYZER
// ══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = "recipe_draft";

type RecipeDraft = {
  rows: { slug: string; grams: number; amount?: number; unit?: string }[];
  portions: number;
};

function RecipeAnalyzerMode({ locale, t }: { locale: string; t: any }) {
  const [rows, setRows] = useState<IngredientRow[]>([{ slug: "", name: "", grams: 100 }]);
  const [portions, setPortions] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<"ingredients" | "nutrition" | "flavor" | "influence" | "doctor" | "suggestions">("nutrition");
  const [restored, setRestored] = useState(false);
  const [slugNames, setSlugNames] = useState<Record<string, { name: string; image_url?: string }>>({});
  const resultsRef = useRef<HTMLDivElement>(null);
  const didRestore = useRef(false);

  // ── Restore draft from localStorage on mount ───────────────────────────
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const draft: RecipeDraft = JSON.parse(raw);
      if (!draft.rows || draft.rows.length === 0) return;
      // Only restore if there's at least one ingredient with a slug
      const hasData = draft.rows.some((r) => r.slug);
      if (!hasData) return;
      setPortions(draft.portions || 1);
      // Set rows with slugs as placeholder names, then resolve localized names
      const initial: IngredientRow[] = draft.rows.map((r) => ({
        slug: r.slug, name: r.slug, grams: r.grams, amount: r.amount ?? r.grams, unit: r.unit || "g",
      }));
      setRows(initial);
      setRestored(true);
      // Resolve localized names + images in background
      Promise.all(
        draft.rows.filter((r) => r.slug).map(async (r) => {
          try {
            const res = await fetch(`${API_URL}/public/tools/product-search?q=${encodeURIComponent(r.slug)}&lang=${locale}&limit=1`);
            if (res.ok) {
              const data = await res.json();
              const found = (data.results || []).find((p: any) => p.slug === r.slug);
              if (found) return { slug: r.slug, name: found.name || r.slug, image_url: found.image_url as string | undefined };
            }
          } catch { /* ignore */ }
          return { slug: r.slug, name: r.slug, image_url: undefined };
        }),
      ).then((resolved) => {
        setRows((prev) => prev.map((row) => {
          const match = resolved.find((r) => r.slug === row.slug);
          return match ? { ...row, name: match.name, image_url: match.image_url } : row;
        }));
      });
      // Auto-hide restored toast after 3s
      setTimeout(() => setRestored(false), 3000);
    } catch { /* corrupted storage — ignore */ }
  }, [locale]);

  // ── Save draft to localStorage on every change ─────────────────────────
  useEffect(() => {
    const draft: RecipeDraft = {
      rows: rows.map((r) => ({ slug: r.slug, grams: r.grams, amount: r.amount, unit: r.unit })),
      portions,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch { /* quota */ }
  }, [rows, portions]);

  // ── Resolve fix-slug localized names when AI Sous Chef tab is active ──
  useEffect(() => {
    if (resultTab !== "doctor" || !result?.diagnosis) return;
    const diag = result.diagnosis;
    // Collect all unique fix slugs
    const allSlugs = new Set<string>();
    diag.issues.forEach((issue) => issue.fix_slugs.forEach((s) => allSlugs.add(s)));
    if (allSlugs.size === 0) return;
    // Build known map from ingredients + suggestions
    const known: Record<string, { name: string; image_url?: string }> = {};
    result.ingredients.forEach((i) => { known[i.slug] = { name: localizedName(i, locale) || i.name, image_url: i.image_url }; });
    result.suggestions.forEach((s) => { known[s.slug] = { name: localizedName(s, locale) || s.name, image_url: s.image_url }; });
    // Find unknown slugs not yet resolved
    const unknown = [...allSlugs].filter((s) => !known[s] && !slugNames[s]);
    // Set known ones immediately
    if (Object.keys(known).length > 0) {
      setSlugNames((prev) => ({ ...prev, ...known }));
    }
    // Fetch unknown slugs from product-search
    if (unknown.length > 0) {
      Promise.all(
        unknown.map(async (slug) => {
          try {
            const res = await fetch(`${API_URL}/public/tools/product-search?q=${encodeURIComponent(slug)}&lang=${locale}&limit=1`);
            if (res.ok) {
              const data = await res.json();
              const found = (data.results || [])[0];
              if (found) return { slug, name: found.name || slug, image_url: found.image_url as string | undefined };
            }
          } catch { /* ignore */ }
          return { slug, name: slug, image_url: undefined };
        }),
      ).then((resolved) => {
        const map: Record<string, { name: string; image_url?: string }> = {};
        resolved.forEach((r) => { map[r.slug] = { name: r.name, image_url: r.image_url }; });
        setSlugNames((prev) => ({ ...prev, ...map }));
      });
    }
  }, [resultTab, result, locale]);

  /** Clear recipe — reset rows, portions, result, and remove from localStorage */
  const clearRecipe = () => {
    setRows([{ slug: "", name: "", grams: 100 }]);
    setPortions(1);
    setResult(null);
    setError(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  const searchIngredients = useCallback(
    async (query: string) => {
      if (query.length < 2) { setSearchResults([]); return; }
      try {
        const res = await fetch(`${API_URL}/public/tools/product-search?q=${encodeURIComponent(query)}&lang=${locale}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults((data.results || []).map((p: any) => ({ slug: p.slug, name: p.name || p.name_en || p.slug, image_url: p.image_url })));
        }
      } catch { /* ignore */ }
    },
    [locale],
  );

  const selectIngredient = (idx: number, item: SearchResult) => {
    setRows((prev) => {
      const next = [...prev];
      const existing = next[idx];
      next[idx] = { ...existing, slug: item.slug, name: item.name, image_url: item.image_url, amount: existing.amount ?? existing.grams, unit: existing.unit || "g" };
      return next;
    });
    setSearchResults([]); setActiveRowIdx(null); setSearchQuery("");
  };

  const loadQuickRecipe = async (recipe: typeof QUICK_RECIPES[0]) => {
    setResult(null); setError(null);
    // Set rows immediately with slug as placeholder name
    const initial: IngredientRow[] = recipe.ingredients.map((i) => ({ slug: i.slug, name: i.slug, grams: i.grams, amount: i.grams, unit: "g" }));
    setRows(initial);
    // Fetch localized names + image_url in parallel
    try {
      const resolved = await Promise.all(
        recipe.ingredients.map(async (i) => {
          try {
            const res = await fetch(`${API_URL}/public/tools/product-search?q=${encodeURIComponent(i.slug)}&lang=${locale}&limit=1`);
            if (res.ok) {
              const data = await res.json();
              const found = (data.results || []).find((r: any) => r.slug === i.slug);
              if (found) return { name: found.name || i.slug, image_url: found.image_url as string | undefined };
            }
          } catch { /* ignore */ }
          return { name: i.slug, image_url: undefined };
        }),
      );
      setRows(recipe.ingredients.map((i, idx) => ({ slug: i.slug, name: resolved[idx].name, grams: i.grams, amount: i.grams, unit: "g", image_url: resolved[idx].image_url })));
    } catch { /* keep slug names */ }
  };

  const analyze = async () => {
    const validRows = rows.filter((r) => r.slug && r.grams > 0);
    if (validRows.length === 0) { setError(t("addAtLeastOne")); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_URL}/public/tools/recipe-analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: validRows.map((r) => ({ slug: r.slug, grams: r.grams })), portions: Math.max(1, portions), lang: locale }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || `Error ${res.status}`); }
      const data: AnalyzeResponse = await res.json();
      setResult(data);
      setResultTab("nutrition");
      // Update input row names + images with localized data from the API response
      setRows((prev) => prev.map((row) => {
        const detail = data.ingredients.find((d) => d.slug === row.slug);
        if (detail) {
          const locName = localizedName(detail, locale) || detail.name;
          return { ...row, name: locName, image_url: row.image_url || detail.image_url };
        }
        return row;
      }));
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: any) {
      setError(err.message || t("failedAnalyze"));
    } finally {
      setLoading(false);
    }
  };

  /** Add a suggested ingredient to the recipe and re-analyze */
  const addSuggestionToRecipe = async (s: SuggestionItem) => {
    // Check if ingredient already exists in the recipe
    if (rows.some((r) => r.slug === s.slug)) return;
    const name = localizedName(s, locale) || s.name;
    const defaultGrams = 50;
    const newRow: IngredientRow = { slug: s.slug, name, grams: defaultGrams, amount: defaultGrams, unit: "g", image_url: s.image_url };
    const updatedRows = [...rows, newRow];
    setRows(updatedRows);
    // Re-analyze with the new ingredient
    const validRows = updatedRows.filter((r) => r.slug && r.grams > 0);
    if (validRows.length === 0) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/public/tools/recipe-analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: validRows.map((r) => ({ slug: r.slug, grams: r.grams })), portions: Math.max(1, portions), lang: locale }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || `Error ${res.status}`); }
      const data: AnalyzeResponse = await res.json();
      setResult(data);
      // Update row names + images from fresh response
      setRows((prev) => prev.map((row) => {
        const detail = data.ingredients.find((d) => d.slug === row.slug);
        if (detail) {
          const locName = localizedName(detail, locale) || detail.name;
          return { ...row, name: locName, image_url: row.image_url || detail.image_url };
        }
        return row;
      }));
    } catch (err: any) {
      setError(err.message || t("failedAnalyze"));
    } finally {
      setLoading(false);
    }
  };

  const dietLabels: Record<string, string> = {
    vegan: "\ud83c\udf31 Vegan", vegetarian: "\ud83e\udd5a Vegetarian", keto: "\ud83e\udd51 Keto",
    paleo: "\ud83e\uddb4 Paleo", gluten_free: "\ud83c\udf3e GF", mediterranean: "\ud83e\udeda Med", low_carb: "\ud83d\udcc9 LC",
  };

  // ── Share recipe logic ────────────────────────────────────────────────
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareRecipe = async () => {
    const validRows = rows.filter((r) => r.slug && r.grams > 0);
    if (validRows.length === 0) return;
    setSharing(true);
    try {
      const res = await fetch(`${API_URL}/public/tools/share-recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: validRows.map((r) => ({ slug: r.slug, grams: r.grams })),
          portions: Math.max(1, portions),
          lang: locale,
        }),
      });
      if (!res.ok) throw new Error("Failed to share");
      const data = await res.json();
      const fullUrl = `https://dima-fomin.pl/${locale}/chef-tools/lab/r/${data.slug}`;
      setShareUrl(fullUrl);
    } catch {
      setError("Failed to create share link");
    } finally {
      setSharing(false);
    }
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  return (
    <div className="space-y-6">
      {/* Quick recipes */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">{t("quickRecipes")}</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_RECIPES.map((recipe) => (
            <Button
              key={recipe.key}
              variant="outline"
              size="sm"
              onClick={() => loadQuickRecipe(recipe)}
              className="text-xs font-bold"
            >
              {t(recipe.key as any)}
            </Button>
          ))}
        </div>
      </div>

      {/* Draft restored toast */}
      {restored && (
        <Alert className="border-green-500/20 bg-green-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-600 dark:text-green-400 font-medium">{t("draftRestored")}</AlertDescription>
        </Alert>
      )}

      {/* Ingredient table */}
      <div className="border border-border/50 rounded-2xl overflow-hidden">
        <div className="bg-muted/20 px-4 py-2.5 border-b border-border/30">
          <div className="grid grid-cols-[1fr_60px_72px_36px] gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            <span>{t("ingredient")}</span>
            <span className="text-center">{t("amount") ?? "Amount"}</span>
            <span className="text-center">{t("unit") ?? "Unit"}</span>
            <span />
          </div>
        </div>
        <div className="divide-y divide-border/20">
          {rows.map((row, idx) => (
            <div key={idx} className="px-4 py-2.5 relative">
              <div className="grid grid-cols-[1fr_60px_72px_36px] gap-2 items-center">
                <div className="relative flex items-center gap-2">
                  {row.image_url && <img src={row.image_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />}
                  <Input
                    type="text"
                    value={activeRowIdx === idx ? searchQuery : row.name || ""}
                    onChange={(e) => { setActiveRowIdx(idx); setSearchQuery(e.target.value); searchIngredients(e.target.value); }}
                    onFocus={() => { setActiveRowIdx(idx); setSearchQuery(row.name || ""); }}
                    onBlur={() => { setTimeout(() => { if (activeRowIdx === idx) { setActiveRowIdx(null); setSearchResults([]); } }, 200); }}
                    placeholder={t("searchPlaceholder")}
                    className="w-full h-9"
                  />
                  {activeRowIdx === idx && searchResults.length > 0 && (
                    <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-background border border-border/50 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((item) => (
                        <button
                          key={item.slug}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectIngredient(idx, item)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/40 flex items-center gap-2"
                        >
                          {item.image_url && <img src={item.image_url} alt="" className="w-5 h-5 rounded-full object-cover" />}
                          <span className="font-medium">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{item.slug}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={row.amount ?? row.grams}
                  onChange={(e) => {
                    const amt = Number(e.target.value);
                    const unit = row.unit || "g";
                    const grams = Math.round(toGrams(amt, unit, row.slug));
                    setRows((prev) => { const next = [...prev]; next[idx] = { ...next[idx], amount: amt, grams }; return next; });
                  }}
                  className="w-full h-9 text-center"
                />
                <select
                  value={row.unit || "g"}
                  onChange={(e) => {
                    const unit = e.target.value;
                    const amt = row.amount ?? row.grams;
                    const grams = Math.round(toGrams(amt, unit, row.slug));
                    setRows((prev) => { const next = [...prev]; next[idx] = { ...next[idx], unit, grams }; return next; });
                  }}
                  className="w-full px-1 py-2 text-xs bg-background border border-border/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-center appearance-none cursor-pointer"
                >
                  {INPUT_UNITS.map((u) => (
                    <option key={u} value={u}>{inputUnitLabel(u, locale)}</option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { if (rows.length > 1) setRows((prev) => prev.filter((_, i) => i !== idx)); }}
                  disabled={rows.length <= 1}
                  className="h-8 w-8 text-muted-foreground hover:text-red-500 disabled:opacity-20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {(row.unit && row.unit !== "g") && (
                <div className="mt-1 text-[10px] text-muted-foreground/50 pl-10">
                  ≈ {formatWeight(row.grams, locale)}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-3">
            <Button
              variant="link"
              size="sm"
              onClick={() => setRows((prev) => [...prev, { slug: "", name: "", grams: 100, amount: 100, unit: "g" }])}
              className="text-xs font-bold text-primary p-0 h-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("addIngredient")}
            </Button>
            {rows.some((r) => r.slug) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRecipe}
                className="text-[10px] font-bold text-muted-foreground hover:text-red-500 p-0 h-auto"
              >
                <Trash2 className="h-3 w-3" />
                {t("clearRecipe")}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-muted-foreground/60">
              {t("totalWeight")}: <span className="text-foreground font-black">{formatWeight(rows.reduce((s, r) => s + (r.grams || 0), 0), locale)}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t("portions")}</span>
              <Input
                type="number"
                min={1}
                max={20}
                value={portions}
                onChange={(e) => setPortions(Number(e.target.value))}
                className="w-14 px-2 py-1 text-sm text-center h-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Analyze button */}
      <Button
        onClick={analyze}
        disabled={loading || rows.every((r) => !r.slug)}
        size="lg"
        className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("analyzing")}
          </>
        ) : (
          <>
            <ChefHat className="h-4 w-4" />
            {t("analyzeRecipe")}
          </>
        )}
      </Button>

      {error && (
        <Alert variant="destructive" className="border-red-500/10 bg-red-500/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <div ref={resultsRef} className="space-y-5 pt-2">
          {/* Result sub-tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-border/30 -mx-1 px-1">
            {(["ingredients", "nutrition", "flavor", "influence", "doctor", "suggestions"] as const).map((tab) => {
              const icons = { ingredients: Apple, nutrition: Zap, flavor: FlameKindling, influence: BarChart3, doctor: HeartPulse, suggestions: Sparkles };
              const Icon = icons[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setResultTab(tab)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2.5 font-bold text-[10px] uppercase tracking-widest border-b-2 -mb-px transition-all whitespace-nowrap shrink-0",
                    resultTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {t(`tabs.${tab}`)}
                  {tab === "suggestions" && result.suggestions.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-primary/10 text-primary rounded-full font-black">
                      {result.suggestions.length}
                    </span>
                  )}
                  {tab === "doctor" && result.diagnosis && result.diagnosis.issues.length > 0 && (
                    <span className={cn(
                      "ml-1 px-1.5 py-0.5 text-[9px] rounded-full font-black",
                      result.diagnosis.critical_count > 0 ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500",
                    )}>
                      {result.diagnosis.issues.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Share recipe button */}
          <div className="flex items-center gap-2">
            {!shareUrl ? (
              <Button
                variant="outline"
                size="sm"
                onClick={shareRecipe}
                disabled={sharing}
                className="text-xs font-bold gap-1.5"
              >
                {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                {sharing ? t("sharing") || "Sharing…" : t("shareRecipe") || "Share Recipe"}
              </Button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 border border-border/30 rounded-xl text-xs font-mono text-muted-foreground truncate max-w-[300px]">
                  <Link className="h-3 w-3 flex-shrink-0 text-primary" />
                  <span className="truncate">{shareUrl}</span>
                </div>
                <Button variant="outline" size="sm" onClick={copyShareUrl} className="text-xs font-bold gap-1.5">
                  {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t("copied") || "Copied!" : t("copy") || "Copy"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`, "_blank")}
                  className="text-xs font-bold px-2"
                >
                  Telegram
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, "_blank")}
                  className="text-xs font-bold px-2"
                >
                  WhatsApp
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setShareUrl(null); setCopied(false); }}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
            )}
          </div>

          {/* Ingredients table — PRO */}
          {resultTab === "ingredients" && (() => {
            const totalCal = result.ingredients.reduce((s, i) => s + i.calories, 0);
            const totalG = result.ingredients.reduce((s, i) => s + i.grams, 0);
            const totalP = result.ingredients.reduce((s, i) => s + i.protein, 0);
            const totalF = result.ingredients.reduce((s, i) => s + i.fat, 0);
            const totalC = result.ingredients.reduce((s, i) => s + i.carbs, 0);
            const totalFiber = result.ingredients.reduce((s, i) => s + (i.fiber || 0), 0);
            const totalSugar = result.ingredients.reduce((s, i) => s + (i.sugar || 0), 0);

            /** Color-coded role badge by product_type */
            const roleBadge = (pt?: string) => {
              const map: Record<string, { label: Record<string, string>; bg: string; text: string }> = {
                grain:       { label: { en: "base",    ru: "основа",  pl: "baza",     uk: "основа" },   bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400" },
                vegetable:   { label: { en: "veggie",  ru: "овощ",    pl: "warzywo",  uk: "овоч" },     bg: "bg-green-500/10",   text: "text-green-600 dark:text-green-400" },
                fruit:       { label: { en: "fruit",   ru: "фрукт",   pl: "owoc",     uk: "фрукт" },    bg: "bg-pink-500/10",    text: "text-pink-600 dark:text-pink-400" },
                meat:        { label: { en: "meat",    ru: "мясо",    pl: "mięso",    uk: "м'ясо" },    bg: "bg-red-500/10",     text: "text-red-600 dark:text-red-400" },
                fish:        { label: { en: "fish",    ru: "рыба",    pl: "ryba",     uk: "риба" },     bg: "bg-cyan-500/10",    text: "text-cyan-600 dark:text-cyan-400" },
                seafood:     { label: { en: "seafood", ru: "морепрод.", pl: "owoce morza", uk: "морепрод." }, bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-400" },
                dairy:       { label: { en: "dairy",   ru: "молочн.",  pl: "nabiał",   uk: "молочн." },  bg: "bg-sky-500/10",     text: "text-sky-600 dark:text-sky-400" },
                oil:         { label: { en: "fat",     ru: "жир",     pl: "tłuszcz",  uk: "жир" },      bg: "bg-yellow-500/10",  text: "text-yellow-600 dark:text-yellow-400" },
                fat:         { label: { en: "fat",     ru: "жир",     pl: "tłuszcz",  uk: "жир" },      bg: "bg-yellow-500/10",  text: "text-yellow-600 dark:text-yellow-400" },
                herb:        { label: { en: "herb",    ru: "зелень",  pl: "zioło",    uk: "зелень" },   bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
                spice:       { label: { en: "spice",   ru: "специя",  pl: "przyprawa", uk: "спеція" },  bg: "bg-orange-500/10",  text: "text-orange-600 dark:text-orange-400" },
                legume:      { label: { en: "legume",  ru: "бобы",    pl: "strączkowe", uk: "боби" },   bg: "bg-lime-500/10",    text: "text-lime-600 dark:text-lime-400" },
                nut:         { label: { en: "nut",     ru: "орех",    pl: "orzech",   uk: "горіх" },    bg: "bg-stone-500/10",   text: "text-stone-600 dark:text-stone-400" },
                sauce:       { label: { en: "sauce",   ru: "соус",    pl: "sos",      uk: "соус" },     bg: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400" },
                sweetener:   { label: { en: "sweet",   ru: "подслащ.", pl: "słodzik",  uk: "підсол." },  bg: "bg-rose-500/10",    text: "text-rose-600 dark:text-rose-400" },
                condiment:   { label: { en: "condim.", ru: "приправа", pl: "przyprawa", uk: "приправа" }, bg: "bg-fuchsia-500/10", text: "text-fuchsia-600 dark:text-fuchsia-400" },
                mushroom:    { label: { en: "mushroom", ru: "гриб",   pl: "grzyb",    uk: "гриб" },     bg: "bg-stone-500/10",   text: "text-stone-600 dark:text-stone-400" },
                egg:         { label: { en: "egg",     ru: "яйцо",   pl: "jajko",    uk: "яйце" },     bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400" },
                other:       { label: { en: "other",   ru: "прочее",  pl: "inne",     uk: "інше" },     bg: "bg-muted",          text: "text-muted-foreground" },
              };
              if (!pt) return null;
              const cfg = map[pt] || { label: { en: pt, ru: pt, pl: pt, uk: pt }, bg: "bg-muted", text: "text-muted-foreground" };
              const lb = cfg.label[locale] || cfg.label.en || pt;
              return (
                <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider border-0 px-2 py-0.5", cfg.bg, cfg.text)}>
                  {lb}
                </Badge>
              );
            };

            /** Calorie-share bar width */
            const calPct = (cal: number) => totalCal > 0 ? (cal / totalCal) * 100 : 0;

            return (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="rounded-2xl overflow-hidden">
                    <CardContent className="p-4 text-center">
                      <Scale className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground/60" />
                      <span className="text-2xl font-black tabular-nums">{formatWeight(totalG, locale)}</span>
                      <p className="text-xs text-muted-foreground font-bold mt-0.5">{t("totalWeight")?.replace(":", "") ?? "Weight"}</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl overflow-hidden">
                    <CardContent className="p-4 text-center">
                      <Zap className="h-5 w-5 mx-auto mb-1.5 text-amber-500" />
                      <span className="text-2xl font-black tabular-nums">{Math.round(totalCal)}</span>
                      <p className="text-xs text-muted-foreground font-bold mt-0.5">kcal</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl overflow-hidden">
                    <CardContent className="p-4 text-center">
                      <Apple className="h-5 w-5 mx-auto mb-1.5 text-green-500" />
                      <span className="text-2xl font-black tabular-nums">{result.ingredients.length}</span>
                      <p className="text-xs text-muted-foreground font-bold mt-0.5">{t("tabs.ingredients")}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Ingredient Cards — mobile-first list */}
                <div className="space-y-3">
                  {result.ingredients.map((ing) => {
                    const pct = calPct(ing.calories);
                    return (
                      <Card key={ing.slug} className="rounded-2xl overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex items-stretch">
                            {/* Left: image */}
                            <div className="w-20 sm:w-24 shrink-0 bg-muted/10 flex items-center justify-center">
                              {ing.image_url ? (
                                <img src={ing.image_url} alt={localizedName(ing, locale) || ing.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl font-black text-muted-foreground/20">{(localizedName(ing, locale) || ing.name).charAt(0)}</span>
                              )}
                            </div>

                            {/* Right: content */}
                            <div className="flex-1 min-w-0 p-3 sm:p-4">
                              {/* Title row */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <h4 className="text-sm font-black truncate">{localizedName(ing, locale) || ing.name}</h4>
                                  {roleBadge(ing.product_type)}
                                </div>
                                {!ing.found && (
                                  <Badge variant="outline" className="text-[10px] font-bold text-amber-500 border-amber-500/30 bg-amber-500/10 shrink-0">
                                    ⚠ {t("notFound") ?? "N/F"}
                                  </Badge>
                                )}
                              </div>

                              {/* Calorie bar */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                                  <div
                                    className={cn("h-full rounded-full transition-all duration-500", pct >= 50 ? "bg-amber-500" : pct >= 20 ? "bg-amber-400" : "bg-amber-300/60")}
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                                <span className={cn("text-xs font-black tabular-nums w-12 text-right", pct >= 50 ? "text-amber-500" : "text-muted-foreground")}>
                                  {pct.toFixed(0)}% cal
                                </span>
                              </div>

                              {/* Macros row */}
                              <div className="flex items-center gap-3 text-xs">
                                <span className="font-bold tabular-nums">{Math.round(ing.grams)}<span className="text-muted-foreground font-normal">{unitLabel("g", locale)}</span></span>
                                <Separator orientation="vertical" className="h-3" />
                                <span className="font-bold tabular-nums">{Math.round(ing.calories)} <span className="text-muted-foreground font-normal">kcal</span></span>
                                <Separator orientation="vertical" className="h-3" />
                                <span className="text-blue-500 font-bold tabular-nums">P {ing.protein.toFixed(1)}</span>
                                <span className="text-yellow-500 font-bold tabular-nums">F {ing.fat.toFixed(1)}</span>
                                <span className="text-green-500 font-bold tabular-nums">C {ing.carbs.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Totals card */}
                <Card className="rounded-2xl overflow-hidden border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t("total")}</span>
                      <span className="text-lg font-black tabular-nums">{Math.round(totalCal)} <span className="text-sm text-muted-foreground">kcal</span></span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-center text-xs">
                      <div>
                        <span className="text-base font-black text-blue-500 tabular-nums">{totalP.toFixed(1)}</span>
                        <p className="text-muted-foreground font-bold">{t("protein")}</p>
                      </div>
                      <div>
                        <span className="text-base font-black text-yellow-500 tabular-nums">{totalF.toFixed(1)}</span>
                        <p className="text-muted-foreground font-bold">{t("fat")}</p>
                      </div>
                      <div>
                        <span className="text-base font-black text-green-500 tabular-nums">{totalC.toFixed(1)}</span>
                        <p className="text-muted-foreground font-bold">{t("carbs")}</p>
                      </div>
                      <div>
                        <span className="text-base font-black text-emerald-500 tabular-nums">{totalFiber.toFixed(1)}</span>
                        <p className="text-muted-foreground font-bold">{t("fiber")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Macro split bar */}
                <Card className="rounded-2xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-0.5 h-4 rounded-full overflow-hidden bg-muted/30">
                      <div className="h-full bg-blue-500 rounded-l-full transition-all" style={{ width: `${result.macros.protein_pct}%` }} />
                      <div className="h-full bg-yellow-500 transition-all" style={{ width: `${result.macros.fat_pct}%` }} />
                      <div className="h-full bg-green-500 rounded-r-full transition-all" style={{ width: `${result.macros.carbs_pct}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-bold">
                      <span className="text-blue-500">{t("protein")} {result.macros.protein_pct.toFixed(0)}%</span>
                      <span className="text-yellow-500">{t("fat")} {result.macros.fat_pct.toFixed(0)}%</span>
                      <span className="text-green-500">{t("carbs")} {result.macros.carbs_pct.toFixed(0)}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          {/* Nutrition */}
          {resultTab === "nutrition" && (
            <NutritionTab result={result} locale={locale} t={t} dietLabels={dietLabels} />
          )}

          {/* Flavor */}
          {resultTab === "flavor" && <FlavorRadarCard flavor={result.flavor} t={t} />}

          {/* Influence Heatmap */}
          {resultTab === "influence" && result.flavor_contributions && (() => {
            const fc = result.flavor_contributions;
            const dims = [
              { key: "sweetness",  pctKey: "pct_sweetness",  label: t("sweetness"),  bgCell: "bg-pink-500",   bgLight: "bg-pink-100 dark:bg-pink-950",   text: "text-pink-600 dark:text-pink-400",   border: "border-pink-200 dark:border-pink-800" },
              { key: "acidity",    pctKey: "pct_acidity",    label: t("acidity"),    bgCell: "bg-lime-500",   bgLight: "bg-lime-100 dark:bg-lime-950",   text: "text-lime-600 dark:text-lime-400",   border: "border-lime-200 dark:border-lime-800" },
              { key: "bitterness", pctKey: "pct_bitterness", label: t("bitterness"), bgCell: "bg-amber-500",  bgLight: "bg-amber-100 dark:bg-amber-950", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
              { key: "umami",      pctKey: "pct_umami",      label: t("umami"),      bgCell: "bg-red-500",    bgLight: "bg-red-100 dark:bg-red-950",     text: "text-red-600 dark:text-red-400",     border: "border-red-200 dark:border-red-800" },
              { key: "fat",        pctKey: "pct_fat",        label: t("fatDimension"), bgCell: "bg-yellow-500", bgLight: "bg-yellow-100 dark:bg-yellow-950", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-200 dark:border-yellow-800" },
              { key: "aroma",      pctKey: "pct_aroma",      label: t("aroma"),      bgCell: "bg-violet-500", bgLight: "bg-violet-100 dark:bg-violet-950", text: "text-violet-600 dark:text-violet-400", border: "border-violet-200 dark:border-violet-800" },
            ] as const;

            const getName = (slug: string) => {
              const ing = result.ingredients.find((i) => i.slug === slug);
              return ing ? (localizedName(ing, locale) || ing.name) : slug;
            };

            const topContributor = (pctKey: string) => {
              let max = 0; let top = "";
              for (const c of fc) { const v = (c as any)[pctKey]; if (v > max) { max = v; top = c.slug; } }
              return { slug: top, pct: max };
            };

            return (
              <div className="space-y-5">
                {/* Heatmap table */}
                <Card className="rounded-2xl overflow-hidden">
                  <CardHeader className="bg-muted/20 px-4 py-3 border-b border-border/30 flex flex-row items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      {t("influenceMap") ?? "Ingredient Influence Map"}
                    </span>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-border/30 bg-muted/10">
                            <TableHead className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 min-w-[120px]">
                              {t("ingredient")}
                            </TableHead>
                            {dims.map((d) => (
                              <TableHead key={d.key} className={cn("text-center px-2 py-2.5 text-[9px] font-black uppercase tracking-widest min-w-[70px]", d.text)}>
                                {d.label}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fc.map((c, idx) => (
                            <TableRow key={c.slug} className={cn(
                              "border-b border-border/10 transition-colors",
                              idx % 2 === 0 ? "bg-transparent" : "bg-muted/5",
                            )}>
                              <TableCell className="px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const ing = result.ingredients.find((i) => i.slug === c.slug);
                                    return ing?.image_url
                                      ? <img src={ing.image_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                                      : <div className="w-6 h-6 rounded-full bg-muted shrink-0 flex items-center justify-center text-[9px] font-bold text-muted-foreground">{getName(c.slug).charAt(0)}</div>;
                                  })()}
                                  <span className="font-bold text-[11px]">{getName(c.slug)}</span>
                                </div>
                              </TableCell>
                              {dims.map((d) => {
                                const pct = (c as any)[d.pctKey] as number;
                                return (
                                  <TableCell key={d.key} className="px-1.5 py-2.5 text-center">
                                    {pct > 0 ? (
                                      <Badge variant="outline" className={cn(
                                        "text-[10px] font-black tabular-nums px-2 py-0.5 border",
                                        pct >= 50 ? `${d.bgCell} text-white border-transparent` :
                                        pct >= 20 ? `${d.bgLight} ${d.text} ${d.border}` :
                                        "bg-muted/50 text-foreground border-border/50",
                                      )}>
                                        {pct.toFixed(0)}%
                                      </Badge>
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground/40">—</span>
                                    )}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Stacked dimension bars */}
                <Card className="rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {t("flavorSources") ?? "Flavor Sources"}
                  </span>
                  {dims.map((d) => {
                    const top = topContributor(d.pctKey);
                    return (
                      <div key={d.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn("text-[10px] font-bold", d.text)}>{d.label}</span>
                          {top.pct > 0 && (
                            <span className="text-[9px] text-muted-foreground">
                              ← {getName(top.slug)} ({top.pct.toFixed(0)}%)
                            </span>
                          )}
                        </div>
                        <div className="flex h-5 rounded-full overflow-hidden bg-muted/20 gap-px">
                          {fc.map((c) => {
                            const pct = (c as any)[d.pctKey] as number;
                            if (pct <= 0) return null;
                            return (
                              <div
                                key={c.slug}
                                className={cn(d.bgCell, "h-full transition-all relative group")}
                                style={{ width: `${pct}%`, opacity: 0.4 + (pct / 100) * 0.6 }}
                                title={`${getName(c.slug)}: ${pct.toFixed(0)}%`}
                              >
                                {pct >= 12 && (
                                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white truncate px-0.5">
                                    {getName(c.slug).split(" ")[0]}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </Card>

                {/* Quick insight cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {dims.map((d) => {
                    const top = topContributor(d.pctKey);
                    if (top.pct <= 0) return null;
                    return (
                      <Card key={d.key} className="rounded-xl p-3 bg-muted/5">
                        <div className={cn("text-[10px] font-black uppercase tracking-wider mb-1", d.text)}>{d.label}</div>
                        <div className="flex items-center gap-1.5">
                          {(() => {
                            const ing = result.ingredients.find((i) => i.slug === top.slug);
                            return ing?.image_url
                              ? <img src={ing.image_url} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                              : null;
                          })()}
                          <span className="text-xs font-bold truncate">{getName(top.slug)}</span>
                        </div>
                        <span className="text-lg font-black tabular-nums">{top.pct.toFixed(0)}%</span>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Influence — fallback if no data */}
          {resultTab === "influence" && !result.flavor_contributions && (
            <div className="border border-border/40 rounded-2xl p-8 text-center text-muted-foreground text-sm">
              {t("noInfluenceData") ?? "Influence data not available. Re-analyze to see flavor contributions."}
            </div>
          )}

          {/* ═══ AI Sous Chef Tab ═══ */}
          {resultTab === "doctor" && (() => {
            const diag = result.diagnosis;
            if (!diag) return (
              <Card className="rounded-2xl p-8 text-center text-muted-foreground text-sm">
                Re-analyze to see diagnosis.
              </Card>
            );

            const catLabels: Record<string, string> = {
              flavor: t("catFlavor"), nutrition: t("catNutrition"),
              dominance: t("catDominance"), structure: t("catStructure"),
            };
            const catIcons: Record<string, typeof FlameKindling> = {
              flavor: FlameKindling, nutrition: Zap, dominance: Scale, structure: Apple,
            };
            const catColors: Record<string, string> = {
              flavor: "text-pink-500", nutrition: "text-blue-500",
              dominance: "text-amber-500", structure: "text-emerald-500",
            };
            const catBarColors: Record<string, string> = {
              flavor: "bg-pink-500", nutrition: "bg-blue-500",
              dominance: "bg-amber-500", structure: "bg-emerald-500",
            };

            const tr = (key: string) => { try { return t(key); } catch { return key; } };

            // Health score ring
            const ringColor = diag.health_score >= 80 ? "text-green-500" : diag.health_score >= 50 ? "text-amber-500" : "text-red-500";
            const ringBg = diag.health_score >= 80 ? "stroke-green-500/20" : diag.health_score >= 50 ? "stroke-amber-500/20" : "stroke-red-500/20";
            const ringStroke = diag.health_score >= 80 ? "stroke-green-500" : diag.health_score >= 50 ? "stroke-amber-500" : "stroke-red-500";
            const circumference = 2 * Math.PI * 42;
            const offset = circumference - (diag.health_score / 100) * circumference;

            // Category scores from API
            const cs = diag.category_scores || { flavor: 100, nutrition: 100, dominance: 100, structure: 100 };

            // Group issues by category
            const grouped = diag.issues.reduce<Record<string, RuleIssue[]>>((acc, issue) => {
              (acc[issue.category] ||= []).push(issue);
              return acc;
            }, {});

            // Sort issues: critical first, then warning, then info
            const sevOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };

            // Severity styling
            const sevStyle = (sev: string) => {
              if (sev === "critical") return { border: "border-red-500/40", bg: "bg-red-50 dark:bg-red-950/30", icon: "bg-red-500/20", badge: "bg-red-500 text-white", IconComp: ShieldAlert, iconColor: "text-red-500", barColor: "bg-red-500" };
              if (sev === "warning") return { border: "border-amber-500/40", bg: "bg-amber-50 dark:bg-amber-950/30", icon: "bg-amber-500/20", badge: "bg-amber-500 text-white", IconComp: CircleAlert, iconColor: "text-amber-500", barColor: "bg-amber-500" };
              return { border: "border-sky-500/30", bg: "bg-sky-50 dark:bg-sky-950/20", icon: "bg-sky-500/15", badge: "bg-sky-500 text-white", IconComp: Info, iconColor: "text-sky-500", barColor: "bg-sky-500" };
            };

            const sevLabel = (sev: string) => {
              if (sev === "critical") return t("critical");
              if (sev === "warning") return t("warning");
              return t("info") || "Info";
            };

            return (
              <div className="space-y-6">
                {/* Health Score Hero + Category Breakdown */}
                <Card className="rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Ring */}
                      <div className="relative w-32 h-32 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" className={ringBg} />
                          <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" strokeLinecap="round" className={ringStroke}
                            strokeDasharray={circumference} strokeDashoffset={offset}
                            style={{ transition: "stroke-dashoffset 0.6s ease" }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={cn("text-3xl font-black tabular-nums", ringColor)}>{diag.health_score}</span>
                        </div>
                      </div>

                      {/* Category breakdown bars */}
                      <div className="flex-1 w-full space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-3">{t("healthScore")}</h3>
                        {(["flavor", "nutrition", "dominance", "structure"] as const).map((cat) => {
                          const score = (cs as any)[cat] as number;
                          const barColor = score >= 80 ? catBarColors[cat] : score >= 50 ? "bg-amber-500" : "bg-red-500";
                          return (
                            <div key={cat} className="flex items-center gap-3">
                              <span className={cn("text-xs font-bold w-24 truncate", catColors[cat])}>{catLabels[cat]}</span>
                              <div className="flex-1 h-2.5 rounded-full bg-muted/30 overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all duration-500", barColor)} style={{ width: `${score}%` }} />
                              </div>
                              <span className={cn("text-sm font-black tabular-nums w-10 text-right",
                                score >= 80 ? catColors[cat] : score >= 50 ? "text-amber-500" : "text-red-500"
                              )}>{score}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Severity badges */}
                    <div className="flex items-center justify-center gap-3">
                      {diag.critical_count > 0 && (
                        <Badge variant="destructive" className="gap-1 text-xs px-3 py-1">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          {diag.critical_count} {t("critical")}
                        </Badge>
                      )}
                      {diag.warning_count > 0 && (
                        <Badge className="gap-1 text-xs px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white">
                          <CircleAlert className="h-3.5 w-3.5" />
                          {diag.warning_count} {t("warning")}
                        </Badge>
                      )}
                      {(diag.info_count ?? 0) > 0 && (
                        <Badge className="gap-1 text-xs px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white">
                          <Info className="h-3.5 w-3.5" />
                          {diag.info_count} {t("info") || "Info"}
                        </Badge>
                      )}
                      {diag.issues.length === 0 && (
                        <Badge className="gap-1 text-xs px-3 py-1 bg-green-500 hover:bg-green-600 text-white">
                          ✓ {t("noIssues")}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Issues by category */}
                {Object.entries(grouped).map(([cat, catIssues]) => {
                  const CatIcon = catIcons[cat] || AlertTriangle;
                  const sorted = [...catIssues].sort((a, b) => (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9));
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-3">
                        <CatIcon className={cn("h-5 w-5", catColors[cat] || "text-muted-foreground")} />
                        <h4 className="text-sm font-black uppercase tracking-widest">{catLabels[cat] || cat}</h4>
                        <Badge variant="secondary" className="text-xs">{catIssues.length}</Badge>
                      </div>
                      <div className="grid gap-4">
                        {sorted.map((issue, i) => {
                          const st = sevStyle(issue.severity);
                          const SevIcon = st.IconComp;
                          return (
                            <Card key={i} className={cn("rounded-2xl overflow-hidden", st.border, st.bg)}>
                              {/* Severity color strip */}
                              <div className={cn("h-1", st.barColor)} />
                              <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", st.icon)}>
                                    <SevIcon className={cn("h-5 w-5", st.iconColor)} />
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-3">
                                    {/* Title row */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h5 className="text-sm font-black leading-tight">{tr(issue.title_key)}</h5>
                                      <Badge className={cn("text-[10px] font-black uppercase px-2 py-0.5", st.badge)}>
                                        {sevLabel(issue.severity)}
                                      </Badge>
                                      {issue.impact != null && issue.impact > 0 && (
                                        <Badge className="text-[10px] font-black px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white">
                                          +{issue.impact} pts
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {tr(issue.description_key)}
                                    </p>

                                    {/* Value / Threshold */}
                                    {issue.value != null && (
                                      <div className="flex items-center gap-4 text-xs">
                                        <span className="text-muted-foreground">{t("value")}: <span className="font-bold text-foreground">{typeof issue.value === 'number' ? Number(issue.value).toFixed(1) : issue.value}</span></span>
                                        {issue.threshold != null && (
                                          <span className="text-muted-foreground">{t("threshold")}: <span className="font-bold">{issue.threshold}</span></span>
                                        )}
                                      </div>
                                    )}

                                    {/* Fix suggestions */}
                                    {issue.fix_slugs.length > 0 && (
                                      <div className="pt-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t("fixWith")}</p>
                                        <div className="flex flex-wrap gap-2">
                                          {issue.fix_slugs.map((slug) => {
                                            const alreadyInRecipe = rows.some((r) => r.slug === slug);
                                            const info = slugNames[slug];
                                            const displayName = info?.name || slug;
                                            const imgUrl = info?.image_url;
                                            return (
                                              <Button
                                                key={slug}
                                                variant="outline"
                                                size="sm"
                                                disabled={alreadyInRecipe || loading}
                                                onClick={() => {
                                                  if (alreadyInRecipe || loading) return;
                                                  const fakeS: SuggestionItem = { slug, name: displayName, image_url: imgUrl, score: 0, reasons: [], fills: [] };
                                                  addSuggestionToRecipe(fakeS);
                                                }}
                                                className={cn(
                                                  "gap-2 text-xs font-bold h-10 px-3",
                                                  alreadyInRecipe && "border-green-500/40 text-green-500 bg-green-500/5",
                                                )}
                                              >
                                                {alreadyInRecipe ? (
                                                  <Check className="h-4 w-4" />
                                                ) : imgUrl ? (
                                                  <img src={imgUrl} alt={displayName} className="w-7 h-7 rounded-lg object-cover" />
                                                ) : (
                                                  <Plus className="h-4 w-4" />
                                                )}
                                                {displayName}
                                              </Button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Fix keys (text advice) */}
                                    {issue.fix_keys.length > 0 && (
                                      <p className="text-xs text-primary/80 italic leading-relaxed">
                                        {issue.fix_keys.map((k) => tr(k)).join(". ")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* All clear message */}
                {diag.issues.length === 0 && (
                  <Card className="rounded-2xl border-green-500/20 bg-green-500/[0.03]">
                    <CardContent className="p-8 text-center">
                      <HeartPulse className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <p className="text-base font-bold text-green-600 dark:text-green-400">{t("noIssues")}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })()}

          {/* Suggestions */}
          {resultTab === "suggestions" && (
            <div>
              {result.suggestions.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.suggestions.map((s) => {
                    const alreadyAdded = rows.some((r) => r.slug === s.slug);
                    return (
                    <Card
                      key={s.slug}
                      className={cn(
                        "group rounded-2xl overflow-hidden transition-all cursor-pointer",
                        alreadyAdded
                          ? "ring-2 ring-green-500/50"
                          : "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
                      )}
                      onClick={() => !alreadyAdded && !loading && addSuggestionToRecipe(s)}
                    >
                      <CardContent className="p-0">
                        {/* Hero image — object-cover, aspect-[4/3] */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden">
                          {s.image_url ? (
                            <img
                              src={s.image_url}
                              alt={localizedName(s, locale) || s.name}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-muted/40 to-muted/10 flex items-center justify-center">
                              <Plus className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                          )}

                          {/* Gradient overlay — text readable */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                          {/* Score badge — top right */}
                          <div className="absolute top-2.5 right-2.5 z-10">
                            <Badge className={cn(
                              "text-sm font-black px-2.5 py-1 shadow-lg backdrop-blur-md border-0",
                              s.score >= 60 ? "bg-green-500/90 text-white" : s.score >= 40 ? "bg-amber-500/90 text-white" : "bg-white/20 text-white",
                            )}>
                              {s.score}%
                            </Badge>
                          </div>

                          {/* Add button — hover, top left */}
                          {!alreadyAdded && (
                            <div className="absolute top-2.5 left-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="w-9 h-9 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                <Plus className="h-4 w-4 text-foreground" />
                              </div>
                            </div>
                          )}

                          {/* Added overlay */}
                          {alreadyAdded && (
                            <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[1px] flex items-center justify-center z-10">
                              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-2xl">
                                <Check className="h-7 w-7 text-white" />
                              </div>
                            </div>
                          )}

                          {/* Title over image — bottom */}
                          <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
                            <h4 className="text-sm font-bold text-white leading-snug drop-shadow-lg line-clamp-2">
                              {localizedName(s, locale) || s.name}
                            </h4>
                          </div>
                        </div>

                        {/* Content below image */}
                        <div className="p-3 space-y-1.5">
                          {/* Reasons */}
                          {s.reasons.slice(0, 2).map((r, i) => (
                            <p key={i} className="text-xs text-muted-foreground leading-snug">{localizeReason(r, t)}</p>
                          ))}

                          {/* Fill badges */}
                          {s.fills.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {s.fills.map((f) => (
                                <Badge key={f} variant="outline" className="text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-2 py-0">
                                  + {localizeFill(f, t)}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Already added */}
                          {alreadyAdded && (
                            <p className="text-xs text-green-600 dark:text-green-400 font-bold">✓ {t("addedToRecipe") ?? "Added"}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="rounded-2xl">
                  <CardContent className="text-center py-12 text-muted-foreground">
                    <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">{t("tabs.suggestions")}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODE 2: INGREDIENT EXPLORER
// ══════════════════════════════════════════════════════════════════════════════

function IngredientExplorerMode({ locale, t }: { locale: string; t: any }) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PairingData | null>(null);
  const [popularImages, setPopularImages] = useState<Record<string, string>>({});

  // Load popular ingredient images on mount
  useEffect(() => {
    const slugs = POPULAR_SLUGS.map((p) => p.slug);
    Promise.all(
      slugs.map(async (slug) => {
        try {
          const res = await fetch(`${API_URL}/public/tools/product-search?q=${encodeURIComponent(slug)}&lang=${locale}&limit=1`);
          if (res.ok) {
            const json = await res.json();
            const img = json.results?.[0]?.image_url;
            if (img) return [slug, img] as const;
          }
        } catch { /* ignore */ }
        return null;
      }),
    ).then((results) => {
      const map: Record<string, string> = {};
      results.forEach((r) => { if (r) map[r[0]] = r[1]; });
      setPopularImages(map);
    });
  }, [locale]);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) { setSearchResults([]); return; }
      try {
        const res = await fetch(`${API_URL}/public/tools/product-search?q=${encodeURIComponent(q)}&lang=${locale}&limit=8`);
        if (res.ok) {
          const json = await res.json();
          setSearchResults((json.results || []).map((p: any) => ({ slug: p.slug, name: p.name || p.name_en || p.slug, image_url: p.image_url })));
        }
      } catch { /* ignore */ }
    },
    [locale],
  );

  const loadIngredient = async (slug: string) => {
    setLoading(true); setData(null); setSearchOpen(false); setSearchResults([]);
    try {
      const res = await fetch(`${API_URL}/public/nutrition/${slug}`);
      if (!res.ok) throw new Error("Not found");
      const json: PairingData = await res.json();
      setData(json);
      setQuery(localizedName(json.basic, locale));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); search(e.target.value); }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          placeholder={t("explorer.search")}
          className="pl-10 pr-4 py-3 text-sm rounded-xl"
        />
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-background border border-border/50 rounded-xl shadow-lg max-h-64 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.slug}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => loadIngredient(item.slug)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-muted/40 flex items-center gap-3 transition-colors"
              >
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center text-xs font-bold text-muted-foreground/40">
                    {item.name.charAt(0)}
                  </div>
                )}
                <span className="font-bold">{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular ingredient cards with photos */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-3">{t("popularIngredients")}</p>
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {POPULAR_SLUGS.map((p) => {
            const img = popularImages[p.slug];
            return (
              <button
                key={p.slug}
                onClick={() => loadIngredient(p.slug)}
                className="group flex flex-col items-center gap-2 transition-transform hover:scale-105 active:scale-95"
              >
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-border/40 group-hover:border-primary/40 group-hover:shadow-md transition-all">
                  {img ? (
                    <img src={img} alt={t(`popular.${p.key}`)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-muted/20 flex items-center justify-center">
                      <Apple className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-center leading-tight line-clamp-2">{t(`popular.${p.key}`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-6">
          {/* Header card */}
          <Card className="rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-stretch">
                {data.basic.image_url && (
                  <div className="w-24 sm:w-32 shrink-0 overflow-hidden">
                    <img src={data.basic.image_url} alt={localizedName(data.basic, locale)} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 p-4 flex flex-col justify-center">
                  <h2 className="text-xl font-black tracking-tight">{localizedName(data.basic, locale)}</h2>
                  {data.basic.product_type && (
                    <Badge variant="outline" className="text-xs font-bold mt-1.5 w-fit">{data.basic.product_type}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nutrition per 100g */}
          {data.macros && (
            <Card className="rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-4">
                  {t("nutrition")} {"\u2014"} {t("explorer.per100g")}
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: t("explorer.calories"), value: `${Math.round(data.macros.calories_kcal ?? 0)}`, sub: "kcal", color: "text-orange-500" },
                    { label: t("protein"), value: `${Number(data.macros.protein_g ?? 0).toFixed(1)}`, sub: "g", color: "text-blue-500" },
                    { label: t("fat"), value: `${Number(data.macros.fat_g ?? 0).toFixed(1)}`, sub: "g", color: "text-amber-500" },
                    { label: t("carbs"), value: `${Number(data.macros.carbs_g ?? 0).toFixed(1)}`, sub: "g", color: "text-green-500" },
                  ].map((m) => (
                    <div key={m.label} className="text-center">
                      <div className={cn("text-2xl font-black", m.color)}>{m.value}</div>
                      <div className="text-xs text-muted-foreground">{m.sub}</div>
                      <div className="text-xs font-bold text-muted-foreground mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Culinary / Flavor profile */}
          {data.culinary && (
            <Card className="rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-4">{t("explorer.flavorProfile")}</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {([
                    { key: "sweetness", value: data.culinary.sweetness },
                    { key: "acidity", value: data.culinary.acidity },
                    { key: "bitterness", value: data.culinary.bitterness },
                    { key: "umami", value: data.culinary.umami },
                    { key: "aroma", value: data.culinary.aroma },
                  ] as const).map((d) => (
                    <div key={d.key} className="text-center">
                      <div className="text-2xl font-black">{d.value ?? "\u2014"}</div>
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t(d.key)}</div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-1.5">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${((d.value ?? 0) / 10) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {data.culinary.texture && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    {t("explorer.texture")}: <span className="font-bold text-foreground">{data.culinary.texture}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pairings */}
          {data.pairings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Utensils className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-tight italic">{t("explorer.bestPairings")}</h3>
                <span className="text-[10px] text-muted-foreground ml-auto">{data.pairings.length} {t("matches")}</span>
              </div>
              <PairingGrid pairings={data.pairings} locale={locale} t={t} onSelect={loadIngredient} />
            </div>
          )}

          {data.pairings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Utensils className="h-7 w-7 mx-auto mb-2 opacity-30" />
              <p className="text-xs">{t("explorer.noPairings")}</p>
            </div>
          )}
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <Apple className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{t("explorer.noData")}</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODE 3: UNIT CONVERTER
// ══════════════════════════════════════════════════════════════════════════════

function UnitConverterMode({ locale, t }: { locale: string; t: any }) {
  const [ingredient, setIngredient] = useState<SearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [amount, setAmount] = useState("1");
  const [fromUnit, setFromUnit] = useState("cup");
  const [toUnit, setToUnit] = useState("g");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) { setSearchResults([]); return; }
      try {
        const res = await fetch(`${API_URL}/public/tools/product-search?q=${encodeURIComponent(q)}&lang=${locale}&limit=8`);
        if (res.ok) {
          const json = await res.json();
          setSearchResults((json.results || []).map((p: any) => ({ slug: p.slug, name: p.name || p.name_en || p.slug, image_url: p.image_url })));
        }
      } catch { /* ignore */ }
    },
    [locale],
  );

  const selectIng = (item: SearchResult) => {
    setIngredient(item); setSearchQuery(item.name); setSearchOpen(false); setSearchResults([]); setResult(null);
  };

  const doConvert = useCallback(async () => {
    const numVal = parseFloat(amount.replace(",", "."));
    if (!ingredient || isNaN(numVal) || numVal <= 0) { setResult(null); setError(false); return; }
    setLoading(true); setError(false);
    try {
      const url = `/api/ingredient-convert?ingredient=${encodeURIComponent(ingredient.slug)}&value=${numVal}&from=${encodeURIComponent(fromUnit)}&to=${encodeURIComponent(toUnit)}&lang=${locale}`;
      const res = await fetch(url);
      if (!res.ok) { setError(true); setResult(null); return; }
      const data = await res.json();
      setResult(data); setError(false);
    } catch {
      setError(true); setResult(null);
    } finally {
      setLoading(false);
    }
  }, [ingredient, amount, fromUnit, toUnit, locale]);

  const triggerConvert = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doConvert, 400);
  }, [doConvert]);

  // Trigger on input changes
  const prevDeps = useRef("");
  const currentDeps = `${ingredient?.slug}|${amount}|${fromUnit}|${toUnit}`;
  if (currentDeps !== prevDeps.current) {
    prevDeps.current = currentDeps;
    triggerConvert();
  }

  const applyQuick = (q: (typeof CONVERTER_QUICK)[0]) => {
    const doSearch = async () => {
      try {
        const res = await fetch(`${API_URL}/public/tools/product-search?q=${encodeURIComponent(q.slug)}&lang=${locale}&limit=1`);
        if (res.ok) {
          const json = await res.json();
          const item = (json.results || [])[0];
          if (item) {
            setIngredient({ slug: item.slug, name: item.name || item.name_en || item.slug, image_url: item.image_url });
            setSearchQuery(item.name || item.name_en || item.slug);
          }
        }
      } catch { /* ignore */ }
    };
    setAmount(String(q.amount)); setFromUnit(q.from); setToUnit(q.to); setResult(null);
    doSearch();
  };

  const fmtResult = (n: number) => {
    if (n < 1) return n.toFixed(3).replace(/\.?0+$/, "");
    if (n < 10) return n.toFixed(2).replace(/\.?0+$/, "");
    if (n < 50) return n.toFixed(1).replace(/\.?0+$/, "");
    return String(Math.round(n));
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("converter.subtitle")}</p>

      {/* Quick ingredient chips */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">{t("converter.quickIngredients")}</p>
        <div className="flex flex-wrap gap-2">
          {CONVERTER_QUICK.map((q) => (
            <button
              key={q.slug}
              onClick={() => applyQuick(q)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold border rounded-lg transition-colors",
                ingredient?.slug === q.slug
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 hover:border-primary/40 hover:text-primary",
              )}
            >
              {q.amount} {unitLabel(q.from, locale)} {"\u2192"} {unitLabel(q.to, locale)}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredient search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); search(e.target.value); }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          placeholder={t("converter.searchIngredient")}
          className="w-full pl-10 pr-4 py-3 text-sm bg-background border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-background border border-border/50 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.slug}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectIng(item)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/40 flex items-center gap-3"
              >
                {item.image_url && <img src={item.image_url} alt="" className="w-6 h-6 rounded-full object-cover" />}
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Converter row: amount + from -> to + result */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2 flex-1">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw !== "" && !/^[\d]*[.,]?[\d]*$/.test(raw)) return;
              setAmount(raw); setResult(null);
            }}
            className="h-12 w-20 px-3 text-center font-black text-lg bg-background border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <select
            value={fromUnit}
            onChange={(e) => { setFromUnit(e.target.value); setResult(null); }}
            className="h-12 px-3 rounded-xl border border-border/40 bg-muted/20 font-bold text-sm min-w-[80px] focus:outline-none"
          >
            {FROM_UNITS.map((u) => (
              <option key={u} value={u}>{unitLabel(u, locale)}</option>
            ))}
          </select>
        </div>

        <ArrowRight className="h-4 w-4 text-muted-foreground/40 rotate-90 sm:rotate-0 mx-auto sm:mx-0 shrink-0" />

        <div className="flex gap-2 flex-1">
          <select
            value={toUnit}
            onChange={(e) => { setToUnit(e.target.value); setResult(null); }}
            className="h-12 px-3 rounded-xl border border-border/40 bg-muted/20 font-bold text-sm min-w-[80px] focus:outline-none"
          >
            {TO_UNITS.map((u) => (
              <option key={u} value={u}>{unitLabel(u, locale)}</option>
            ))}
          </select>
          <div
            className={cn(
              "h-12 flex-1 px-4 rounded-xl border flex items-center transition-colors min-w-[100px]",
              error ? "border-orange-400/40 bg-orange-500/5"
                : loading ? "border-border/40 bg-muted/10"
                : result ? "border-primary/40 bg-primary/5"
                : "border-border/30 bg-muted/5",
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : !ingredient ? (
              <span className="text-[10px] text-muted-foreground/40 font-bold uppercase">{t("converter.selectIngredient")}</span>
            ) : error ? (
              <span className="text-[10px] text-orange-500 font-bold">{t("converter.noDensity")}</span>
            ) : result ? (
              <span className="font-black text-lg text-primary">
                {fmtResult(result.result)}{" "}
                <span className="text-xs text-primary/70">{unitLabel(toUnit, locale)}</span>
              </span>
            ) : (
              <span className="font-black text-lg text-muted-foreground/20">{"\u2014"}</span>
            )}
          </div>
        </div>
      </div>

      {/* Result detail */}
      {result && ingredient && (
        <div className="space-y-3 pt-1">
          <p className="text-sm text-muted-foreground">
            {amount} {unitLabel(fromUnit, locale)}{" "}
            <span className="text-foreground font-black">{ingredient.name}</span>
            {" = "}
            <span className="text-primary font-black">{fmtResult(result.result)} {unitLabel(toUnit, locale)}</span>
          </p>
          {result.density_g_per_ml && (
            <p className="text-[10px] text-muted-foreground/60">
              {t("converter.density")}: <span className="font-black text-foreground">{result.density_g_per_ml.toFixed(2)} g/ml</span>
            </p>
          )}
          {result.nutrition_for_result && (
            <div className="grid grid-cols-4 gap-3 border border-border/30 rounded-xl p-3">
              {[
                { label: "kcal", value: Math.round(result.nutrition_for_result.calories), color: "text-orange-500" },
                { label: t("protein"), value: `${result.nutrition_for_result.protein}g`, color: "text-blue-500" },
                { label: t("fat"), value: `${result.nutrition_for_result.fat}g`, color: "text-amber-500" },
                { label: t("carbs"), value: `${result.nutrition_for_result.carbs}g`, color: "text-green-500" },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <div className={`text-sm font-black ${m.color}`}>{m.value}</div>
                  <div className="text-[9px] text-muted-foreground">{m.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODE 4: FLAVOR PAIRING
// ══════════════════════════════════════════════════════════════════════════════

function FlavorPairingMode({ locale, t }: { locale: string; t: any }) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PairingData | null>(null);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) { setSearchResults([]); return; }
      try {
        const res = await fetch(`${API_URL}/public/tools/product-search?q=${encodeURIComponent(q)}&lang=${locale}&limit=8`);
        if (res.ok) {
          const json = await res.json();
          setSearchResults((json.results || []).map((p: any) => ({ slug: p.slug, name: p.name || p.name_en || p.slug, image_url: p.image_url })));
        }
      } catch { /* ignore */ }
    },
    [locale],
  );

  const loadPairings = async (slug: string) => {
    setLoading(true); setData(null); setSearchOpen(false); setSearchResults([]);
    try {
      const res = await fetch(`${API_URL}/public/nutrition/${slug}`);
      if (!res.ok) throw new Error("Not found");
      const json: PairingData = await res.json();
      setData(json);
      setQuery(localizedName(json.basic, locale));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); search(e.target.value); }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-10 pr-4 py-3 text-sm bg-background border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-background border border-border/50 rounded-xl shadow-lg max-h-56 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.slug}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => loadPairings(item.slug)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/40 flex items-center gap-3"
              >
                {item.image_url && <img src={item.image_url} alt="" className="w-6 h-6 rounded-full object-cover" />}
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular chips */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">{t("popularIngredients")}</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SLUGS.map((p) => (
            <button
              key={p.slug}
              onClick={() => loadPairings(p.slug)}
              className="px-3 py-1.5 text-xs font-bold border border-border/50 rounded-lg hover:border-primary/40 hover:text-primary transition-colors"
            >
              {t(`popular.${p.key}`)}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 p-4 border border-border/40 rounded-2xl bg-muted/10">
            {data.basic.image_url && (
              <img src={data.basic.image_url} alt={localizedName(data.basic, locale)} className="w-14 h-14 rounded-xl object-cover" />
            )}
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">{localizedName(data.basic, locale)}</h2>
              {data.macros && (
                <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                  <span>{Math.round(data.macros.calories_kcal ?? 0)} kcal</span>
                  <span>P: {Number(data.macros.protein_g ?? 0).toFixed(1)}g</span>
                  <span>F: {Number(data.macros.fat_g ?? 0).toFixed(1)}g</span>
                  <span>C: {Number(data.macros.carbs_g ?? 0).toFixed(1)}g</span>
                </div>
              )}
            </div>
          </div>

          {/* Culinary bars */}
          {data.culinary && (
            <div className="border border-border/40 rounded-2xl p-5">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {([
                  { key: "sweetness", value: data.culinary.sweetness },
                  { key: "acidity", value: data.culinary.acidity },
                  { key: "bitterness", value: data.culinary.bitterness },
                  { key: "umami", value: data.culinary.umami },
                  { key: "aroma", value: data.culinary.aroma },
                ] as const).map((d) => (
                  <div key={d.key} className="text-center">
                    <div className="text-2xl font-black">{d.value ?? "\u2014"}</div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t(d.key)}</div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${((d.value ?? 0) / 10) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pairings grid */}
          {data.pairings.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Utensils className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-tight italic">
                  {t("bestPairings")} {localizedName(data.basic, locale)}
                </h3>
                <span className="text-[10px] text-muted-foreground ml-auto">{data.pairings.length} {t("matches")}</span>
              </div>
              <PairingGrid pairings={data.pairings} locale={locale} t={t} onSelect={loadPairings} />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Utensils className="h-7 w-7 mx-auto mb-2 opacity-30" />
              <p className="text-xs">{t("noPairings")}</p>
            </div>
          )}
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <Utensils className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{t("clickIngredient")}</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED: PAIRING GRID
// ══════════════════════════════════════════════════════════════════════════════

function PairingGrid({
  pairings,
  locale,
  t,
  onSelect,
}: {
  pairings: Pairing[];
  locale: string;
  t: any;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {pairings.map((p, idx) => {
        const score = p.pair_score ?? 0;
        const barColor = score >= 8 ? "bg-green-500" : score >= 6 ? "bg-amber-500" : "bg-muted-foreground/40";
        return (
          <Card
            key={p.slug}
            onClick={() => onSelect(p.slug)}
            className={cn(
              "group rounded-2xl overflow-hidden cursor-pointer transition-all",
              idx === 0
                ? "ring-2 ring-primary/30 shadow-lg shadow-primary/5"
                : "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
            )}
          >
            <CardContent className="p-0">
              {/* Hero image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={localizedName(p, locale)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-muted/40 to-muted/10 flex items-center justify-center">
                    <Utensils className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Score badge — top right */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <Badge className={cn(
                    "text-sm font-black px-2.5 py-1 shadow-lg backdrop-blur-md border-0",
                    score >= 8 ? "bg-green-500/90 text-white" : score >= 6 ? "bg-amber-500/90 text-white" : "bg-white/20 text-white",
                  )}>
                    {score.toFixed(1)}
                  </Badge>
                </div>

                {/* Best match crown — first card */}
                {idx === 0 && (
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <Badge className="bg-amber-500/90 text-white border-0 shadow-lg backdrop-blur-md text-xs font-black px-2 py-0.5 gap-1">
                      <Star className="h-3 w-3 fill-white" />
                      #1
                    </Badge>
                  </div>
                )}

                {/* Name over image — bottom */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
                  <h4 className="text-sm font-bold text-white leading-snug drop-shadow-lg line-clamp-2">
                    {localizedName(p, locale)}
                  </h4>
                  <span className="text-xs text-amber-300 font-bold drop-shadow">{scoreStars(score)}</span>
                </div>
              </div>

              {/* Sub-scores below image */}
              <div className="p-3 space-y-2">
                {/* Score bar */}
                <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-500", barColor)} style={{ width: `${(score / 10) * 100}%` }} />
                </div>

                {/* Three scores */}
                <div className="grid grid-cols-3 gap-1 text-center">
                  {[
                    { label: t("flavorScore"), value: p.flavor_score, color: "text-pink-500" },
                    { label: t("nutritionScore"), value: p.nutrition_score, color: "text-blue-500" },
                    { label: t("culinaryScore"), value: p.culinary_score, color: "text-emerald-500" },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className={cn("text-sm font-black tabular-nums", s.color)}>{s.value?.toFixed(1) ?? "—"}</div>
                      <div className="text-[10px] text-muted-foreground font-bold leading-tight truncate">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED: NUTRITION TAB
// ══════════════════════════════════════════════════════════════════════════════

function NutritionTab({ result, locale, t, dietLabels }: { result: AnalyzeResponse; locale: string; t: any; dietLabels: Record<string, string> }) {
  const display = result.per_portion || result.nutrition;
  const label = result.per_portion ? t("perPortion", { portions: result.portions }) : t("total");
  const scoreVal = result.score;
  const scoreColor = scoreVal >= 70 ? "text-green-500" : scoreVal >= 40 ? "text-amber-500" : "text-red-500";
  const ringColor = scoreVal >= 70 ? "stroke-green-500" : scoreVal >= 40 ? "stroke-amber-500" : "stroke-red-500";
  const ringBg = scoreVal >= 70 ? "stroke-green-500/15" : scoreVal >= 40 ? "stroke-amber-500/15" : "stroke-red-500/15";
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (scoreVal / 100) * circumference;

  const macros = [
    { label: t("protein"), value: display.protein, pct: result.macros.protein_pct, color: "bg-blue-500", textColor: "text-blue-500", ring: "stroke-blue-500" },
    { label: t("fat"), value: display.fat, pct: result.macros.fat_pct, color: "bg-amber-500", textColor: "text-amber-500", ring: "stroke-amber-500" },
    { label: t("carbs"), value: display.carbs, pct: result.macros.carbs_pct, color: "bg-green-500", textColor: "text-green-500", ring: "stroke-green-500" },
  ];

  return (
    <div className="space-y-4">
      {/* Hero: Score ring + Calories */}
      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{t("nutrition")}</span>
          </div>

          <div className="flex items-center gap-6 mt-4">
            {/* Score ring */}
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="7" className={ringBg} />
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="7" strokeLinecap="round" className={ringColor}
                  strokeDasharray={circumference} strokeDashoffset={offset}
                  style={{ transition: "stroke-dashoffset 0.8s ease" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-3xl font-black tabular-nums", scoreColor)}>{scoreVal}</span>
                <span className="text-[10px] text-muted-foreground font-bold">/100</span>
              </div>
            </div>

            {/* Calories + label */}
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tighter tabular-nums">{Math.round(display.calories)}</span>
                <span className="text-lg text-muted-foreground font-bold">kcal</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macros: 3 cards */}
      <div className="grid grid-cols-3 gap-3">
        {macros.map((m) => {
          const miniR = 24;
          const miniC = 2 * Math.PI * miniR;
          const miniOff = miniC - (Math.min(m.pct, 100) / 100) * miniC;
          return (
            <Card key={m.label} className="rounded-2xl overflow-hidden">
              <CardContent className="p-4 flex flex-col items-center text-center">
                {/* Mini ring */}
                <div className="relative w-16 h-16 mb-2">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r={miniR} fill="none" strokeWidth="4" className="stroke-muted/20" />
                    <circle cx="28" cy="28" r={miniR} fill="none" strokeWidth="4" strokeLinecap="round" className={m.ring}
                      strokeDasharray={miniC} strokeDashoffset={miniOff}
                      style={{ transition: "stroke-dashoffset 0.6s ease" }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn("text-sm font-black tabular-nums", m.textColor)}>{m.pct.toFixed(0)}%</span>
                  </div>
                </div>
                <span className="text-xl font-black tabular-nums">{Math.round(m.value)}<span className="text-sm text-muted-foreground font-bold">{unitLabel("g", locale)}</span></span>
                <span className="text-xs text-muted-foreground font-bold mt-0.5">{m.label}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Fiber + Sugar */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: t("fiber"), value: display.fiber, Icon: Leaf, color: "text-green-500", bg: "bg-green-500/10" },
          { label: t("sugar"), value: display.sugar, Icon: Candy, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((item) => (
          <Card key={item.label} className="rounded-2xl overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", item.bg)}>
                  <item.Icon className={cn("h-5 w-5", item.color)} />
                </div>
                <span className="text-sm font-bold text-muted-foreground">{item.label}</span>
              </div>
              <span className="text-lg font-black tabular-nums">{item.value.toFixed(1)}<span className="text-sm text-muted-foreground font-bold">{unitLabel("g", locale)}</span></span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diet badges */}
      {result.diet.length > 0 && (
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {result.diet.map((d) => (
                <Badge key={d} variant="outline" className="text-xs font-bold bg-primary/10 text-primary border-primary/20 px-3 py-1">
                  {dietLabels[d] || d}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED: FLAVOR RADAR CHART
// ══════════════════════════════════════════════════════════════════════════════

function FlavorRadarCard({ flavor, t }: { flavor: FlavorSummary; t: any }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const data = [
    { dimension: t("sweetness"), value: flavor.sweetness, fullMark: 10 },
    { dimension: t("acidity"), value: flavor.acidity, fullMark: 10 },
    { dimension: t("umami"), value: flavor.umami, fullMark: 10 },
    { dimension: t("fatDimension"), value: flavor.fat, fullMark: 10 },
    { dimension: t("aroma"), value: flavor.aroma, fullMark: 10 },
    { dimension: t("bitterness"), value: flavor.bitterness, fullMark: 10 },
  ];

  const dimensionLabels: Record<string, string> = {
    sweetness: t("sweetness"),
    acidity: t("acidity"),
    bitterness: t("bitterness"),
    umami: t("umami"),
    fat: t("fatDimension"),
    aroma: t("aroma"),
  };

  const bs = flavor.balance_score;
  const scoreColor = bs >= 70 ? "#22c55e" : bs >= 40 ? "#f59e0b" : "#ef4444";
  const scoreLabel = bs >= 70 ? t("balanced") || "Balanced" : bs >= 40 ? t("moderate") || "Moderate" : t("imbalanced") || "Imbalanced";

  // Theme-aware colors
  const gridStroke = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const labelColor = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)";
  const radarStroke = isDark ? "#a78bfa" : "#7c3aed";
  const radarFill = isDark ? "#a78bfa" : "#7c3aed";
  const radarFillOpacity = isDark ? 0.15 : 0.1;
  const tooltipBg = isDark ? "#1e1b2e" : "#ffffff";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const dotFill = isDark ? "#c4b5fd" : "#7c3aed";

  // SVG circular progress for balance score
  const circleR = 28;
  const circleC = 2 * Math.PI * circleR;
  const circleOffset = circleC - (circleC * bs) / 100;

  return (
    <Card className="rounded-2xl backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDark ? "bg-violet-500/15" : "bg-violet-50")}>
            <Sparkles className="w-4 h-4 text-violet-500" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            {t("flavorProfile")}
          </span>
        </div>

        {/* Circular balance indicator */}
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r={circleR} fill="none" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"} strokeWidth="4" />
              <circle
                cx="32" cy="32" r={circleR} fill="none"
                stroke={scoreColor} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circleC} strokeDashoffset={circleOffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-black leading-none" style={{ color: scoreColor }}>{bs}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground">{t("balance")}</span>
            <span className="text-[10px] font-bold" style={{ color: scoreColor }}>{scoreLabel}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Radar Chart */}
        <div className="w-full h-[280px] relative">
          <div className={cn(
            "absolute inset-0 m-auto w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none",
            isDark ? "bg-violet-500" : "bg-violet-300",
          )} />
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
              <PolarGrid stroke={gridStroke} strokeWidth={1} />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: labelColor, fontSize: 11, fontWeight: 800 }}
                tickLine={false}
              />
              <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
              <Radar
                name="Flavor"
                dataKey="value"
                stroke={radarStroke}
                fill={radarFill}
                fillOpacity={radarFillOpacity}
                strokeWidth={2.5}
                dot={{ r: 4, fill: dotFill, strokeWidth: 0 }}
                animationDuration={800}
                animationEasing="ease-out"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "8px 14px",
                  boxShadow: isDark
                    ? "0 8px 32px rgba(0,0,0,0.5)"
                    : "0 8px 32px rgba(0,0,0,0.08)",
                }}
                itemStyle={{ color: radarStroke }}
                formatter={(value: any) => [Number(value).toFixed(1) + " / 10", ""]}
                labelStyle={{ fontWeight: 800, marginBottom: 2, color: labelColor }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Dimension values with Progress bars */}
        <div className="grid grid-cols-3 gap-2">
          {data.map((d) => {
            const pct = (d.value / 10) * 100;
            const barColor = d.value >= 7 ? "bg-green-500" : d.value >= 4 ? "bg-violet-500" : "bg-amber-500";
            const textColor = d.value >= 7 ? "text-green-500" : d.value >= 4 ? "text-violet-500" : "text-amber-500";
            return (
              <Card key={d.dimension} className="p-2.5 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold truncate text-muted-foreground">{d.dimension}</span>
                  <span className={cn("text-[11px] font-black tabular-nums", textColor)}>{d.value.toFixed(1)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700 ease-out", barColor)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Weak / Strong badges */}
        {(flavor.weak.length > 0 || flavor.strong.length > 0) && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-1.5">
              {flavor.weak.map((d) => (
                <Badge key={d} variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                  ↓ {dimensionLabels[d] || d}
                </Badge>
              ))}
              {flavor.strong.map((d) => (
                <Badge key={d} variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  ↑ {dimensionLabels[d] || d}
                </Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
