"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Trash2,
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
import type { SmartResponse, NextAction, SuggestionInfo, DiagnosticIssue, FlavorDimension } from "@/types/smart";
import { fetchSmartFromText, resetSmartSession, type SmartContext } from "@/lib/smart-api";
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

// ── 6D Context chips ─────────────────────────────────────────────────────────

const GOAL_CHIPS: { key: string; icon: string }[] = [
  { key: "balanced",     icon: "⚖️" },
  { key: "high_protein", icon: "💪" },
  { key: "low_calorie",  icon: "🥗" },
  { key: "keto",         icon: "🥑" },
  { key: "flavor_boost", icon: "🔥" },
];

const MEAL_CHIPS: { key: string; icon: string }[] = [
  { key: "breakfast", icon: "🌅" },
  { key: "lunch",     icon: "☀️" },
  { key: "dinner",    icon: "🌙" },
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
  recipeAnalyzer: Sparkles,
  ingredientExplorer: Apple,
  unitConverter: Scale,
  flavorPairing: Utensils,
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

const MISSING_LOCALIZATIONS: Record<string, Record<string, string>> = {
  "bacon": { ru: "Бекон", pl: "Boczek", uk: "Бекон" },
  "black-pepper": { ru: "Чёрный перец", pl: "Czarny pieprz", uk: "Чорний перець" },
  "butter": { ru: "Сливочное масло", pl: "Masło", uk: "Вершкове масло" },
  "hard-cheese": { ru: "Твёрдый сыр", pl: "Twardy ser", uk: "Твердий сир" },
  "mozzarella-cheese": { ru: "Моцарелла", pl: "Mozzarella", uk: "Моцарела" }
};

function localizedName(
  item: { name_en?: string; name_ru?: string; name_pl?: string; name_uk?: string; slug?: string },
  locale: string,
): string {
  const map: Record<string, string | undefined> = { en: item.name_en, ru: item.name_ru, pl: item.name_pl, uk: item.name_uk };
  if (map[locale]) return map[locale]!;
  if (item.slug && MISSING_LOCALIZATIONS[item.slug]?.[locale]) {
    return MISSING_LOCALIZATIONS[item.slug][locale];
  }
  return item.name_en || item.slug || "";
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
// MODE 1: RECIPE BUILDER ENGINE
// ══════════════════════════════════════════════════════════════════════════════

type IngredientChip = {
  slug: string;
  name: string;
  image_url?: string;
  grams?: number;
};

/** Animated number hook — smooth transitions on score changes */
function useAnimatedNumber(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    const diff = target - from;
    if (diff === 0) return;
    prev.current = target;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = Math.min((now - start) / duration, 1);
      const ease = 1 - (1 - elapsed) * (1 - elapsed);
      setDisplay(Math.round(from + diff * ease));
      if (elapsed < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

/** Collapsible section with icon, title, and toggle */
function CollapsibleDetail({
  title, icon: Icon, iconColor, defaultOpen = false, count, children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border/50 bg-background overflow-hidden transition-all">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className={cn("h-4 w-4", iconColor ?? "text-primary")} />
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">{title}</span>
          {count != null && count > 0 && (
            <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-primary/10 text-primary">{count}</span>
          )}
        </div>
        <svg className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-1 duration-200">{children}</div>}
    </div>
  );
}

/** Loading skeleton for re-analysis */
function AnalysisSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-muted/40" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-muted/40 rounded-lg" />
          <div className="h-3 w-1/2 bg-muted/30 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0,1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-muted/30" />)}
      </div>
      <div className="h-24 rounded-2xl bg-muted/20" />
    </div>
  );
}

function RecipeAnalyzerMode({ locale, t }: { locale: string; t: any }) {
  // ── URL state sync ────────────────────────────────────────────────────
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ── State: chips are source of truth ──────────────────────────────────
  const [inputText, setInputText] = useState("");
  const [chips, setChips] = useState<IngredientChip[]>([]);
  const [smartResult, setSmartResult] = useState<SmartResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);

  // 6D context chips (MVP: goal + meal_type)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(
    searchParams.get("goal") || null,
  );
  const [selectedMeal, setSelectedMeal] = useState<string | null>(
    searchParams.get("meal") || null,
  );

  // Details open state
  const [detailsOpen, setDetailsOpen] = useState({
    nutrition: true,
    flavor: false,
    influence: false,
    diagnosis: false,
    ingredients: false,
  });

  // Legacy state for manual input mode
  const [rows, setRows] = useState<IngredientRow[]>([{ slug: "", name: "", grams: 100 }]);
  const [portions, setPortions] = useState<number | "">(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);
  const [legacyResult, setLegacyResult] = useState<AnalyzeResponse | null>(null);
  const [resultTab, setResultTab] = useState<"ingredients" | "nutrition" | "flavor" | "influence" | "doctor" | "suggestions">("nutrition");
  const [slugNames, setSlugNames] = useState<Record<string, { name: string; image_url?: string }>>({});

  // Score animation
  const balanceScore = smartResult?.flavor_profile?.balance?.balance_score ?? 0;
  const animatedScore = useAnimatedNumber(balanceScore);
  const prevScore = useRef(balanceScore);
  const [feedback, setFeedback] = useState<"improved" | "declined" | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prevScore.current !== 0 && balanceScore !== prevScore.current) {
      setFeedback(balanceScore > prevScore.current ? "improved" : "declined");
      const timer = setTimeout(() => setFeedback(null), 2200);
      prevScore.current = balanceScore;
      return () => clearTimeout(timer);
    }
    prevScore.current = balanceScore;
  }, [balanceScore]);

  // ── Draft persistence ─────────────────────────────────────────────────
  const didRestore = useRef(false);
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.chips && draft.chips.length > 0) {
        setChips(draft.chips);
        if (draft.inputText) setInputText(draft.inputText);
      }
      if (draft.selectedGoal) setSelectedGoal(draft.selectedGoal);
      if (draft.selectedMeal) setSelectedMeal(draft.selectedMeal);
    } catch { /* corrupted */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        chips,
        inputText,
        smartResult,
        selectedGoal,
        selectedMeal,
      }));
    } catch { /* quota */ }
  }, [chips, inputText, smartResult, selectedGoal, selectedMeal]);

  // ── URL → state (on mount): read ?q=salmon,rice&goal=keto&meal=dinner ─
  const didReadUrl = useRef(false);
  useEffect(() => {
    if (didReadUrl.current) return;
    didReadUrl.current = true;

    const qParam = searchParams.get("q");
    const goalParam = searchParams.get("goal");
    const mealParam = searchParams.get("meal");

    // URL params take priority over localStorage draft
    if (goalParam) setSelectedGoal(goalParam);
    if (mealParam) setSelectedMeal(mealParam);

    if (qParam && qParam.trim().length > 0) {
      // Convert "salmon,rice,avocado" → "salmon rice avocado" for the text analyzer
      const text = qParam.replace(/,/g, " ").trim();
      setInputText(text);
      // Auto-analyze on mount if URL has ingredients
      const ctx: SmartContext = {};
      if (goalParam) ctx.goal = goalParam;
      if (mealParam) ctx.meal_type = mealParam;
      fetchSmartFromText(text, locale, Object.keys(ctx).length > 0 ? ctx : undefined)
        .then(({ smart, ingredients }) => {
          setSmartResult(smart);
          setChips(ingredients.map(r => ({
            slug: r.slug, name: r.name, image_url: r.image_url ?? undefined,
          })));
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── State → URL (on change): update browser address bar silently ──────
  const updateUrl = useCallback((
    newChips: IngredientChip[],
    newGoal: string | null,
    newMeal: string | null,
  ) => {
    const params = new URLSearchParams();
    if (newChips.length > 0) {
      params.set("q", newChips.map(c => c.slug).join(","));
    }
    if (newGoal) params.set("goal", newGoal);
    if (newMeal) params.set("meal", newMeal);
    const qs = params.toString();
    const newUrl = qs ? `${pathname}?${qs}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [pathname, router]);

  // Sync URL whenever chips/goal/meal change (debounced via effect)
  const urlSyncRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    // Skip during initial URL→state load
    if (!didReadUrl.current) return;
    clearTimeout(urlSyncRef.current);
    urlSyncRef.current = setTimeout(() => {
      updateUrl(chips, selectedGoal, selectedMeal);
    }, 300);
    return () => clearTimeout(urlSyncRef.current);
  }, [chips, selectedGoal, selectedMeal, updateUrl]);

  // ── Smart API: analyze from text ──────────────────────────────────────
  /** Build 6D context from current UI state */
  const buildContext = (): SmartContext | undefined => {
    const ctx: SmartContext = {};
    if (selectedGoal) ctx.goal = selectedGoal;
    if (selectedMeal) ctx.meal_type = selectedMeal;
    return Object.keys(ctx).length > 0 ? ctx : undefined;
  };

  const analyzeFromText = async (text?: string) => {
    const t_text = text ?? inputText;
    if (!t_text.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const { smart: result, ingredients: resolved } = await fetchSmartFromText(t_text, locale, buildContext());
      setSmartResult(result);

      // Build chips from resolved ingredients
      const newChips: IngredientChip[] = resolved.map((r) => ({
        slug: r.slug,
        name: r.name,
        image_url: r.image_url ?? undefined,
      }));
      setChips(newChips);

      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: any) {
      setError(err.message || "Failed to analyze");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Re-analyze with updated chips ─────────────────────────────────────
  const reanalyzeWithChips = async (updatedChips: IngredientChip[]) => {
    if (updatedChips.length === 0) {
      setSmartResult(null);
      setChips([]);
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      // Build text from chip names for from-text re-analysis
      const text = updatedChips.map(c => c.name || c.slug).join(" ");
      const { smart: result } = await fetchSmartFromText(text, locale, buildContext());
      setSmartResult(result);
      setInputText(text);
    } catch (err: any) {
      setError(err.message || "Failed to re-analyze");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Add ingredient from next_actions / suggestions ────────────────────
  const addIngredientAction = async (slug: string, name: string, image_url?: string | null) => {
    if (chips.some(c => c.slug === slug)) return;
    const newChip: IngredientChip = { slug, name, image_url: image_url ?? undefined };
    const updatedChips = [...chips, newChip];
    setChips(updatedChips);
    await reanalyzeWithChips(updatedChips);
  };

  // ── Remove chip ───────────────────────────────────────────────────────
  const removeChip = async (slug: string) => {
    const updatedChips = chips.filter(c => c.slug !== slug);
    setChips(updatedChips);
    if (updatedChips.length > 0) {
      await reanalyzeWithChips(updatedChips);
    } else {
      setSmartResult(null);
    }
  };

  // ── Clear all ─────────────────────────────────────────────────────────
  const clearRecipe = () => {
    setChips([]);
    setInputText("");
    setSmartResult(null);
    setError(null);
    setSelectedGoal(null);
    setSelectedMeal(null);
    resetSmartSession();
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  // ── Quick recipes ─────────────────────────────────────────────────────
  const loadQuickRecipe = async (recipe: typeof QUICK_RECIPES[0]) => {
    const text = recipe.ingredients.map(i => i.slug.replace(/-/g, " ")).join(" ");
    setInputText(text);
    await analyzeFromText(text);
  };

  // ── Search for manual add ─────────────────────────────────────────────
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [addSearchResults, setAddSearchResults] = useState<SearchResult[]>([]);
  const [addSearchOpen, setAddSearchOpen] = useState(false);

  const searchForAdd = useCallback(async (query: string) => {
    if (query.length < 2) { setAddSearchResults([]); return; }
    try {
      const res = await fetch(`${API_URL}/public/tools/product-search?q=${encodeURIComponent(query)}&lang=${locale}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setAddSearchResults((data.results || []).map((p: any) => ({
          slug: p.slug, name: p.name || p.slug, image_url: p.image_url,
        })));
      }
    } catch { /* ignore */ }
  }, [locale]);

  // ── Share recipe logic ────────────────────────────────────────────────
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareRecipe = () => {
    if (chips.length === 0) return;
    // Build lightweight shareable URL with query params (no server round-trip)
    const params = new URLSearchParams();
    params.set("q", chips.map(c => c.slug).join(","));
    if (selectedGoal) params.set("goal", selectedGoal);
    if (selectedMeal) params.set("meal", selectedMeal);
    const url = `https://dima-fomin.pl/${locale}/chef-tools/lab?${params.toString()}`;
    setShareUrl(url);
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  // ── Derived data from SmartResponse ───────────────────────────────────
  const flavor = smartResult?.flavor_profile;
  const diagnostics = smartResult?.diagnostics;
  const nextActions = smartResult?.next_actions ?? [];
  const suggestions = smartResult?.suggestions ?? [];
  const confidence = smartResult?.confidence;
  const addedSlugs = new Set(chips.map(c => c.slug));

  // Priority: next_actions first, then suggestions as fallback
  const filteredActions = nextActions.filter(a => !addedSlugs.has(a.ingredient));
  const filteredSuggestions = suggestions.filter(s => !addedSlugs.has(s.slug));
  const hasActions = filteredActions.length > 0 || filteredSuggestions.length > 0;

  // Build a name lookup from suggestions
  const nameMap = new Map<string, { name: string; image_url?: string }>();
  for (const s of suggestions) nameMap.set(s.slug, { name: s.name, image_url: s.image_url ?? undefined });

  const actionName = (a: NextAction) => a.name || nameMap.get(a.ingredient)?.name || a.ingredient.replace(/-/g, " ");
  const actionImage = (a: NextAction) => nameMap.get(a.ingredient)?.image_url;

  // Score helpers
  const scoreColor = (v: number) => v >= 70 ? "text-emerald-500" : v >= 40 ? "text-amber-500" : "text-rose-500";
  const ringStroke = (v: number) => v >= 70 ? "#10b981" : v >= 40 ? "#f59e0b" : "#ef4444";
  const barGradient = (v: number) => v >= 70 ? "from-emerald-400 to-emerald-500" : v >= 40 ? "from-amber-400 to-amber-500" : "from-rose-400 to-rose-500";

  // Nutrition from SmartResponse
  const nutrition = smartResult?.nutrition;

  // Map legacy AnalyzeResponse for NutritionTab / FlavorRadarCard
  const legacyAnalyzeResult: AnalyzeResponse | null = smartResult ? {
    nutrition: {
      calories: nutrition?.calories ?? 0,
      protein: nutrition?.protein_g ?? 0,
      fat: nutrition?.fat_g ?? 0,
      carbs: nutrition?.carbs_g ?? 0,
      fiber: nutrition?.fiber_g ?? 0,
      sugar: nutrition?.sugar_g ?? 0,
    },
    portions: 1,
    macros: (() => {
      const p = nutrition?.protein_g ?? 0;
      const f = nutrition?.fat_g ?? 0;
      const c = nutrition?.carbs_g ?? 0;
      const total = p + f + c || 1;
      return {
        protein_pct: Math.round((p / total) * 100),
        fat_pct: Math.round((f / total) * 100),
        carbs_pct: Math.round((c / total) * 100),
      };
    })(),
    score: balanceScore,
    flavor: {
      sweetness: flavor?.vector?.sweetness ?? 0,
      acidity: flavor?.vector?.acidity ?? 0,
      bitterness: flavor?.vector?.bitterness ?? 0,
      umami: flavor?.vector?.umami ?? 0,
      fat: flavor?.vector?.fat ?? 0,
      aroma: flavor?.vector?.aroma ?? 0,
      balance_score: balanceScore,
      weak: (flavor?.balance?.weak_dimensions ?? []).map(d => d.dimension),
      strong: (flavor?.balance?.strong_dimensions ?? []).map(d => d.dimension),
    },
    diet: [],
    suggestions: [],
    ingredients: [],
  } : null;

  const dietLabels: Record<string, string> = {
    vegan: "🌱 Vegan", vegetarian: "🥚 Vegetarian", keto: "🥑 Keto",
    paleo: "🦴 Paleo", gluten_free: "🌾 GF", mediterranean: "🫓 Med", low_carb: "📉 LC",
  };

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════════════
          LEVEL 1 — INPUT
          ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Big text input */}
        <div className="relative">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  analyzeFromText();
                }
              }}
              placeholder={t("inputPlaceholderBig") || "salmon rice avocado..."}
              rows={2}
              className={cn(
                "w-full px-5 py-4 pr-14 text-base sm:text-lg font-medium bg-background",
                "border-2 border-border/50 rounded-2xl resize-none",
                "placeholder:text-muted-foreground/40 placeholder:font-normal",
                "focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10",
                "transition-all duration-200",
              )}
            />
            <Button
              onClick={() => analyzeFromText()}
              disabled={isAnalyzing || !inputText.trim()}
              size="icon"
              className="absolute right-3 bottom-3 h-10 w-10 rounded-xl shadow-lg shadow-primary/20"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-1.5 px-1">
            {t("inputHint") || 'e.g. "salmon rice avocado" or "лосось рис авокадо"'}
          </p>
        </div>

        {/* 6D Context chips: goal + meal_type */}
        <div className="space-y-2.5">
          {/* Goal chips */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5">
              {t("contextGoal") || "Goal"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {GOAL_CHIPS.map(({ key, icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedGoal(selectedGoal === key ? null : key);
                    // Re-analyze if we already have chips
                    if (chips.length > 0) {
                      const newGoal = selectedGoal === key ? null : key;
                      const text = chips.map(c => c.name || c.slug).join(" ");
                      const ctx: SmartContext = {};
                      if (newGoal) ctx.goal = newGoal;
                      if (selectedMeal) ctx.meal_type = selectedMeal;
                      fetchSmartFromText(text, locale, Object.keys(ctx).length > 0 ? ctx : undefined)
                        .then(({ smart }) => setSmartResult(smart))
                        .catch(() => {});
                    }
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold",
                    "border transition-all duration-150",
                    selectedGoal === key
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                      : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50 hover:border-border",
                  )}
                >
                  <span>{icon}</span>
                  <span>{t(`goal.${key}`) || key}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Meal type chips */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5">
              {t("contextMeal") || "Meal"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MEAL_CHIPS.map(({ key, icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedMeal(selectedMeal === key ? null : key);
                    if (chips.length > 0) {
                      const newMeal = selectedMeal === key ? null : key;
                      const text = chips.map(c => c.name || c.slug).join(" ");
                      const ctx: SmartContext = {};
                      if (selectedGoal) ctx.goal = selectedGoal;
                      if (newMeal) ctx.meal_type = newMeal;
                      fetchSmartFromText(text, locale, Object.keys(ctx).length > 0 ? ctx : undefined)
                        .then(({ smart }) => setSmartResult(smart))
                        .catch(() => {});
                    }
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold",
                    "border transition-all duration-150",
                    selectedMeal === key
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                      : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50 hover:border-border",
                  )}
                >
                  <span>{icon}</span>
                  <span>{t(`meal.${key}`) || key}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

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
                className="text-xs font-bold rounded-xl"
                disabled={isAnalyzing}
              >
                {t(recipe.key as any)}
              </Button>
            ))}
          </div>
        </div>

        {/* Manual add search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              type="text"
              value={addSearchQuery}
              onChange={(e) => { setAddSearchQuery(e.target.value); setAddSearchOpen(true); searchForAdd(e.target.value); }}
              onFocus={() => setAddSearchOpen(true)}
              onBlur={() => setTimeout(() => setAddSearchOpen(false), 200)}
              placeholder={t("searchPlaceholder") || "Add ingredient..."}
              className="pl-9 h-9 text-xs rounded-xl"
            />
            {addSearchOpen && addSearchResults.length > 0 && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-background border border-border/50 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {addSearchResults.map((item) => (
                  <button
                    key={item.slug}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={async () => {
                      setAddSearchOpen(false);
                      setAddSearchResults([]);
                      setAddSearchQuery("");
                      await addIngredientAction(item.slug, item.name, item.image_url);
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/40 flex items-center gap-2.5 transition-colors"
                  >
                    {item.image_url && <img src={item.image_url} alt="" className="w-7 h-7 rounded-lg object-cover" />}
                    <span className="font-semibold text-xs">{item.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{item.slug}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="border-red-500/10 bg-red-500/5 rounded-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          LEVEL 2 — OVERVIEW (visible after analysis)
          ═══════════════════════════════════════════════════════════════ */}
      {(smartResult || isAnalyzing) && (
        <div ref={resultsRef} className="space-y-5 pt-2">

          {isAnalyzing && !smartResult && <AnalysisSkeleton />}

          {smartResult && (
            <>
              {/* Ingredient chips row */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    🍽 {t("recipeOverview") || "Your Dish"}
                  </p>
                  {chips.length > 0 && (
                    <button onClick={clearRecipe} className="text-[10px] font-bold text-muted-foreground hover:text-red-500 transition-colors">
                      {t("clearRecipe")}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {chips.map((chip, idx) => (
                    <span key={chip.slug} className="contents">
                      {idx > 0 && <span className="text-primary/40 text-lg font-black select-none">+</span>}
                      <div className="group flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-2xl border border-border/50 bg-background text-[13px] font-black transition-all hover:border-primary/30 hover:shadow-sm">
                        {chip.image_url ? (
                          <img src={chip.image_url} alt={chip.name} className="w-6 h-6 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Sparkles className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        <span className="truncate max-w-[100px] capitalize">{chip.name}</span>
                        <button
                          onClick={() => removeChip(chip.slug)}
                          className="ml-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </span>
                  ))}
                  {/* Ghost add */}
                  <span className="text-primary/40 text-lg font-black select-none">+</span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border-2 border-dashed border-primary/20 text-primary/40 text-[11px] font-bold cursor-default">
                    <Plus className="h-3 w-3" />
                    ?
                  </div>
                </div>
              </div>

              {/* Score + Balance row */}
              {flavor && (
                <div className="p-5 rounded-2xl bg-muted/10 border border-border/40 relative overflow-hidden">
                  {/* Feedback flash */}
                  {feedback && (
                    <div className={cn(
                      "absolute inset-0 pointer-events-none animate-in fade-in duration-300",
                      feedback === "improved" ? "bg-emerald-500/10" : "bg-rose-500/10",
                    )} />
                  )}

                  <div className="flex items-center gap-5 relative">
                    {/* Score ring */}
                    <div className="relative w-20 h-20 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="5" />
                        <circle cx="32" cy="32" r="26" fill="none"
                          stroke={ringStroke(balanceScore)}
                          strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 26}`}
                          strokeDashoffset={`${2 * Math.PI * 26 * (1 - balanceScore / 100)}`}
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={cn("text-2xl font-black tabular-nums transition-colors duration-500", scoreColor(balanceScore))}>
                          {animatedScore}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-bold">/100</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Balance bar */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {t("balance")}
                        </span>
                        {feedback === "improved" && (
                          <span className="text-[10px] font-black text-emerald-500 animate-in fade-in slide-in-from-left-2 duration-300">
                            ↑ improved
                          </span>
                        )}
                        {feedback === "declined" && (
                          <span className="text-[10px] font-black text-rose-500 animate-in fade-in slide-in-from-left-2 duration-300">
                            ↓ declined
                          </span>
                        )}
                      </div>
                      <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", barGradient(balanceScore))}
                          style={{ width: `${balanceScore}%` }}
                        />
                      </div>

                      {/* Weak / Strong */}
                      <div className="flex flex-wrap gap-1.5">
                        {(flavor.balance.weak_dimensions ?? []).map((w) => (
                          <Badge key={w.dimension} variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold">
                            ↓ {(() => { try { return t(w.dimension); } catch { return w.dimension; } })()}
                          </Badge>
                        ))}
                        {(flavor.balance.strong_dimensions ?? []).map((s) => (
                          <Badge key={s.dimension} variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                            ↑ {(() => { try { return t(s.dimension); } catch { return s.dimension; } })()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Nutrition quick row */}
                  {nutrition && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
                      <div className="flex items-center gap-4 text-xs">
                        <span className="font-black tabular-nums">{Math.round(nutrition.calories ?? 0)} <span className="text-muted-foreground font-normal">kcal</span></span>
                        <span className="text-blue-500 font-bold tabular-nums">P {(nutrition.protein_g ?? 0).toFixed(1)}</span>
                        <span className="text-amber-500 font-bold tabular-nums">F {(nutrition.fat_g ?? 0).toFixed(1)}</span>
                        <span className="text-green-500 font-bold tabular-nums">C {(nutrition.carbs_g ?? 0).toFixed(1)}</span>
                      </div>
                      {confidence && (
                        <span className="text-[9px] font-bold text-muted-foreground/60">
                          {Math.round(confidence.overall * 100)}% confidence
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Share */}
              <div className="flex items-center gap-2">
                {!shareUrl ? (
                  <Button variant="outline" size="sm" onClick={shareRecipe} disabled={chips.length === 0} className="text-xs font-bold gap-1.5 rounded-xl">
                    <Share2 className="h-3.5 w-3.5" />
                    {t("shareRecipe") || "Share Recipe"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 border border-border/30 rounded-xl text-xs font-mono text-muted-foreground truncate max-w-[300px]">
                      <Link className="h-3 w-3 flex-shrink-0 text-primary" />
                      <span className="truncate">{shareUrl}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyShareUrl} className="text-xs font-bold gap-1.5 rounded-xl">
                      {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? t("copied") || "Copied!" : t("copy") || "Copy"}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setShareUrl(null); setCopied(false); }} className="h-7 w-7"><span>✕</span></Button>
                  </div>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════════════
                  LEVEL 3 — NEXT ACTIONS (always visible, #1 block)
                  ═══════════════════════════════════════════════════════════ */}
              {hasActions && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-xs font-black uppercase tracking-wider text-primary">
                      {t("nextActions") || "Chef Recommends"}
                    </p>
                  </div>

                  {/* Loading overlay during re-analysis */}
                  <div className={cn("space-y-2 transition-opacity duration-300", isAnalyzing && "opacity-50 pointer-events-none")}>
                    {/* Next Actions (primary) */}
                    {filteredActions.map((action, i) => (
                      <div
                        key={`${action.type}-${action.ingredient}-${i}`}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer group",
                          i === 0
                            ? "border-2 border-primary/30 bg-primary/[0.03] hover:bg-primary/[0.06]"
                            : "border-border/40 bg-muted/5 hover:border-primary/30 hover:bg-primary/[0.02]",
                        )}
                        onClick={() => addIngredientAction(action.ingredient, actionName(action), actionImage(action))}
                      >
                        {actionImage(action) ? (
                          <img src={actionImage(action)!} alt={actionName(action)} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-border/20" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Plus className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-foreground capitalize group-hover:text-primary transition-colors">
                            {actionName(action)}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{action.reason}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase group-hover:bg-primary/20 transition-all border border-primary/20">
                          <Plus className="h-3 w-3" />
                          {t("addToRecipe") || "Add"}
                        </div>
                      </div>
                    ))}

                    {/* Suggestions fallback (when no next_actions) */}
                    {filteredActions.length === 0 && filteredSuggestions.map((s) => (
                      <div
                        key={s.slug}
                        className="flex items-center gap-3 p-4 rounded-2xl border border-border/40 bg-muted/5 hover:border-primary/30 hover:bg-primary/[0.02] transition-all cursor-pointer group"
                        onClick={() => addIngredientAction(s.slug, s.name, s.image_url)}
                      >
                        {s.image_url ? (
                          <img src={s.image_url} alt={s.name} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-border/20" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
                            <Plus className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-foreground capitalize group-hover:text-primary transition-colors">
                            {s.name}
                          </p>
                          {s.fills_gaps.length > 0 && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              + {s.fills_gaps.map(f => { try { return t(`sg.fills.${f}`); } catch { return f; } }).join(", ")}
                            </p>
                          )}
                          {s.reasons.length > 0 && s.fills_gaps.length === 0 && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                              {localizeReason(s.reasons[0], t)}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-black text-primary tabular-nums shrink-0">{s.score}</span>
                        <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase group-hover:bg-primary/20 transition-all border border-primary/20">
                          <Plus className="h-3 w-3" />
                          {t("addToRecipe") || "Add"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  LEVEL 4 — DETAILS (collapsible sections)
                  ═══════════════════════════════════════════════════════════ */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  {t("showDetails") || "Details"}
                </p>

                {/* Nutrition — open by default */}
                {legacyAnalyzeResult && (
                  <CollapsibleDetail
                    title={t("nutrition")}
                    icon={Zap}
                    iconColor="text-amber-500"
                    defaultOpen={true}
                  >
                    <NutritionTab result={legacyAnalyzeResult} locale={locale} t={t} dietLabels={dietLabels} />
                  </CollapsibleDetail>
                )}

                {/* Flavor Profile — collapsed */}
                {legacyAnalyzeResult && (
                  <CollapsibleDetail
                    title={t("flavorProfile")}
                    icon={FlameKindling}
                    iconColor="text-violet-500"
                  >
                    <FlavorRadarCard flavor={legacyAnalyzeResult.flavor} t={t} />
                  </CollapsibleDetail>
                )}

                {/* Diagnostics — collapsed */}
                {diagnostics && diagnostics.issues.length > 0 && (
                  <CollapsibleDetail
                    title={t("tabs.doctor") || "AI Sous Chef"}
                    icon={HeartPulse}
                    iconColor="text-rose-500"
                    count={diagnostics.issues.length}
                  >
                    <div className="space-y-2">
                      {diagnostics.issues.map((issue, i) => {
                        const sevClass = issue.severity === "critical"
                          ? "border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400"
                          : issue.severity === "warning"
                            ? "border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                            : "border-sky-500/30 bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400";
                        return (
                          <div key={i} className={cn("flex items-start gap-2 px-3 py-2.5 rounded-xl border text-[11px] leading-relaxed", sevClass)}>
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-bold">{issue.message}</span>
                              {issue.fix_slugs && issue.fix_slugs.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {issue.fix_slugs.map(slug => (
                                    <button
                                      key={slug}
                                      onClick={() => addIngredientAction(slug, slug.replace(/-/g, " "))}
                                      disabled={addedSlugs.has(slug)}
                                      className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors",
                                        addedSlugs.has(slug)
                                          ? "border-green-500/30 text-green-500 bg-green-500/5"
                                          : "border-primary/30 text-primary hover:bg-primary/10",
                                      )}
                                    >
                                      {addedSlugs.has(slug) ? "✓" : "+"} {slug.replace(/-/g, " ")}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleDetail>
                )}
              </div>

              {/* Engine meta */}
              {smartResult.meta && (
                <div className="flex items-center justify-between text-[9px] text-muted-foreground/30 pt-1">
                  <span>v{smartResult.meta.engine_version}</span>
                  <span>{smartResult.meta.timing_ms}ms{smartResult.meta.cached ? " · cached" : ""}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}


const STORAGE_KEY = "recipe_draft";

type RecipeDraft = {
  rows: { slug: string; grams: number; amount?: number; unit?: string }[];
  portions: number;
  result?: AnalyzeResponse | null;
  resultTab?: "ingredients" | "nutrition" | "flavor" | "influence" | "doctor" | "suggestions";
};




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
                    "text-sm font-black px-2.5 py-1 shadow-lg backdrop-blur-md border-0 drop-shadow-sm",
                    score >= 8 ? "bg-green-500/90 text-white" : score >= 6 ? "bg-amber-500/90 text-white" : "bg-card/80 dark:bg-white/20 text-foreground dark:text-white",
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
