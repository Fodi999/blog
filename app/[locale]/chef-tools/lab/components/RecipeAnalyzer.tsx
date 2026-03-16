"use client";

import { useState, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  ChefHat,
  Loader2,
  Sparkles,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/api";
import type {
  IngredientRow,
  SearchResult,
  AnalyzeResponse,
  IngredientDetail,
} from "./types";
import { QUICK_RECIPES } from "./types";
import { FlavorRadarCard } from "./FlavorRadarCard";

interface RecipeAnalyzerProps {
  locale: string;
  t: any;
}

/** Maps raw English API strings from /public/tools/recipe-analyze to i18n keys */
function translateReason(raw: string, t: any): string {
  // "fills flavor gap: bitterness, fat"
  const gapMatch = raw.match(/^fills flavor gap:\s*(.+)$/);
  if (gapMatch) {
    const dims = gapMatch[1]
      .split(/,\s*/)
      .map((d) => t(`sg.fills.${d.trim()}`, { defaultValue: d.trim() }))
      .join(", ");
    return `${t("sg.fillsGap")}: ${dims}`;
  }
  // "strong pairing affinity (9.0)"
  const pairingMatch = raw.match(/^strong pairing affinity \((.+)\)$/);
  if (pairingMatch) {
    return `${t("sg.pairing")} (${pairingMatch[1]})`;
  }
  // direct key lookup with English fallback
  const key = raw.trim().replace(/\s+/g, "_");
  return t(`sg.${key}`, { defaultValue: raw });
}

function translateFill(raw: string, t: any): string {
  return t(`sg.fills.${raw.trim()}`, { defaultValue: raw });
}

export function RecipeAnalyzer({ locale, t }: RecipeAnalyzerProps) {
  const [rows, setRows] = useState<IngredientRow[]>([{ slug: "", name: "", grams: 100 }]);
  const [portions, setPortions] = useState<number | "">(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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
    setRows((prev) => { const next = [...prev]; next[idx] = { ...next[idx], slug: item.slug, name: item.name, image_url: item.image_url }; return next; });
    setSearchResults([]); setActiveRowIdx(null); setSearchQuery("");
  };

  const analyze = async () => {
    const validRows = rows.filter((r) => r.slug && r.grams > 0);
    if (validRows.length === 0) { setError(t("addAtLeastOne")); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_URL}/public/tools/recipe-analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: validRows.map((r) => ({ slug: r.slug, grams: r.grams })), portions: Math.max(1, Number(portions) || 1), lang: locale }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || `Error ${res.status}`); }
      const data: AnalyzeResponse = await res.json();
      setResult(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: any) {
      setError(err.message || t("failedAnalyze"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 items-start">
        {/* Left Col: Setup */}
        <div className="space-y-8">
          <div>
            <h3 className="ds-h3 mb-4 uppercase italic tracking-tight">{t("modes.recipeAnalyzer")}</h3>
            <p className="ds-small mb-6">{t("subtitle")}</p>

            {/* Quick recipes */}
            <div className="flex flex-wrap gap-2 mb-8">
              {QUICK_RECIPES.map((recipe) => (
                <button
                  key={recipe.key}
                  onClick={() => { setRows(recipe.ingredients.map((i) => ({ ...i }))); setResult(null); setError(null); }}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-border/50 rounded-xl hover:border-primary/40 hover:text-primary transition-all bg-muted/10"
                >
                  {t(recipe.key as any)}
                </button>
              ))}
            </div>

            {/* Ingredient list */}
            <div className="premium-card p-1">
              <div className="divide-y divide-border/10">
                {rows.map((row, idx) => (
                  <div key={idx} className={cn("p-3 group transition-all", activeRowIdx === idx ? "relative z-50 ring-2 ring-primary/5 bg-background rounded-2xl mx-1 my-0.5 shadow-sm" : "relative")}>
                    <div className="grid grid-cols-[auto_1fr_90px_40px] gap-3 items-center">
                      {/* Ingredient thumbnail */}
                      <div className="w-8 h-8 rounded-xl overflow-hidden bg-muted/20 shrink-0 flex items-center justify-center">
                        {row.image_url ? (
                          <img src={row.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ChefHat className="h-3.5 w-3.5 text-muted-foreground/30 dark:text-muted-foreground/20" />
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={activeRowIdx === idx ? searchQuery : row.name || ""}
                          onChange={(e) => { setActiveRowIdx(idx); setSearchQuery(e.target.value); searchIngredients(e.target.value); }}
                          onFocus={() => { setActiveRowIdx(idx); setSearchQuery(row.name || ""); }}
                          onBlur={() => { setTimeout(() => { if (activeRowIdx === idx) { setActiveRowIdx(null); setSearchResults([]); } }, 200); }}
                          placeholder={t("searchPlaceholder")}
                          className="w-full px-4 py-2.5 text-sm bg-muted/20 border-transparent rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all font-medium"
                        />
                        {activeRowIdx === idx && searchResults.length > 0 && (
                          <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-background border border-border/40 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            {searchResults.map((item) => (
                              <button
                                key={item.slug}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => selectIngredient(idx, item)}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-primary/5 flex items-center gap-3 transition-colors"
                              >
                                {item.image_url && <img src={item.image_url} alt="" className="w-6 h-6 rounded-lg object-cover" />}
                                <span className="font-bold">{item.name}</span>
                                <span className="text-[10px] text-muted-foreground/70 dark:text-muted-foreground/50 ml-auto uppercase tracking-tighter">{item.slug}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          value={row.grams}
                          onChange={(e) => setRows((prev) => { const next = [...prev]; next[idx] = { ...next[idx], grams: Number(e.target.value) }; return next; })}
                          className="w-full px-3 py-2.5 text-sm bg-muted/20 border-transparent rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/30 text-center font-black"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground dark:text-muted-foreground/30 pointer-events-none">G</span>
                      </div>
                      <button
                        onClick={() => { if (rows.length > 1) setRows((prev) => prev.filter((_, i) => i !== idx)); }}
                        disabled={rows.length <= 1}
                        className="flex items-center justify-center p-2.5 rounded-xl text-muted-foreground/60 dark:text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border/30 flex items-center justify-between bg-muted/5">
                <button
                  onClick={() => setRows((prev) => [...prev, { slug: "", name: "", grams: 100 }])}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:brightness-110"
                >
                  <Plus className="h-4 w-4" />
                  {t("addIngredient")}
                </button>
                <div className="flex items-center gap-3">
                  <span className="ds-label">{t("portions")}</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={portions}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPortions(val === "" ? "" : Number(val));
                    }}
                    className="w-16 px-3 py-1.5 text-sm bg-background border border-border/40 rounded-xl text-center font-black"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={analyze}
            disabled={loading || rows.every((r) => !r.slug)}
            className={cn(
              "w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all",
              "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]",
              "disabled:opacity-30 disabled:scale-100",
              "flex items-center justify-center gap-3",
            )}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {loading ? t("analyzing") : t("analyzeRecipe")}
          </button>

          {error && (
            <div className="flex items-center gap-3 text-red-600 text-[11px] font-black uppercase tracking-widest bg-red-50 border border-red-100 rounded-2xl p-5 shadow-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Right Col: Instant context or empty state */}
        <div className="lg:sticky lg:top-24 max-h-[calc(100vh-160px)] overflow-y-auto no-scrollbar py-2">
          {result ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-12 bg-primary rounded-full" />
                <span className="ds-label text-primary">{t("results")}</span>
              </div>

              {/* Radar + Score */}
              <div className="grid gap-6">
                <FlavorRadarCard flavor={result.flavor} t={t} />

                <div className="premium-card p-6 flex items-center justify-between bg-muted/5 dark:bg-muted/10">
                  <div className="text-center">
                    <div className="ds-label mb-1">Recipe Balance</div>
                    <div className={cn("text-3xl font-black italic", result.score >= 70 ? "text-green-600 dark:text-green-500" : "text-amber-600 dark:text-amber-500")}>
                      {result.score}<span className="text-sm text-muted-foreground/50 not-italic ml-1">/100</span>
                    </div>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div className="text-right">
                    <div className="ds-label mb-1">{t("portions")}</div>
                    <div className="text-2xl font-black text-foreground">{portions}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[500px] border-2 border-dashed border-border/40 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 bg-muted/5">
              <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center mb-6">
                <ChefHat className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <h4 className="ds-h3 mb-2 opacity-60 dark:opacity-40 uppercase italic tracking-tighter">Culinary Intelligence</h4>
              <p className="text-xs text-muted-foreground/60 dark:text-muted-foreground/40 max-w-[200px] mx-auto font-medium">{t("noIngredients")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Full width dynamic results below */}
      {result && (
        <div ref={resultsRef} className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid md:grid-cols-2 gap-8">
            <NutritionSummaryCard result={result} t={t} />
            <IngredientBreakdown ingredients={result.ingredients} t={t} />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="ds-h2 italic tracking-tighter">{t("tabs.suggestions")}</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.suggestions.map((s) => (
                <div key={s.slug} className="premium-card p-6 hover:border-primary/20 hover:translate-y-[-4px] transition-all bg-background group">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-muted/20 overflow-hidden shrink-0 border border-border/50 group-hover:border-primary/20 transition-colors">
                      {s.image_url ? <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" /> : <Plus className="h-5 w-5 text-muted-foreground/20 m-auto mt-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-black text-xs uppercase tracking-tight truncate">{s.name}</h4>
                        <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full">{s.score}%</span>
                      </div>
                      <div className="space-y-1">
                        {s.reasons.map((r, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground leading-relaxed">{translateReason(r, t)}</p>
                        ))}
                      </div>
                      {s.fills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {s.fills.map((f) => (
                            <span key={f} className="px-2 py-0.5 text-[8px] font-black bg-amber-500/10 text-amber-600 rounded-full border border-amber-500/10 uppercase tracking-widest">+ {translateFill(f, t)}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Internal sub-components ─────────────────────────── */

function NutritionSummaryCard({ result, t }: { result: AnalyzeResponse; t: any }) {
  const display = result.per_portion || result.nutrition;
  const label = result.per_portion ? t("perPortion", { portions: result.portions }) : t("total");

  return (
    <div className="premium-card p-8 bg-card dark:bg-card/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.04] dark:opacity-[0.03] pointer-events-none">
        <Zap className="h-32 w-32" />
      </div>

      <div className="flex items-center gap-2 mb-8">
        <div className="ds-label text-primary">{t("nutrition")}</div>
        <div className="h-px flex-1 bg-border/20" />
        <div className="ds-label">{label}</div>
      </div>

      <div className="mb-10 text-center">
        <div className="text-7xl font-black tracking-tighter text-foreground dark:text-foreground">
          {Math.round(display.calories)}<span className="text-xl font-medium tracking-normal text-muted-foreground/80 ml-2 uppercase italic">kcal</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-10">
        {[
          { label: t("protein"), val: display.protein, pct: result.macros.protein_pct, cls: "ds-bar-protein" },
          { label: t("fat"), val: display.fat, pct: result.macros.fat_pct, cls: "ds-bar-fat" },
          { label: t("carbs"), val: display.carbs, pct: result.macros.carbs_pct, cls: "ds-bar-carbs" },
        ].map((m) => (
          <div key={m.label} className="text-center">
            <div className="text-2xl font-black mb-1 text-foreground">{Math.round(m.val)}<span className="text-[10px] ml-0.5 text-muted-foreground/50">g</span></div>
            <div className="ds-label mb-2 lowercase">{m.label}</div>
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full", m.cls)} style={{ width: `${Math.min(m.pct, 100)}%` }} />
            </div>
            <div className="text-[10px] font-bold mt-1.5 text-muted-foreground/60">{m.pct.toFixed(0)}%</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 dark:bg-muted/10 border border-border/40 dark:border-border/20">
          <span className="ds-label lowercase">{t("fiber")}</span>
          <span className="font-black text-sm text-foreground">{display.fiber.toFixed(1)}g</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 dark:bg-muted/10 border border-border/40 dark:border-border/20">
          <span className="ds-label lowercase">{t("sugar")}</span>
          <span className="font-black text-sm text-foreground">{display.sugar.toFixed(1)}g</span>
        </div>
      </div>
    </div>
  );
}

function IngredientBreakdown({ ingredients, t }: { ingredients: IngredientDetail[]; t: any }) {
  return (
    <div className="premium-card bg-background overflow-hidden flex flex-col">
      <div className="p-6 border-b border-border/40 bg-muted/5 flex items-center justify-between">
        <div className="ds-label uppercase tracking-widest">{t("tabs.ingredients")}</div>
        <div className="ds-label italic text-primary">{ingredients.length} items</div>
      </div>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full">
          <tbody>
            {ingredients.map((ing) => (
              <tr key={ing.slug} className="group border-b border-border/10 hover:bg-muted/5 transition-colors">
                <td className="py-4 px-6 min-w-[160px]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl overflow-hidden bg-muted/20 shrink-0">
                      {ing.image_url ? (
                        <img src={ing.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="h-3 w-3 text-muted-foreground/15" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-black text-xs uppercase tracking-tight">{ing.name}</div>
                      {!ing.found && <div className="text-[10px] text-amber-500 uppercase font-black tracking-widest mt-0.5">Custom Density</div>}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-3 text-right">
                  <div className="text-xs font-bold text-foreground">{ing.grams}<span className="text-[10px] text-muted-foreground/40 ml-1">g</span></div>
                </td>
                <td className="py-4 px-3 text-right">
                  <div className="text-xs font-black text-primary">{Math.round(ing.calories)}<span className="text-[9px] text-muted-foreground/40 ml-1 font-medium">kcal</span></div>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2 text-[10px] font-black opacity-50 dark:opacity-30 group-hover:opacity-100 transition-opacity">
                    <span className="text-blue-600 dark:text-blue-500">{Math.round(ing.protein)}</span>
                    <span className="text-amber-600 dark:text-amber-500">{Math.round(ing.fat)}</span>
                    <span className="text-green-600 dark:text-green-500">{Math.round(ing.carbs)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
