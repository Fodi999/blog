"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Pairing } from "./types";
import { localizedName, scoreColor, scoreStars } from "./helpers";

interface PairingGridProps {
  pairings: Pairing[];
  locale: string;
  t: any;
  onSelect: (slug: string) => void;
}

export function PairingGrid({ pairings, locale, t, onSelect }: PairingGridProps) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {pairings.map((p, idx) => (
        <button
          key={p.slug}
          onClick={() => onSelect(p.slug)}
          className={cn(
            "group text-left border rounded-2xl p-4 transition-all duration-200 bg-background",
            idx === 0
              ? "border-primary/40 shadow-md shadow-primary/5"
              : "border-border/40 hover:border-primary/30 hover:shadow-sm",
          )}
        >
          <div className="flex items-center gap-3">
            {p.image_url && (
              <img src={p.image_url} alt={localizedName(p, locale)} className="w-10 h-10 rounded-xl object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-black uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                  {localizedName(p, locale)}
                </h4>
                {idx === 0 && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-black ${scoreColor(p.pair_score ?? undefined)}`}>
                  {p.pair_score?.toFixed(1) ?? "—"}
                </span>
                <span className="text-[9px] text-amber-500">{scoreStars(p.pair_score ?? undefined)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-2.5 text-[9px] text-muted-foreground">
            <span>{t("flavorScore")}: {p.flavor_score?.toFixed(1) ?? "—"}</span>
            <span>{t("nutritionScore")}: {p.nutrition_score?.toFixed(1) ?? "—"}</span>
            <span>{t("culinaryScore")}: {p.culinary_score?.toFixed(1) ?? "—"}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
