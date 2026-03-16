"use client";

import { useState, useCallback } from "react";
import { Search, Loader2, Utensils } from "lucide-react";
import { API_URL } from "@/lib/api";
import type { SearchResult, PairingData } from "./types";
import { POPULAR_SLUGS } from "./types";
import { localizedName } from "./helpers";
import { PairingGrid } from "./PairingGrid";

interface FlavorPairingProps {
  locale: string;
  t: any;
}

export function FlavorPairing({ locale, t }: FlavorPairingProps) {
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
    <div className="space-y-8">
      {/* Header + Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex-1 max-w-2xl space-y-4">
          <h3 className="ds-h3 uppercase italic tracking-tight">{t("modes.flavorPairing")}</h3>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); search(e.target.value); }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-12 pr-4 py-4 text-sm bg-muted/10 border-border/40 rounded-2xl focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all font-medium border"
            />
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-background border border-border/40 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {searchResults.map((item) => (
                  <button
                    key={item.slug}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => loadPairings(item.slug)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-primary/5 flex items-center gap-3 transition-colors border-b border-border/5 last:border-0"
                  >
                    {item.image_url && <img src={item.image_url} alt="" className="w-8 h-8 rounded-xl object-cover shrink-0" />}
                    <span className="font-bold">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Popular chips */}
        <div className="flex flex-wrap gap-2 max-w-md md:justify-end">
          {POPULAR_SLUGS.map((p) => (
            <button
              key={p.slug}
              onClick={() => loadPairings(p.slug)}
              className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-border/50 rounded-xl hover:border-primary/40 hover:text-primary transition-all bg-muted/5 whitespace-nowrap group"
            >
              {p.image_url && <img src={p.image_url} alt="" className="w-4 h-4 rounded-md object-cover grayscale group-hover:grayscale-0 transition-all" />}
              {t(`popular.${p.key}`)}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
        </div>
      )}

      {data && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Header card */}
          <div className="flex items-center gap-6 p-6 premium-card bg-background">
            {data.basic.image_url && (
              <img src={data.basic.image_url} alt={localizedName(data.basic, locale)} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
            )}
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">{localizedName(data.basic, locale)}</h2>
              {data.macros && (
                <div className="flex gap-4 mt-1 text-[10px] text-muted-foreground font-bold">
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
            <div className="premium-card p-6">
              <div className="grid grid-cols-5 gap-4">
                {([
                  { key: "sweetness", value: data.culinary.sweetness },
                  { key: "acidity", value: data.culinary.acidity },
                  { key: "bitterness", value: data.culinary.bitterness },
                  { key: "umami", value: data.culinary.umami },
                  { key: "aroma", value: data.culinary.aroma },
                ] as const).map((d) => (
                  <div key={d.key} className="text-center group">
                    <div className="text-2xl font-black italic mb-1 group-hover:text-primary transition-colors">{d.value ?? "—"}</div>
                    <div className="ds-label lowercase text-[8px] opacity-40 mb-3">{t(d.key)}</div>
                    <div className="h-12 w-1.5 bg-muted/60 rounded-full mx-auto relative overflow-hidden">
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/40 rounded-full transition-all duration-700" style={{ height: `${((d.value ?? 0) / 10) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pairings grid */}
          {data.pairings.length > 0 ? (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Utensils className="h-5 w-5 text-primary" />
                <h3 className="ds-h2 italic tracking-tighter">
                  {t("bestPairings")} {localizedName(data.basic, locale)}
                </h3>
                <span className="text-[10px] text-muted-foreground ml-auto font-bold">{data.pairings.length} {t("matches")}</span>
              </div>
              <PairingGrid pairings={data.pairings} locale={locale} t={t} onSelect={loadPairings} />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Utensils className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p className="text-xs uppercase font-bold tracking-widest">{t("noPairings")}</p>
            </div>
          )}
        </div>
      )}

      {!data && !loading && (
        <div className="h-[400px] border-2 border-dashed border-border/20 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 bg-muted/5">
          <div className="w-20 h-20 rounded-[2.5rem] bg-muted/10 flex items-center justify-center mb-8">
            <Utensils className="h-10 w-10 text-muted-foreground/10" />
          </div>
          <h4 className="ds-h3 mb-3 opacity-20 uppercase italic tracking-tighter text-xl">Flavor Pairing</h4>
          <p className="text-xs text-muted-foreground/30 max-w-[240px] mx-auto font-medium">{t("clickIngredient")}</p>
        </div>
      )}
    </div>
  );
}
