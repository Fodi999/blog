'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Search, Grid3X3, Table2, Share2, Check, Flame, BarChart2, X, MapPin,
  Waves, Mountain, Fish, Brain, ChefHat, Utensils, Soup, TrendingUp,
  TrendingDown, Star, AlertTriangle, Lightbulb, Trophy, Minus, ArrowUpRight,
  ExternalLink, Sparkles, Wand2
} from 'lucide-react';
import type { BestRightNowResponse, FishSeasonStatus } from '@/lib/api';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Availability = FishSeasonStatus;

export type FishRow = {
  slug: string;
  name: string;
  image: string | null;
  months: Availability[];
  currentStatus: Availability;
  live: boolean;
  isSushi: boolean;
  waterType: 'sea' | 'freshwater' | 'both';
  wildFarmed: 'wild' | 'farmed' | 'both' | null;
};

export type I18n = {
  fishColumn: string;
  searchPlaceholder: string;
  bestNow: string;
  bestNowSubtitle: string;
  filterType: string;
  filterAll: string;
  filterSea: string;
  filterFresh: string;
  filterSushi: string;
  peakOnly: string;
  sortPeakFirst: string;
  sortAlpha: string;
  tableView: string;
  cardView: string;
  shareBtn: string;
  shareCopied: string;
  allYearLabel: string;
  season: { peak: string; good: string; limited: string; off: string };
  months: string[];
};

export type RegionEntry = { status: Availability; peakRange: string; };
export type RegionRows = Record<string, Partial<Record<string, RegionEntry>>>;

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * FIXED colour semantics:
 * 🟢 peak    = best time to buy
 * 🟡 good    = ok
 * 🟠 limited = not great
 * ⚪ off     = avoid
 */
const dotStyles: Record<Availability, string> = {
  peak:    'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] ring-2 ring-emerald-500/20',
  good:    'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)] ring-1 ring-amber-400/20',
  limited: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]',
  off:     'bg-slate-800 border border-slate-700 opacity-40 blur-[0.5px]',
};

const barStyles: Record<Availability, string> = {
  peak:    'bg-emerald-500',
  good:    'bg-amber-400',
  limited: 'bg-orange-400',
  off:     'bg-muted border border-border/40',
};

const statusScore: Record<Availability, number> = { peak: 3, good: 2, limited: 1, off: 0 };

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusDotClass: Record<Availability, string> = {
  peak:    'bg-emerald-500',
  good:    'bg-amber-400',
  limited: 'bg-orange-400',
  off:     'bg-border/60',
};
const statusTextClass: Record<Availability, string> = {
  peak:    'text-emerald-600 dark:text-emerald-400 font-black',
  good:    'text-amber-600 dark:text-amber-400 font-bold',
  limited: 'text-orange-500 font-bold',
  off:     'text-muted-foreground/40 font-medium',
};

/** rule-based micro-insight per availability status */
function statusInsight(avail: Availability, isSushi: boolean): { icon: React.ElementType; text: string; cls: string } {
  if (avail === 'peak') return {
    icon: TrendingUp,
    text: isSushi ? 'Perfect for sushi' : 'Best quality now',
    cls: 'text-emerald-600 dark:text-emerald-400',
  };
  if (avail === 'good') return {
    icon: Check,
    text: 'Good choice',
    cls: 'text-amber-600 dark:text-amber-400',
  };
  if (avail === 'limited') return {
    icon: TrendingDown,
    text: 'Higher price expected',
    cls: 'text-orange-500',
  };
  return {
    icon: AlertTriangle,
    text: 'Not in season — avoid',
    cls: 'text-muted-foreground/50',
  };
}

const REGION_LABELS: Record<string, string> = {
  GLOBAL: 'Global', PL: 'Poland', EU: 'EU', ES: 'Spain', UA: 'Ukraine',
};
const REGION_ORDER = ['PL', 'EU', 'ES', 'UA', 'GLOBAL'];

// ─── Season bar chart strip ───────────────────────────────────────────────────

function SeasonStrip({ months, currentMonth }: { months: Availability[]; currentMonth: number }) {
  const HEIGHT = [4, 6, 10, 16]; // off/limited/good/peak
  return (
    <div className="flex items-end gap-[2px] h-[18px] mt-1 group/strip">
      {months.map((a, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 rounded-[1px] transition-all duration-500',
            barStyles[a],
            i === currentMonth && 'ring-1 ring-white shadow-[0_0_8px_white] z-10 scale-y-110',
            a === 'off' && 'blur-[0.5px] opacity-30 group-hover/strip:blur-none group-hover/strip:opacity-100'
          )}
          style={{ height: `${HEIGHT[statusScore[a]]}px` }}
        />
      ))}
    </div>
  );
}

// ─── Season mini bar chart (card view) ───────────────────────────────────────

function SeasonChart({ months, monthHeaders, currentMonth }: {
  months: Availability[]; monthHeaders: string[]; currentMonth: number;
}) {
  return (
    <div className="flex items-end gap-[3px] h-12 group/chart">
      {months.map((a, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
          <div
            className={cn(
              'w-full rounded-t-[2px] transition-all duration-700',
              barStyles[a],
              i === currentMonth && 'ring-1 ring-white shadow-[0_0_10px_white] z-10 scale-x-110',
              a === 'off' && 'blur-[0.5px] opacity-20 group-hover/chart:blur-none group-hover/chart:opacity-100'
            )}
            style={{ height: `${Math.max(4, statusScore[a] * 12)}px` }}
          />
          <span className={cn(
            'text-[7px] font-black uppercase tracking-tighter transition-colors',
            i === currentMonth ? 'text-primary' : 'text-muted-foreground/30'
          )}>
            {(monthHeaders[i] ?? MONTH_SHORT[i]).slice(0, 1)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Region Compare strip ─────────────────────────────────────────────────────

function RegionCompare({ slug, regionRows, activeRegion }: {
  slug: string; regionRows: RegionRows; activeRegion?: string;
}) {
  const entries = regionRows[slug];
  if (!entries) return null;
  const filled = REGION_ORDER.filter((r) => entries[r]);
  if (filled.length === 0) return null;
  const statuses = filled.map((r) => entries[r]!.status);
  const ranges = filled.map((r) => entries[r]!.peakRange);
  if (statuses.every((s) => s === statuses[0]) && ranges.every((r) => r === ranges[0])) return null;

  return (
    <div className="mt-6 pt-6 border-t border-white/5 space-y-2">
      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 mb-2">Regional Dynamics</p>
      {filled.map((r) => {
        const e = entries[r]!;
        const isActive = r === activeRegion;
        return (
          <div key={r} className={cn(
            'flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all border border-transparent',
            isActive ? 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5' : 'bg-white/[0.02] border-white/5'
          )}>
            <span className={cn('text-[10px] font-black uppercase tracking-widest w-10 shrink-0 italic', isActive ? 'text-primary' : 'text-muted-foreground/40')}>
              {r === 'GLOBAL' ? 'GL' : r}
            </span>
            <div className={cn('w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_currentColor]', statusDotClass[e.status])} />
            <span className={cn('text-[10px] font-bold uppercase tracking-tight', statusTextClass[e.status])}>{e.status}</span>
            {e.peakRange !== '—' && (
              <span className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest ml-auto">{e.peakRange}</span>
            )}
            {isActive && <div className="w-1 h-1 rounded-full bg-primary ml-2 animate-ping" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Chart modal ─────────────────────────────────────────────────────────────

function ChartModal({ fish, monthHeaders, currentMonth, i18n, regionRows, activeRegion, onClose }: {
  fish: FishRow; monthHeaders: string[]; currentMonth: number; i18n: I18n;
  regionRows?: RegionRows; activeRegion?: string; onClose: () => void;
}) {
  const maxH = 100;
  const regionEntries = regionRows?.[fish.slug];
  const filledRegions = regionEntries ? REGION_ORDER.filter((r) => regionEntries[r]) : [];
  const showRegions = filledRegions.length > 1 && (() => {
    const statuses = filledRegions.map((r) => regionEntries![r]!.status);
    const ranges   = filledRegions.map((r) => regionEntries![r]!.peakRange);
    return !(statuses.every((s) => s === statuses[0]) && ranges.every((r) => r === ranges[0]));
  })();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose}>
      <div 
        className="relative bg-card/40 rounded-[2.5rem] border border-white/10 shadow-2xl p-8 w-full max-w-xl backdrop-blur-3xl overflow-hidden animate-in zoom-in-95 duration-500" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-5">
              {fish.image ? (
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-card border border-white/10 shadow-2xl">
                  <Image src={fish.image} alt={fish.name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Fish className="h-8 w-8 text-muted-foreground/20" />
                </div>
              )}
              <div>
                <h3 className="font-black text-foreground uppercase tracking-tighter italic text-2xl leading-none mb-2">{fish.name}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 flex items-center gap-1.5">
                    {fish.waterType === 'sea' ? <Waves className="h-3.5 w-3.5" /> : <Mountain className="h-3.5 w-3.5" />}
                    {fish.waterType} stock
                  </span>
                  {fish.isSushi && (
                    <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-black text-primary border-primary/20 bg-primary/5 uppercase tracking-widest">sushi</Badge>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Chart Section */}
          <div className="space-y-6 mb-10">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Seasonal Dynamics 2026</p>
              <div className="flex gap-2">
                {(['peak', 'good', 'off'] as Availability[]).map((a) => (
                  <div key={a} className="flex items-center gap-1.5">
                    <div className={cn('w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]', statusDotClass[a])} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{i18n.season[a]}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-end gap-2 group/modalchart" style={{ height: `${maxH + 30}px` }}>
              {fish.months.map((a, i) => {
                const h = Math.max(6, statusScore[a] * (maxH / 3));
                const isCurrent = i === currentMonth;
                return (
                  <div key={i} className="flex flex-col items-center gap-3 flex-1 h-full justify-end">
                    <div 
                      className={cn(
                        'w-full rounded-t-lg transition-all duration-700 relative',
                        barStyles[a], 
                        isCurrent && 'ring-2 ring-white shadow-[0_0_20px_white] z-10 scale-x-110',
                        a === 'off' && 'blur-[1px] opacity-10 group-hover/modalchart:blur-none group-hover/modalchart:opacity-100'
                      )} 
                      style={{ height: `${h}px` }} 
                    />
                    <span className={cn(
                      'text-[9px] font-black tracking-tighter uppercase transition-colors', 
                      isCurrent ? 'text-primary' : 'text-muted-foreground/20'
                    )}>
                      {(monthHeaders[i] ?? MONTH_SHORT[i]).slice(0, 1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Regional Breakdown */}
          {showRegions && regionEntries && (
            <div className="pt-8 border-t border-white/5">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 mb-5 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Global Market Spread
              </p>
              <div className="grid grid-cols-2 gap-3">
                {filledRegions.map((r) => {
                  const e = regionEntries[r]!;
                  const isActive = r === activeRegion;
                  return (
                    <div key={r} className={cn(
                      'flex items-center gap-3 rounded-[1.25rem] px-4 py-3 transition-all border',
                      isActive ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10' : 'bg-white/[0.02] border-white/5'
                    )}>
                      <span className={cn('text-[11px] font-black uppercase tracking-widest w-8 shrink-0 italic', isActive ? 'text-primary' : 'text-muted-foreground/40')}>
                        {r === 'GLOBAL' ? 'GL' : r}
                      </span>
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className={cn('w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]', statusDotClass[e.status])} />
                          <span className={cn('text-[10px] font-bold uppercase truncate', statusTextClass[e.status])}>{e.status}</span>
                        </div>
                        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest truncate">{e.peakRange}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Smart Mode card ─────────────────────────────────────────────────────────

function SmartModeCard({ fish, currentMonth, monthHeaders, i18n, locale, onShowChart }: {
  fish: FishRow; currentMonth: number; monthHeaders: string[]; i18n: I18n; locale: string;
  onShowChart: (f: FishRow) => void;
}) {
  const router = useRouter();
  const status = fish.months[currentMonth];
  const insight = statusInsight(status, fish.isSushi);
  const InsightIcon = insight.icon;
  const peakMonths = fish.months.map((a, i) => ({ a, i })).filter(x => x.a === 'peak').map(x => (monthHeaders[x.i] ?? MONTH_SHORT[x.i]).slice(0, 3));

  return (
    <Card className={cn(
      'group relative overflow-hidden transition-all duration-700 rounded-[2rem] border-white/5 bg-card/30 backdrop-blur-3xl hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1',
      status === 'peak' ? 'border-primary/20 bg-primary/[0.02]' : ''
    )}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div 
            className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-card border border-white/5 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:border-primary/30 transition-all duration-700 cursor-pointer"
            onClick={() => router.push(`/${locale}/chef-tools/ingredients/${fish.slug}`)}
          >
            {fish.image
              ? <Image src={fish.image} alt={fish.name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
              : <Fish className="h-8 w-8 text-muted-foreground/20" />
            }
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 
                className="font-black text-foreground uppercase tracking-tighter italic text-lg leading-none truncate group-hover:text-primary transition-colors cursor-pointer"
                onClick={() => router.push(`/${locale}/chef-tools/ingredients/${fish.slug}`)}
              >
                {fish.name}
              </h3>
              <button onClick={() => onShowChart(fish)} className="p-2 shrink-0 text-muted-foreground/20 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20">
                <BarChart2 className="h-4 w-4" />
              </button>
            </div>

            {/* Micro-insight */}
            <div className={cn('flex items-center gap-1.5 mb-4 text-[10px] font-black uppercase tracking-widest', insight.cls)}>
              <InsightIcon className="h-3 w-3 shrink-0" />
              <span>{insight.text}</span>
            </div>

            {/* Tags & Meta */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {fish.isSushi && (
                <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-primary/10 text-primary border border-primary/20 shadow-sm">sushi</span>
              )}
              <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-white/5 text-muted-foreground/60 border border-white/5 flex items-center gap-1">
                {fish.waterType === 'sea' ? <Waves className="h-3 w-3" /> : <Mountain className="h-3 w-3" />}
                {fish.waterType}
              </span>
            </div>

            {/* Seasonality Pulse */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Seasonal Pulse</span>
                {status === 'peak' && <span className="text-[8px] font-black text-primary uppercase tracking-widest flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5" /> Optimal Catch</span>}
              </div>
              <SeasonStrip months={fish.months} currentMonth={currentMonth} />
            </div>

            {peakMonths.length > 0 && (
              <p className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest mt-4 pt-3 border-t border-white/5">
                Focus: {peakMonths.join(' • ')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Best Now block ───────────────────────────────────────────────────────────

function BestNowBlock({ bestRightNow, i18n, rows, currentMonth, locale, activeRegion }: {
  bestRightNow: BestRightNowResponse; i18n: I18n; rows: FishRow[]; currentMonth: number; locale: string; activeRegion?: string;
}) {
  const router = useRouter();
  const monthName = MONTH_FULL[currentMonth];

  // top 3 peak fish for medal display
  const peakFish = bestRightNow.peak.slice(0, 3);
  const avoidFish = rows.filter(r => r.months[currentMonth] === 'off').slice(0, 3);

  const medals = [
    { label: '🥇', cls: 'from-yellow-400/20 to-yellow-600/5 border-yellow-500/30 text-yellow-500' },
    { label: '🥈', cls: 'from-slate-300/20 to-slate-500/5 border-slate-400/30 text-slate-400' },
    { label: '🥉', cls: 'from-amber-600/20 to-amber-800/5 border-amber-700/30 text-amber-700' },
  ];

  return (
    <div className="group relative rounded-[2.5rem] border-2 border-primary/20 bg-card/30 backdrop-blur-3xl overflow-hidden shadow-2xl shadow-black/20">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-emerald-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative z-10">
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/5">
              <Sparkles className="h-7 w-7 text-primary animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  {i18n.bestNow}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] italic">
                  {monthName} 2026
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tighter italic">
                {bestRightNow.headline || "AI Chef Curator"}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-none flex flex-col items-end">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Region</p>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-foreground">
                <MapPin className="h-3 w-3 text-primary" />
                {bestRightNow.headline ? (activeRegion || "Global") : "Global Market"}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 grid lg:grid-cols-12 gap-8">
          {/* Main Stage: TOP 3 */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Best Choice Now
              </p>
            </div>
            
            <div className="grid gap-3">
              {peakFish.map((fish, idx) => (
                <div 
                  key={fish.slug}
                  onClick={() => router.push(`/${locale}/chef-tools/ingredients/${fish.slug}`)}
                  className={cn(
                    "group/item relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-500 cursor-pointer bg-gradient-to-r",
                    medals[idx]?.cls || "border-white/5 bg-white/5"
                  )}
                >
                  <div className="text-2xl font-black italic opacity-50 group-hover/item:opacity-100 transition-opacity w-8 text-center">
                    {medals[idx]?.label || `#${idx + 1}`}
                  </div>
                  
                  {fish.image_url ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-lg group-hover/item:scale-110 transition-transform duration-500">
                      <Image src={fish.image_url} alt={fish.name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <Fish className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-black uppercase italic tracking-tight text-foreground group-hover/item:text-primary transition-colors truncate">
                      {fish.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {fish.sushi_grade && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary border border-primary/20 px-1.5 py-0.5 rounded bg-primary/5">Sushi Grade</span>
                      )}
                      <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-emerald-500" /> Peak Quality
                      </span>
                    </div>
                  </div>

                  <div className="opacity-0 group-hover/item:opacity-100 transition-all translate-x-4 group-hover/item:translate-x-0">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Stage: Market Pulse */}
          <div className="lg:col-span-5 space-y-6">
            {/* Also Good */}
            {bestRightNow.also_good.length > 0 && (
              <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500 mb-4 flex items-center gap-2">
                  <Check className="h-4 w-4" /> Strong Alternatives
                </p>
                <div className="flex flex-wrap gap-2">
                  {bestRightNow.also_good.map((fish) => (
                    <button 
                      key={fish.slug}
                      onClick={() => router.push(`/${locale}/chef-tools/ingredients/${fish.slug}`)}
                      className="px-4 py-2 rounded-xl bg-background border border-border/60 text-xs font-black uppercase tracking-wider hover:border-primary/40 hover:text-primary transition-all shadow-sm"
                    >
                      {fish.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Red Alert: Avoid */}
            {avoidFish.length > 0 && (
              <div className="p-6 rounded-[2rem] bg-rose-500/5 border border-rose-500/20">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-500 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Season Risk: Avoid
                </p>
                <div className="space-y-2">
                  {avoidFish.map((fish) => (
                    <div key={fish.slug} className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                      <span className="text-xs font-bold text-rose-300 line-through decoration-rose-500/50">{fish.name}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-rose-500/60 italic">Low Quality</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Pairing Suggestion */}
            <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/20 relative overflow-hidden group/pairing cursor-pointer" onClick={() => router.push(`/${locale}/chef-tools/lab`)}>
              <div className="relative z-10">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-3 flex items-center gap-2">
                  <Utensils className="h-4 w-4" /> Smart Pairing hint
                </p>
                <h5 className="text-sm font-black text-foreground uppercase italic mb-2">
                  {peakFish[0]?.name ? `Peak ${peakFish[0]?.name} is best with...` : "Cooking Seasonal Best"}
                </h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                  AI detected high umami levels in current catches. Use acid-rich pairings to lift the flavor profile.
                </p>
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  Analyze in Culinary Lab <ArrowUpRight className="h-3 w-3" />
                </div>
              </div>
              <Wand2 className="absolute -bottom-4 -right-4 h-20 w-20 text-indigo-500/10 group-hover/pairing:scale-110 transition-transform duration-700" />
            </div>
          </div>
        </div>

        {/* AI Chef Insight Footer */}
        <div className="px-8 py-4 bg-primary/10 border-t border-primary/20 flex items-center gap-3 overflow-hidden">
          <Lightbulb className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 whitespace-nowrap overflow-hidden">
            <p className="text-[11px] font-bold text-foreground animate-marquee inline-block mr-12 uppercase italic tracking-tight">
              {currentMonth >= 2 && currentMonth <= 4
                ? 'Spring Insight: sea fish at peak. Best for Sashimi. Freshwater fish spawning soon — texture might be soft.'
                : currentMonth >= 5 && currentMonth <= 7
                ? 'Summer Insight: Higher fat content in surface swimmers. Perfect for high-heat charcoal grilling.'
                : currentMonth >= 8 && currentMonth <= 10
                ? 'Autumn Insight: Atlantic stocks are fattening up for winter. Optimal time for traditional curing and smoking.'
                : 'Winter Insight: Dense, fatty sea fish dominance. Cold waters produce concentrated umami profiles.'}
            </p>
            {/* Repeat for continuous marquee */}
            <p className="text-[11px] font-bold text-foreground animate-marquee inline-block uppercase italic tracking-tight">
              {currentMonth >= 2 && currentMonth <= 4
                ? 'Spring Insight: sea fish at peak. Best for Sashimi. Freshwater fish spawning soon — texture might be soft.'
                : currentMonth >= 5 && currentMonth <= 7
                ? 'Summer Insight: Higher fat content in surface swimmers. Perfect for high-heat charcoal grilling.'
                : currentMonth >= 8 && currentMonth <= 10
                ? 'Autumn Insight: Atlantic stocks are fattening up for winter. Optimal time for traditional curing and smoking.'
                : 'Winter Insight: Dense, fatty sea fish dominance. Cold waters produce concentrated umami profiles.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Colour legend ────────────────────────────────────────────────────────────

function ColourLegend({ i18n }: { i18n: I18n }) {
  const items = [
    { cls: dotStyles.peak,    label: i18n.season.peak,    sub: 'Optimal Catch' },
    { cls: dotStyles.good,    label: i18n.season.good,    sub: 'Stable Harvest' },
    { cls: dotStyles.limited, label: i18n.season.limited, sub: 'Scarce Stock' },
    { cls: dotStyles.off,     label: i18n.season.off,     sub: 'Closed Season' },
  ];
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-4 px-8 py-5 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-2xl">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3.5 group/legend cursor-help">
          <div className={cn('w-3.5 h-3.5 rounded-full shrink-0 transition-all duration-700 group-hover/legend:scale-150 shadow-[0_0_10px_currentColor]', item.cls)} />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80 group-hover/legend:text-primary transition-all">
              {item.label}
            </span>
            <span className="text-[7px] font-black uppercase tracking-[0.1em] text-muted-foreground/30 group-hover/legend:text-muted-foreground/60 transition-all">
              {item.sub}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FishSeasonClient({
  rows, monthHeaders, i18n, bestRightNow, regionRows, activeRegion, locale,
}: {
  rows: FishRow[]; monthHeaders: string[]; i18n: I18n;
  bestRightNow: BestRightNowResponse | null;
  regionRows?: RegionRows; activeRegion?: string; locale: string;
}) {
  const router = useRouter();
  const currentMonth = new Date().getMonth();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sea' | 'freshwater' | 'sushi'>('all');
  const [peakOnly, setPeakOnly] = useState(false);
  const [sort, setSort] = useState<'peak' | 'alpha'>('peak');
  const [view, setView] = useState<'table' | 'card' | 'smart'>('table');
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const [tooltip, setTooltip] = useState<{ fishIdx: number; monthIdx: number } | null>(null);
  const [chartFish, setChartFish] = useState<FishRow | null>(null);

  // ── Filtered & sorted rows ──────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = rows.filter((r) => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType === 'sea' && r.waterType !== 'sea' && r.waterType !== 'both') return false;
      if (filterType === 'freshwater' && r.waterType !== 'freshwater' && r.waterType !== 'both') return false;
      if (filterType === 'sushi' && !r.isSushi) return false;
      if (peakOnly && !r.months.some((m) => m === 'peak')) return false;
      return true;
    });
    if (sort === 'alpha') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list = [...list].sort((a, b) => {
        const aScore = statusScore[a.months[currentMonth]];
        const bScore = statusScore[b.months[currentMonth]];
        if (bScore !== aScore) return bScore - aScore;
        return b.months.filter((m) => m === 'peak').length - a.months.filter((m) => m === 'peak').length;
      });
    }
    return list;
  }, [rows, search, filterType, peakOnly, sort, currentMonth]);

  function handleCopyLink() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setShareOpen(false);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleShareTo(target: 'telegram' | 'whatsapp') {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const encodedUrl = encodeURIComponent(url);
    const title = `Fish Season — ${MONTH_FULL[currentMonth]}`;
    const encodedText = encodeURIComponent(`${title}\n${url}`);
    const href = target === 'telegram'
      ? `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(title)}`
      : `https://wa.me/?text=${encodedText}`;
    window.open(href, '_blank', 'noopener,noreferrer');
    setShareOpen(false);
  }

  return (
    <div className="space-y-6">

      {/* ── Background Seasonal Glows ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Winter/Spring: Cool Blues/Cyans */}
        {((currentMonth >= 11 || currentMonth <= 3)) && (
          <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-cyan-400/5 blur-[160px] rounded-full animate-pulse" />
        )}
        {/* Summer: Warm Ambers */}
        {(currentMonth >= 4 && currentMonth <= 7) && (
          <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-amber-400/5 blur-[160px] rounded-full animate-pulse" />
        )}
        {/* Autumn: Rich Oranges/Reds */}
        {(currentMonth >= 8 && currentMonth <= 10) && (
          <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-rose-500/5 blur-[160px] rounded-full animate-pulse" />
        )}
      </div>

      {/* ── Chart modal ── */}
      {chartFish && (
        <ChartModal fish={chartFish} monthHeaders={monthHeaders} currentMonth={currentMonth}
          i18n={i18n} regionRows={regionRows} activeRegion={activeRegion} onClose={() => setChartFish(null)} />
      )}

      {/* ── Best Right Now ── */}
      {bestRightNow && (bestRightNow.peak.length > 0 || bestRightNow.also_good.length > 0) && (
        <div className="relative z-10 animate-in fade-in slide-in-from-top-8 duration-1000">
          <BestNowBlock bestRightNow={bestRightNow} i18n={i18n} rows={rows} currentMonth={currentMonth} locale={locale} activeRegion={activeRegion} />
        </div>
      )}

      {/* ── Controls bar ── */}
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 p-5 rounded-[2.5rem] bg-card/40 border border-white/5 shadow-2xl backdrop-blur-2xl">
        {/* Search */}
        <div className="relative flex-1 w-full max-w-sm group">
          <div className="absolute inset-0 bg-primary/5 blur-xl group-focus-within:bg-primary/20 transition-all rounded-full" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none z-20" />
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder={i18n.searchPlaceholder} 
            className="pl-11 h-12 text-sm bg-background/50 border-white/10 rounded-2xl focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all relative z-10" 
          />
        </div>

        {/* Type filter pills */}
        <div className="flex gap-1.5 flex-wrap items-center bg-black/20 p-1.5 rounded-2xl border border-white/5">
          {([
            { id: 'all',        label: i18n.filterAll },
            { id: 'sea',        label: i18n.filterSea },
            { id: 'freshwater', label: i18n.filterFresh },
            { id: 'sushi',      label: i18n.filterSushi },
          ] as const).map((f) => (
            <button 
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                filterType === f.id 
                  ? 'bg-primary text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Right tools container */}
        <div className="flex items-center gap-3 ml-auto">
          <button 
            onClick={() => setPeakOnly((v) => !v)}
            className={cn(
              'flex items-center gap-2 h-10 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border',
              peakOnly 
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/20'
            )}
          >
            <Flame className={cn("h-3.5 w-3.5", peakOnly && "animate-pulse")} />
            {i18n.peakOnly}
          </button>

          <Select value={sort} onValueChange={(v) => setSort(v as 'peak' | 'alpha')}>
            <SelectTrigger className="h-10 text-[10px] font-black uppercase tracking-widest min-w-[150px] bg-white/5 border-white/10 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="peak" className="font-black uppercase tracking-tighter italic">{i18n.sortPeakFirst}</SelectItem>
              <SelectItem value="alpha" className="font-black uppercase tracking-tighter italic">{i18n.sortAlpha}</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex bg-black/40 rounded-2xl p-1 border border-white/10 shrink-0">
            {[
              { id: 'table', icon: Table2, label: i18n.tableView },
              { id: 'card', icon: Grid3X3, label: i18n.cardView },
              { id: 'smart', icon: Brain, label: 'Smart' }
            ].map((vt) => (
              <button 
                key={vt.id}
                onClick={() => setView(vt.id as any)}
                className={cn(
                  'p-2 rounded-xl transition-all',
                  view === vt.id 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={vt.label}
              >
                <vt.icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          {/* Share */}
          <div className="relative" ref={shareRef}>
            <button
              onClick={() => setShareOpen((v) => !v)}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
            </button>
            {shareOpen && (
              <div className="absolute right-0 mt-3 z-50 w-48 rounded-2xl border border-white/10 bg-card/80 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button onClick={() => handleShareTo('telegram')} className="flex w-full items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#26A5E4]" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram
                </button>
                <div className="h-px bg-white/5 mx-3" />
                <button onClick={handleCopyLink} className="flex w-full items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">
                  <Share2 className="h-4 w-4" />
                  {copied ? i18n.shareCopied : i18n.shareBtn}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="relative z-10 flex justify-end">
        <ColourLegend i18n={i18n} />
      </div>

      {/* ── Main content view ── */}
      <div className="relative z-10">
        {/* TABLE VIEW */}
        {view === 'table' && (
          <div className="rounded-[2.5rem] overflow-hidden border border-white/5 bg-card/20 backdrop-blur-3xl shadow-2xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/5 bg-white/[0.02]">
                    <TableHead className="font-black text-foreground uppercase tracking-widest text-[10px] h-14 px-8 whitespace-nowrap min-w-[200px]">
                      {i18n.fishColumn}
                    </TableHead>
                    {monthHeaders.map((m, mi) => (
                      <TableHead key={mi}
                        className={cn('text-center font-black uppercase tracking-widest text-[10px] min-w-[50px] transition-all duration-500 relative',
                          mi === currentMonth ? 'text-primary bg-primary/[0.03]' : 'text-muted-foreground/40')}
                      >
                        {m}
                        {mi === currentMonth && (
                          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                        )}
                      </TableHead>
                    ))}
                    <TableHead className="w-14 h-14 text-center">
                      <BarChart2 className="h-4 w-4 mx-auto text-muted-foreground/20" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((fish, fi) => {
                    const curStatus = fish.months[currentMonth];
                    const insight = statusInsight(curStatus, fish.isSushi);
                    const InsightIcon = insight.icon;
                    return (
                      <TableRow 
                        key={fish.slug} 
                        className={cn(
                          'group/row transition-all duration-500 border-b border-white/5 h-20 hover:bg-white/[0.03] backdrop-blur-sm',
                          curStatus === 'peak' ? 'bg-primary/[0.01]' : ''
                        )}
                      >
                        <TableCell className="px-8 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-card border border-white/5 flex items-center justify-center group-hover/row:scale-110 group-hover/row:border-primary/30 transition-all duration-500 shadow-xl"
                              onClick={() => router.push(`/${locale}/chef-tools/ingredients/${fish.slug}`)}
                            >
                              {fish.image
                                ? <Image src={fish.image} alt={fish.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                                : <Fish className="h-6 w-6 text-muted-foreground/20" />}
                            </div>
                            <div className="cursor-pointer" onClick={() => router.push(`/${locale}/chef-tools/ingredients/${fish.slug}`)}>
                              <div className="font-black text-foreground uppercase tracking-tighter italic text-[16px] leading-none group-hover/row:text-primary transition-colors">
                                {fish.name}
                              </div>
                              <div className={cn('flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest mt-1.5 opacity-60 group-hover/row:opacity-100 transition-all', insight.cls)}>
                                <InsightIcon className="h-3 w-3 shrink-0" />
                                {insight.text}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        {fish.months.map((avail, mi) => (
                          <TableCell key={mi}
                            className={cn("p-1 text-center relative group/cell", mi === currentMonth && "bg-primary/[0.01]")}
                            onMouseEnter={() => setTooltip({ fishIdx: fi, monthIdx: mi })}
                            onMouseLeave={() => setTooltip(null)}>
                            
                            {/* Vertical Beam for current month */}
                            {mi === currentMonth && (
                                <div className="absolute inset-y-0 left-0 right-0 bg-primary/[0.02] pointer-events-none group-hover/row:bg-primary/[0.05] transition-colors" />
                            )}
                            
                            <div className={cn(
                              'w-3.5 h-3.5 mx-auto rounded-full cursor-default transition-all duration-500 relative z-10',
                              'group-hover/cell:scale-150 group-hover/cell:shadow-[0_0_25px_white] group-hover/cell:ring-2 group-hover/cell:ring-white/20',
                              dotStyles[avail]
                            )} />
                            
                            {tooltip?.fishIdx === fi && tooltip?.monthIdx === mi && (
                              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <div className="bg-popover text-popover-foreground text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-2xl whitespace-nowrap min-w-[160px] space-y-2">
                                  <div className={cn('flex items-center gap-2 text-[11px]', statusTextClass[avail])}>
                                    <div className={cn('w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]', statusDotClass[avail])} />
                                    {i18n.season[avail]}
                                  </div>
                                  <div className="text-muted-foreground pb-2 border-b border-white/5">{monthHeaders[mi]} 2026</div>
                                  <div className="space-y-1">
                                    {avail === 'peak' && <div className="text-emerald-500 flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Peak availability</div>}
                                    {avail === 'good' && <div className="text-amber-500 flex items-center gap-2"><Check className="h-3 w-3" /> Stable harvest</div>}
                                    {avail === 'limited' && <div className="text-orange-500 flex items-center gap-2"><TrendingDown className="h-3 w-3" /> Scarce stocks</div>}
                                    {avail === 'off' && <div className="text-muted-foreground/40 flex items-center gap-2"><AlertTriangle className="h-3 w-3" /> Season closed</div>}
                                  </div>
                                </div>
                                <div className="w-2.5 h-2.5 bg-popover border-r border-b border-white/10 rotate-45 mx-auto -mt-1.5" />
                              </div>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="px-4 text-center">
                          <button onClick={() => setChartFish(fish)} className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground/20 hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20 bg-white/5">
                            <BarChart2 className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {displayed.length === 0 && (
              <div className="py-24 text-center space-y-4">
                <div className="text-4xl grayscale opacity-20 animate-bounce">🐟</div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">No oceanic results in current parameters</p>
              </div>
            )}
          </div>
        )}

        {/* CARD VIEW */}
        {view === 'card' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayed.map((fish) => {
              const curStatus = fish.months[currentMonth];
              const peakMonths = fish.months.map((a, i) => ({ a, i })).filter((x) => x.a === 'peak').map((x) => monthHeaders[x.i] ?? MONTH_SHORT[x.i]);
              return (
                <Card key={fish.slug} className="group hover:border-primary/30 transition-all duration-700 rounded-[2.5rem] bg-card/30 backdrop-blur-3xl border-white/5 overflow-hidden shadow-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-5 mb-8">
                      <div 
                        className="w-16 h-16 rounded-[1.5rem] overflow-hidden shrink-0 bg-card border border-white/5 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:border-primary/30 transition-all duration-700 cursor-pointer"
                        onClick={() => router.push(`/${locale}/chef-tools/ingredients/${fish.slug}`)}
                      >
                        {fish.image ? <Image src={fish.image} alt={fish.name} width={64} height={64} className="w-full h-full object-cover" unoptimized /> : <Fish className="h-8 w-8 text-muted-foreground/20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-black text-foreground uppercase tracking-tighter italic text-xl leading-none group-hover:text-primary transition-colors cursor-pointer"
                          onClick={() => router.push(`/${locale}/chef-tools/ingredients/${fish.slug}`)}
                        >
                          {fish.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                          {fish.isSushi && (
                            <Badge variant="outline" className="text-[8px] h-5 px-1.5 font-black text-primary border-primary/20 uppercase tracking-widest bg-primary/5">sushi</Badge>
                          )}
                          <div className={cn("text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1")}>
                            {fish.waterType === 'sea' ? <><Waves className="h-3 w-3" /> sea stock</> : <><Mountain className="h-3 w-3" /> fresh stock</>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setChartFish(fish)} className="text-muted-foreground/20 hover:text-primary hover:scale-110 transition-all p-2 rounded-full hover:bg-primary/5">
                        <BarChart2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Harvest Dynamics</span>
                            <div className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", statusTextClass[curStatus])}>
                                <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentColor]", statusDotClass[curStatus])} />
                                {i18n.season[curStatus]}
                            </div>
                        </div>
                        <SeasonChart months={fish.months} monthHeaders={monthHeaders} currentMonth={currentMonth} />
                    </div>

                    {peakMonths.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-white/5">
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity">
                          Peak Focus: {peakMonths.slice(0, 3).join(', ')}{peakMonths.length > 3 ? '...' : ''}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* SMART MODE */}
        {view === 'smart' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center gap-4 px-8 py-6 rounded-[2.5rem] bg-card/40 border border-primary/10 shadow-2xl backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <Brain className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-black uppercase tracking-[0.3em] text-primary leading-none">Smart Culinary Ranking</div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60 mt-1.5">AI-driven availability score based on seasonal stock data 2026</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayed.map((fish) => (
                <SmartModeCard key={fish.slug} fish={fish} currentMonth={currentMonth}
                  monthHeaders={monthHeaders} i18n={i18n} locale={locale} onShowChart={setChartFish} />
              ))}
            </div>
          </div>
        )}

        {/* ── Colour Legend ── */}
        <div className="mt-20 flex justify-center pb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <ColourLegend i18n={i18n} />
        </div>
      </div>
    </div>
  );
}

