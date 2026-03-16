"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { API_URL } from "@/lib/api";
import { ChefHat, Loader2, Share2, Copy, CheckCheck, Link as LinkIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NextLink from "next/link";

type SharedRecipeData = {
  slug: string;
  ingredients: { slug: string; grams: number }[];
  portions: number;
  lang: string;
  title: string | null;
};

type NutritionSummary = {
  calories: number; protein: number; fat: number;
  carbs: number; fiber: number; sugar: number;
};

type FlavorSummary = {
  sweetness: number; acidity: number; bitterness: number;
  umami: number; fat: number; aroma: number;
  balance_score: number; weak: string[]; strong: string[];
};

type IngredientDetail = {
  slug: string; name: string; name_en: string;
  name_ru?: string; name_pl?: string; name_uk?: string;
  image_url?: string; grams: number; calories: number;
  protein: number; fat: number; carbs: number;
  fiber: number; sugar: number; product_type?: string; found: boolean;
};

type AnalyzeResult = {
  nutrition: NutritionSummary;
  per_portion?: NutritionSummary;
  portions: number;
  macros: { protein_pct: number; fat_pct: number; carbs_pct: number };
  score: number;
  flavor: FlavorSummary;
  diet: string[];
  suggestions: { slug: string; name: string; image_url?: string; score: number; reasons: string[]; fills: string[] }[];
  ingredients: IngredientDetail[];
};

function localizedName(item: { name_en?: string; name_ru?: string; name_pl?: string; name_uk?: string; name?: string }, locale: string): string {
  switch (locale) {
    case "ru": return item.name_ru || item.name_en || item.name || "";
    case "pl": return item.name_pl || item.name_en || item.name || "";
    case "uk": return item.name_uk || item.name_en || item.name || "";
    default: return item.name_en || item.name || "";
  }
}

export function SharedRecipeClient({ slug, locale }: { slug: string; locale: string }) {
  const t = useTranslations("chefTools.tools.lab");
  const [shared, setShared] = useState<SharedRecipeData | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    (async () => {
      try {
        // 1. Fetch shared recipe data
        const sharedRes = await fetch(`${API_URL}/public/tools/shared-recipe/${slug}`);
        if (!sharedRes.ok) {
          setError("not_found");
          setLoading(false);
          return;
        }
        const sharedData: SharedRecipeData = await sharedRes.json();
        setShared(sharedData);

        // 2. Auto-analyze the recipe
        const analyzeRes = await fetch(`${API_URL}/public/tools/recipe-analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ingredients: sharedData.ingredients,
            portions: sharedData.portions,
            lang: locale,
          }),
        });
        if (!analyzeRes.ok) throw new Error("Analysis failed");
        const analysisData: AnalyzeResult = await analyzeRes.json();
        setResult(analysisData);
      } catch {
        setError("analysis_failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, locale]);

  const shareUrl = `https://dima-fomin.pl/${locale}/chef-tools/lab/r/${slug}`;
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">{t("loadingShared")}</p>
      </div>
    );
  }

  // Error states
  if (error === "not_found") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-4">
            <ChefHat className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <h2 className="text-xl font-black">{t("sharedNotFound")}</h2>
            <p className="text-muted-foreground">{t("sharedNotFoundDesc")}</p>
            <NextLink href={`/${locale}/chef-tools/lab`}>
              <Button className="mt-4">{t("openInLab")}</Button>
            </NextLink>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !result || !shared) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <Alert variant="destructive">
          <AlertDescription>Failed to load recipe analysis.</AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <NextLink href={`/${locale}/chef-tools/lab`}>
            <Button>{t("openInLab")}</Button>
          </NextLink>
        </div>
      </div>
    );
  }

  // Success — render analysis
  const n = result.nutrition;
  const pp = result.per_portion;
  const fl = result.flavor;
  const totalG = result.ingredients.reduce((s, i) => s + i.grams, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <NextLink href={`/${locale}/chef-tools/lab`} className="hover:text-foreground transition-colors">
            Culinary Lab
          </NextLink>
          <ArrowRight className="h-3 w-3" />
          <span>{t("sharedRecipeTitle")}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter">
          {shared.title || t("sharedRecipeTitle")}
          <span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground">
          {result.ingredients.length} ingredients · {Math.round(totalG)}g · {result.portions} {t("portions").toLowerCase()}
        </p>

        {/* Share bar */}
        <div className="flex items-center gap-2 flex-wrap pt-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 border border-border/30 rounded-xl text-xs font-mono text-muted-foreground truncate max-w-[300px]">
            <LinkIcon className="h-3 w-3 flex-shrink-0 text-primary" />
            <span className="truncate">{shareUrl}</span>
          </div>
          <Button variant="outline" size="sm" onClick={copyUrl} className="text-xs font-bold gap-1.5">
            {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("copied") : t("copy")}
          </Button>
          <Button
            variant="ghost" size="sm"
            onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`, "_blank")}
            className="text-xs font-bold px-2"
          >
            Telegram
          </Button>
          <Button
            variant="ghost" size="sm"
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, "_blank")}
            className="text-xs font-bold px-2"
          >
            WhatsApp
          </Button>
        </div>
      </div>

      {/* Score + Nutrition hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score ring */}
        <Card className="flex items-center justify-center py-8">
          <CardContent className="flex flex-col items-center gap-2 p-0">
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6"
                  className={result.score >= 70 ? "text-green-500" : result.score >= 40 ? "text-amber-500" : "text-red-500"}
                  strokeDasharray={`${(result.score / 100) * 264} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-3xl font-black">
                {result.score}
              </span>
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("score")}</span>
          </CardContent>
        </Card>

        {/* Calories */}
        <Card className="py-6">
          <CardContent className="text-center space-y-1 p-0 px-4">
            <p className="text-4xl font-black">{Math.round(n.calories)}</p>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">kcal {t("total").toLowerCase()}</p>
            {pp && (
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round(pp.calories)} kcal / {t("portions").toLowerCase()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Macros */}
        <Card className="py-6">
          <CardContent className="space-y-3 p-0 px-4">
            {[
              { label: t("protein"), val: n.protein, pct: result.macros.protein_pct, color: "bg-blue-500" },
              { label: t("fat"), val: n.fat, pct: result.macros.fat_pct, color: "bg-amber-500" },
              { label: t("carbs"), val: n.carbs, pct: result.macros.carbs_pct, color: "bg-orange-500" },
            ].map((m) => (
              <div key={m.label} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>{m.label}</span>
                  <span>{m.val.toFixed(1)}g ({Math.round(m.pct)}%)</span>
                </div>
                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${m.color}`} style={{ width: `${Math.min(m.pct, 100)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Ingredients list */}
      <div>
        <h2 className="text-lg font-black uppercase tracking-tight mb-4">{t("tabs.ingredients")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.ingredients.map((ing) => (
            <Card key={ing.slug} className="overflow-hidden">
              <CardContent className="p-3 flex items-center gap-3">
                {ing.image_url && (
                  <img src={ing.image_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{localizedName(ing, locale)}</p>
                  <p className="text-xs text-muted-foreground">{ing.grams}g · {Math.round(ing.calories)} kcal</p>
                </div>
                {ing.product_type && (
                  <Badge variant="secondary" className="text-[9px] shrink-0">{ing.product_type}</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Flavor Profile */}
      <div>
        <h2 className="text-lg font-black uppercase tracking-tight mb-4">{t("tabs.flavor")}</h2>
        <Card>
          <CardContent className="py-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("balance")}</span>
              <Badge variant={fl.balance_score >= 70 ? "default" : fl.balance_score >= 40 ? "secondary" : "destructive"}>
                {fl.balance_score}/100
              </Badge>
            </div>
            {[
              { label: t("sweetness"), val: fl.sweetness },
              { label: t("acidity"), val: fl.acidity },
              { label: t("bitterness"), val: fl.bitterness },
              { label: t("umami"), val: fl.umami },
              { label: t("fatDimension"), val: fl.fat },
              { label: t("aroma"), val: fl.aroma },
            ].map((d) => (
              <div key={d.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold">{d.label}</span>
                  <span className="text-muted-foreground">{d.val.toFixed(1)}</span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.min(d.val * 10, 100)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Diet badges */}
      {result.diet.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.diet.map((d) => (
            <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight mb-4">{t("tabs.suggestions")}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {result.suggestions.slice(0, 6).map((s) => (
              <Card key={s.slug} className="overflow-hidden group">
                <CardContent className="p-0">
                  {s.image_url && (
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img src={s.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <Badge className="absolute top-2 right-2 bg-primary text-xs">{s.score}</Badge>
                      <p className="absolute bottom-2 left-3 right-3 text-white text-sm font-bold line-clamp-2">
                        {localizedName(s, locale)}
                      </p>
                    </div>
                  )}
                  {!s.image_url && (
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm">{localizedName(s, locale)}</p>
                        <Badge>{s.score}</Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Open in Lab CTA */}
      <div className="text-center py-8">
        <NextLink href={`/${locale}/chef-tools/lab`}>
          <Button size="lg" className="font-black text-xs uppercase tracking-widest gap-2">
            <ChefHat className="h-4 w-4" />
            {t("openInLab")}
          </Button>
        </NextLink>
      </div>
    </div>
  );
}
