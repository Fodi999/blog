"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { FlavorSummary } from "./types";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Zap, Sparkles } from "lucide-react";

interface FlavorRadarCardProps {
  flavor: FlavorSummary;
  t: any;
}

export function FlavorRadarCard({ flavor, t }: FlavorRadarCardProps) {
  const data = [
    { subject: t("sweetness"), value: flavor.sweetness, fullMark: 10, key: "sweetness" },
    { subject: t("acidity"), value: flavor.acidity, fullMark: 10, key: "acidity" },
    { subject: t("umami"), value: flavor.umami, fullMark: 10, key: "umami" },
    { subject: t("fatDimension"), value: flavor.fat, fullMark: 10, key: "fat" },
    { subject: t("aroma"), value: flavor.aroma, fullMark: 10, key: "aroma" },
    { subject: t("bitterness"), value: flavor.bitterness, fullMark: 10, key: "bitterness" },
  ];

  const getBalanceLabel = (score: number) => {
    if (score >= 80) return t("balance_excellent") || "Excellent";
    if (score >= 60) return t("balance_moderate") || "Moderate";
    return t("balance_low") || "Low";
  };

  return (
    <div className="premium-card overflow-hidden bg-background border-border/40">
      <div className="grid lg:grid-cols-[1.2fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-border/30">
        
        {/* Left: Radar Chart */}
        <div className="p-4 sm:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="ds-label text-primary">{t("flavorProfile")}</h3>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                <PolarGrid stroke="var(--radar-grid)" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "var(--radar-label)", fontSize: 10, fontWeight: 700 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 10]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Flavor"
                  dataKey="value"
                  stroke="var(--radar-line)"
                  fill="var(--radar-fill)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[var(--tooltip-bg)] border border-[var(--tooltip-border)] px-3 py-2 rounded-xl shadow-xl backdrop-blur-md">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--tooltip-color)]">
                            {payload[0].payload.subject}: {payload[0].value?.toString()} / 10
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Balance & Details */}
        <div className="p-6 sm:p-8 bg-muted/5 dark:bg-card/20 flex flex-col justify-center">
          
          {/* Balance Score */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 mb-4">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">{t("balance")}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-6xl font-black italic tracking-tighter text-foreground mb-1">
                {Math.round(flavor.balance_score)}
              </span>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em]",
                flavor.balance_score >= 80 ? "text-emerald-500" : flavor.balance_score >= 60 ? "text-amber-500" : "text-rose-500"
              )}>
                {getBalanceLabel(flavor.balance_score)}
              </span>
            </div>
          </div>

          {/* Dimension List */}
          <div className="space-y-3 mb-8">
            {data.map((item) => (
              <div key={item.key} className="flex items-center justify-between group">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.subject}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1 bg-border/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${item.value * 10}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-black w-6 text-right italic">{item.value.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic Adjustments */}
          <div className="grid grid-cols-2 gap-3 mt-auto">
            {flavor.weak.slice(0, 2).map((w) => (
              <div key={w} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-600 dark:text-rose-400">
                <TrendingDown className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">↓ {t(w === "fat" ? "fatDimension" : w)}</span>
              </div>
            ))}
            {flavor.strong.slice(0, 2).map((s) => (
              <div key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">↑ {t(s === "fat" ? "fatDimension" : s)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
