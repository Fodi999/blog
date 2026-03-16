"use client";

import { useState, useCallback, useRef } from "react";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/api";
import type { SearchResult } from "./types";
import { CONVERTER_QUICK, FROM_UNITS, TO_UNITS } from "./types";
import { unitLabel } from "./helpers";

interface UnitConverterProps {
  locale: string;
  t: any;
}

export function UnitConverter({ locale, t }: UnitConverterProps) {
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
    <div className="space-y-8">
      <div>
        <h3 className="ds-h3 mb-2 uppercase italic tracking-tight">{t("modes.unitConverter")}</h3>
        <p className="ds-small">{t("converter.subtitle")}</p>
      </div>

      {/* Quick ingredient chips */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3">{t("converter.quickIngredients")}</p>
        <div className="flex flex-wrap gap-2">
          {CONVERTER_QUICK.map((q) => (
            <button
              key={q.slug}
              onClick={() => applyQuick(q)}
              className={cn(
                "px-4 py-2 text-[10px] font-black uppercase tracking-widest border rounded-xl transition-all",
                ingredient?.slug === q.slug
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 hover:border-primary/40 hover:text-primary bg-muted/5",
              )}
            >
              {q.amount} {unitLabel(q.from, locale)} → {unitLabel(q.to, locale)}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredient search */}
      <div className="relative max-w-md">
        {ingredient && !searchOpen ? (
          <div
            className="flex items-center gap-3 h-12 px-4 bg-muted/10 border border-border/40 rounded-2xl cursor-text"
            onClick={() => { setSearchOpen(true); setSearchQuery(ingredient.name); }}
          >
            {ingredient.image_url ? (
              <img src={ingredient.image_url} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            )}
            <span className="font-bold text-sm truncate">{ingredient.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setIngredient(null); setSearchQuery(""); setResult(null); }}
              className="ml-auto text-muted-foreground/40 hover:text-primary transition-colors text-xs font-black"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); search(e.target.value); }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              placeholder={t("converter.searchIngredient")}
              className="w-full pl-11 pr-4 py-3.5 text-sm bg-muted/10 border border-border/40 rounded-2xl focus:bg-background focus:ring-2 focus:ring-primary/10 font-medium"
              autoFocus={searchOpen}
            />
          </>
        )}
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-background border border-border/40 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {searchResults.map((item) => (
              <button
                key={item.slug}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectIng(item)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-primary/5 flex items-center gap-3 transition-colors border-b border-border/5 last:border-0"
              >
                {item.image_url && <img src={item.image_url} alt="" className="w-7 h-7 rounded-lg object-cover" />}
                <span className="font-bold">{item.name}</span>
                {item.slug && (
                  <span className="text-[10px] text-muted-foreground dark:text-muted-foreground/50 ml-auto uppercase tracking-tighter">{item.slug}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Converter row */}
      <div className="premium-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
              className="h-12 w-20 px-3 text-center font-black text-lg bg-muted/10 border border-border/40 rounded-xl focus:ring-2 focus:ring-primary/10"
            />
            <select
              value={fromUnit}
              onChange={(e) => { setFromUnit(e.target.value); setResult(null); }}
              className="h-12 px-3 rounded-xl border border-border/40 bg-muted/10 font-bold text-sm min-w-[80px]"
            >
              {FROM_UNITS.map((u) => (
                <option key={u} value={u}>{unitLabel(u, locale)}</option>
              ))}
            </select>
          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground/30 rotate-90 sm:rotate-0 mx-auto sm:mx-0 shrink-0" />

          <div className="flex gap-2 flex-1">
            <select
              value={toUnit}
              onChange={(e) => { setToUnit(e.target.value); setResult(null); }}
              className="h-12 px-3 rounded-xl border border-border/40 bg-muted/10 font-bold text-sm min-w-[80px]"
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
                <span className="font-black text-lg text-muted-foreground/20">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Result detail */}
      {result && ingredient && (
        <div className="premium-card p-6 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            {ingredient.image_url && (
              <img src={ingredient.image_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
            )}
            <p className="text-sm text-muted-foreground">
              {amount} {unitLabel(fromUnit, locale)}{" "}
              <span className="text-foreground font-black">{ingredient.name}</span>
              {" = "}
              <span className="text-primary font-black">{fmtResult(result.result)} {unitLabel(toUnit, locale)}</span>
            </p>
          </div>
          {result.density_g_per_ml && (
            <p className="text-[10px] text-muted-foreground/60">
              {t("converter.density")}: <span className="font-black text-foreground">{result.density_g_per_ml.toFixed(2)} g/ml</span>
            </p>
          )}
          {result.nutrition_for_result && (
            <div className="grid grid-cols-4 gap-3 border border-border/30 rounded-xl p-4">
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
