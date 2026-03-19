'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Search, Grid3X3, Table2, Share2, Check, Flame, BarChart2, X, MapPin,
  Waves, Mountain, Fish, Brain, ChefHat, Utensils, Soup, TrendingUp,
  TrendingDown, Star, AlertTriangle, Lightbulb, Trophy, Minus
} from 'lucide-react';
import type { BestRightNowResponse, FishSeasonStatus } from '@/lib/api';

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
  peak:    'bg-emerald-500 shadow-sm shadow-emerald-500/40',
  good:    'bg-amber-400 dark:bg-amber-300',
  limited: 'bg-orange-400 dark:bg-orange-300',
  off:     'bg-muted border-2 border-border/60',
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
  // render as ▁▂▃▆▇█ style blocks
  const HEIGHT = [0, 4, 8, 14]; // off/limited/good/peak → px
  return (
    <div className="flex items-end gap-[2px] h-[18px] mt-1">
      {months.map((a, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 rounded-sm transition-all',
            barStyles[a],
            i === currentMonth && 'ring-1 ring-offset-[1px] ring-foreground/30'
          )}
          style={{ height: `${Math.max(3, HEIGHT[statusScore[a]])}px` }}
          title={MONTH_SHORT[i]}
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
    <div className="flex items-end gap-[3px] h-10">
      {months.map((a, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
          <div
            className={cn('w-full rounded-sm transition-all', barStyles[a], i === currentMonth && 'ring-1 ring-primary ring-offset-1')}
            style={{ height: `${Math.max(4, statusScore[a] * 11)}px` }}
          />
          <span className={cn('text-[6px] font-bold leading-none', i === currentMonth ? 'text-primary' : 'text-muted-foreground/50')}>
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
    <div className="mt-3 pt-3 border-t border-border/30 space-y-1">
      {filled.map((r) => {
        const e = entries[r]!;
        const isActive = r === activeRegion;
        return (
          <div key={r} className={cn('flex items-center gap-2 rounded-lg px-2 py-0.5 transition-colors', isActive && 'bg-primary/5')}>
            <span className={cn('text-[9px] font-black uppercase tracking-wider w-8 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground/60')}>
              {r === 'GLOBAL' ? 'GL' : r}
            </span>
            <div className={cn('w-2 h-2 rounded-full shrink-0', statusDotClass[e.status])} />
            <span className={cn('text-[10px] leading-none', statusTextClass[e.status])}>{e.status}</span>
            {e.peakRange !== '—' && (
              <span className="text-[9px] text-muted-foreground/60 font-medium ml-auto">{e.peakRange}</span>
            )}
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
  const maxH = 80;
  const regionEntries = regionRows?.[fish.slug];
  const filledRegions = regionEntries ? REGION_ORDER.filter((r) => regionEntries[r]) : [];
  const showRegions = filledRegions.length > 1 && (() => {
    const statuses = filledRegions.map((r) => regionEntries![r]!.status);
    const ranges   = filledRegions.map((r) => regionEntries![r]!.peakRange);
    return !(statuses.every((s) => s === statuses[0]) && ranges.every((r) => r === ranges[0]));
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-3xl border border-border/60 shadow-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {fish.image && (
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-muted border border-border/40">
                <Image src={fish.image} alt={fish.name} width={40} height={40} className="w-full h-full object-cover" unoptimized />
              </div>
            )}
            <div>
              <h3 className="font-black text-foreground uppercase tracking-tight text-base">{fish.name}</h3>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                {fish.waterType === 'sea' ? <Waves className="h-3 w-3" /> : fish.waterType === 'freshwater' ? <Mountain className="h-3 w-3" /> : <><Waves className="h-3 w-3" /><Mountain className="h-3 w-3" /></>}
                {fish.waterType}{fish.isSushi ? ' · sushi' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>

        <div className="flex items-end gap-1.5 mb-3" style={{ height: `${maxH + 24}px` }}>
          {fish.months.map((a, i) => {
            const h = Math.max(4, statusScore[a] * (maxH / 3));
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className={cn('w-full rounded-t-md transition-all', barStyles[a], i === currentMonth && 'ring-2 ring-primary ring-offset-1')} style={{ height: `${h}px` }} />
                <span className={cn('text-[9px] font-bold', i === currentMonth ? 'text-primary' : 'text-muted-foreground/60')}>
                  {(monthHeaders[i] ?? MONTH_SHORT[i]).slice(0, 1)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 pt-3 border-t border-border/40 mb-0">
          {(['peak','good','limited','off'] as Availability[]).map((a) => (
            <div key={a} className="flex items-center gap-1.5">
              <div className={cn('w-3 h-3 rounded-sm border border-border/20', barStyles[a])} />
              <span className="text-[10px] text-muted-foreground font-medium capitalize">{i18n.season[a]}</span>
            </div>
          ))}
        </div>

        {showRegions && regionEntries && (
          <div className="mt-4 pt-4 border-t border-border/40">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> By region
            </p>
            <div className="space-y-1">
              {filledRegions.map((r) => {
                const e = regionEntries[r]!;
                const isActive = r === activeRegion;
                return (
                  <div key={r} className={cn('flex items-center gap-3 rounded-xl px-3 py-2 transition-colors', isActive ? 'bg-primary/8 ring-1 ring-primary/20' : 'bg-muted/30')}>
                    <span className={cn('text-[11px] font-black uppercase tracking-wider w-10 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground/70')}>
                      {r === 'GLOBAL' ? 'GL' : r}
                    </span>
                    <div className="flex items-center gap-1.5 flex-1">
                      <div className={cn('w-2 h-2 rounded-full shrink-0', statusDotClass[e.status])} />
                      <span className={cn('text-[11px] leading-none', statusTextClass[e.status])}>{e.status}</span>
                    </div>
                    <span className={cn('text-[11px] font-mono font-semibold shrink-0', e.peakRange === '—' ? 'text-muted-foreground/30' : 'text-muted-foreground/70')}>
                      {e.peakRange}
                    </span>
                    {isActive && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-primary/60 border border-primary/20 rounded px-1 shrink-0">you</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Smart Mode card ─────────────────────────────────────────────────────────

function SmartModeCard({ fish, currentMonth, monthHeaders, i18n, onShowChart }: {
  fish: FishRow; currentMonth: number; monthHeaders: string[]; i18n: I18n;
  onShowChart: (f: FishRow) => void;
}) {
  const status = fish.months[currentMonth];
  const insight = statusInsight(status, fish.isSushi);
  const InsightIcon = insight.icon;
  const peakMonths = fish.months.map((a, i) => ({ a, i })).filter(x => x.a === 'peak').map(x => (monthHeaders[x.i] ?? MONTH_SHORT[x.i]).slice(0, 3));

  const borderCls = status === 'peak'
    ? 'border-emerald-500/40 bg-emerald-500/5'
    : status === 'good'
    ? 'border-amber-400/40 bg-amber-400/5'
    : status === 'limited'
    ? 'border-orange-400/30 bg-orange-400/5'
    : 'border-border/30 bg-muted/10 opacity-60';

  return (
    <Card className={cn('transition-all hover:shadow-md', borderCls)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted border border-border/40 flex items-center justify-center">
            {fish.image
              ? <Image src={fish.image} alt={fish.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
              : <Fish className="h-6 w-6 text-muted-foreground/40" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1 mb-1">
              <h3 className="font-black text-foreground uppercase tracking-tight text-xs leading-tight">{fish.name}</h3>
              <button onClick={() => onShowChart(fish)} className="p-1 shrink-0 text-muted-foreground/40 hover:text-primary transition-colors">
                <BarChart2 className="h-3 w-3" />
              </button>
            </div>
            {/* Micro-insight */}
            <div className={cn('flex items-center gap-1 mb-2 text-[10px] font-bold', insight.cls)}>
              <InsightIcon className="h-3 w-3 shrink-0" />
              <span>{insight.text}</span>
            </div>
            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-2">
              {fish.isSushi && (
                <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-primary/10 text-primary border border-primary/20">sushi</span>
              )}
              <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-muted text-muted-foreground border border-border/30 flex items-center gap-0.5">
                {fish.waterType === 'sea' ? <Waves className="h-2.5 w-2.5" /> : fish.waterType === 'freshwater' ? <Mountain className="h-2.5 w-2.5" /> : <><Waves className="h-2.5 w-2.5" /><Mountain className="h-2.5 w-2.5" /></>}
                {fish.waterType}
              </span>
            </div>
            {/* Season strip */}
            <SeasonStrip months={fish.months} currentMonth={currentMonth} />
            {peakMonths.length > 0 && (
              <p className="text-[9px] text-muted-foreground/60 mt-1.5">Peak: {peakMonths.join(', ')}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Best Now block ───────────────────────────────────────────────────────────

function BestNowBlock({ bestRightNow, i18n, rows, currentMonth }: {
  bestRightNow: BestRightNowResponse; i18n: I18n; rows: FishRow[]; currentMonth: number;
}) {
  const monthName = MONTH_FULL[currentMonth];

  // top 3 peak fish for medal display
  const peakFish = bestRightNow.peak.slice(0, 3);
  const avoidFish = rows.filter(r => r.months[currentMonth] === 'off').slice(0, 3);

  const medals = [
    { icon: Trophy, cls: 'text-yellow-500', label: '🥇' },
    { icon: Star,   cls: 'text-slate-400',  label: '🥈' },
    { icon: Star,   cls: 'text-amber-600',  label: '🥉' },
  ];

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Flame className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="font-black text-foreground uppercase tracking-tight text-sm leading-none">
              {bestRightNow.headline || i18n.bestNow}
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">{i18n.bestNowSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 px-2 py-1 rounded-lg border border-border/30">
          <MapPin className="h-3 w-3" />
          {monthName}
        </div>
      </div>

      <div className="px-5 pb-5 grid sm:grid-cols-2 gap-4">
        {/* Medal podium */}
        {peakFish.length > 0 && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Best choice now
            </p>
            <div className="space-y-2">
              {peakFish.map((fish, idx) => (
                <div key={fish.slug} className="flex items-center gap-2.5 rounded-xl bg-background/60 border border-emerald-500/15 px-3 py-2">
                  <span className="text-sm leading-none w-5 shrink-0">{medals[idx]?.label || '•'}</span>
                  {fish.image_url && (
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-muted">
                      <Image src={fish.image_url} alt={fish.name} width={24} height={24} className="w-full h-full object-cover" unoptimized />
                    </div>
                  )}
                  <span className="text-xs font-black text-foreground">{fish.name}</span>
                  {fish.sushi_grade && (
                    <Badge variant="outline" className="text-[8px] h-4 px-1 font-black text-primary border-primary/30 ml-auto">sushi</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Also good + Avoid */}
        <div className="space-y-3">
          {bestRightNow.also_good.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                <Check className="h-3 w-3" /> Also good
              </p>
              <div className="flex flex-wrap gap-1.5">
                {bestRightNow.also_good.map((fish) => (
                  <div key={fish.slug} className="flex items-center gap-1.5 bg-background border border-border/60 rounded-lg px-2 py-1">
                    <span className="text-xs font-bold text-foreground">{fish.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {avoidFish.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-1.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Avoid now
              </p>
              <div className="flex flex-wrap gap-1.5">
                {avoidFish.map((fish) => (
                  <div key={fish.slug} className="flex items-center gap-1.5 bg-rose-500/5 border border-rose-500/20 rounded-lg px-2 py-1">
                    <Minus className="h-2.5 w-2.5 text-rose-400" />
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 line-through decoration-rose-400/50">{fish.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chef tip */}
      <div className="mx-5 mb-5 rounded-xl bg-muted/30 border border-border/30 px-4 py-3 flex items-start gap-2">
        <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">Chef tip</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {currentMonth >= 2 && currentMonth <= 4
              ? 'Spring: sea fish at peak. Avoid freshwater — spawning season.'
              : currentMonth >= 5 && currentMonth <= 7
              ? 'Summer: great for grilling. Check live availability.'
              : currentMonth >= 8 && currentMonth <= 10
              ? 'Autumn: salmon & herring season. Perfect for curing.'
              : 'Winter: go for sea fish. Fatty fish excellent for smoking.'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Colour legend ────────────────────────────────────────────────────────────

function ColourLegend({ i18n }: { i18n: I18n }) {
  const items = [
    { cls: dotStyles.peak,    label: i18n.season.peak,    sub: 'Best time' },
    { cls: dotStyles.good,    label: i18n.season.good,    sub: 'OK' },
    { cls: dotStyles.limited, label: i18n.season.limited, sub: 'Avoid' },
    { cls: dotStyles.off,     label: i18n.season.off,     sub: 'Not available' },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-muted-foreground">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={cn('w-3 h-3 rounded-full shrink-0', item.cls)} />
          <span className="font-bold">{item.label}</span>
          <span className="opacity-60">— {item.sub}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FishSeasonClient({
  rows, monthHeaders, i18n, bestRightNow, regionRows, activeRegion,
}: {
  rows: FishRow[]; monthHeaders: string[]; i18n: I18n;
  bestRightNow: BestRightNowResponse | null;
  regionRows?: RegionRows; activeRegion?: string;
}) {
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

      {/* ── Chart modal ── */}
      {chartFish && (
        <ChartModal fish={chartFish} monthHeaders={monthHeaders} currentMonth={currentMonth}
          i18n={i18n} regionRows={regionRows} activeRegion={activeRegion} onClose={() => setChartFish(null)} />
      )}

      {/* ── Best Right Now ── */}
      {bestRightNow && (bestRightNow.peak.length > 0 || bestRightNow.also_good.length > 0) && (
        <BestNowBlock bestRightNow={bestRightNow} i18n={i18n} rows={rows} currentMonth={currentMonth} />
      )}

      {/* ── Controls bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={i18n.searchPlaceholder} className="pl-9 h-9 text-xs" />
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5 flex-wrap items-center">
          {([
            { id: 'all',        label: i18n.filterAll },
            { id: 'sea',        label: i18n.filterSea },
            { id: 'freshwater', label: i18n.filterFresh },
            { id: 'sushi',      label: i18n.filterSushi },
          ] as const).map((f) => (
            <Badge key={f.id} variant={filterType === f.id ? 'default' : 'outline'}
              className="cursor-pointer text-[11px] font-black uppercase tracking-wider px-3 py-1.5 h-auto"
              onClick={() => setFilterType(f.id)}>
              {f.label}
            </Badge>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex gap-2 ml-auto flex-wrap items-center">
          <Badge variant={peakOnly ? 'default' : 'outline'}
            className="cursor-pointer text-[11px] font-black uppercase tracking-wider px-3 py-1.5 h-auto"
            onClick={() => setPeakOnly((v) => !v)}>
            {i18n.peakOnly}
          </Badge>

          <Select value={sort} onValueChange={(v) => setSort(v as 'peak' | 'alpha')}>
            <SelectTrigger className="h-9 text-[11px] font-black uppercase tracking-wider w-auto min-w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="peak" className="text-[11px] font-bold uppercase tracking-wider">{i18n.sortPeakFirst}</SelectItem>
              <SelectItem value="alpha" className="text-[11px] font-bold uppercase tracking-wider">{i18n.sortAlpha}</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle: Table / Card / Smart */}
          <div className="flex bg-muted/50 rounded-xl p-0.5 border border-border/40">
            <button onClick={() => setView('table')}
              className={cn('p-1.5 rounded-lg transition-colors', view === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
              title={i18n.tableView}>
              <Table2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setView('card')}
              className={cn('p-1.5 rounded-lg transition-colors', view === 'card' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
              title={i18n.cardView}>
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setView('smart')}
              className={cn('p-1.5 rounded-lg transition-colors', view === 'smart' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground')}
              title="Smart mode">
              <Brain className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Share dropdown */}
          <div className="relative" ref={shareRef}>
            <button
              onClick={() => setShareOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-border/60 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Share2 className="h-3 w-3" />}
              {copied ? i18n.shareCopied : i18n.shareBtn}
            </button>

            {shareOpen && (
              <div className="absolute right-0 mt-2 z-50 w-48 rounded-2xl border border-border/50 bg-background shadow-xl overflow-hidden">
                {/* Telegram */}
                <button
                  onClick={() => handleShareTo('telegram')}
                  className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold hover:bg-muted/60 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#26A5E4] shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Telegram
                </button>
                {/* WhatsApp */}
                <button
                  onClick={() => handleShareTo('whatsapp')}
                  className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold hover:bg-muted/60 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#25D366] shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </button>
                <div className="h-px bg-border/40 mx-3" />
                {/* Copy link */}
                <button
                  onClick={handleCopyLink}
                  className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold hover:bg-muted/60 transition-colors"
                >
                  {copied
                    ? <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    : <Share2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  {copied ? i18n.shareCopied : i18n.shareBtn}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Colour legend ── */}
      {view === 'table' && <ColourLegend i18n={i18n} />}

      {/* ── TABLE VIEW ── */}
      {view === 'table' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
                  <TableHead className="font-black text-foreground uppercase tracking-tight text-[11px] whitespace-nowrap min-w-[180px]">
                    {i18n.fishColumn}
                  </TableHead>
                  {monthHeaders.map((m, mi) => (
                    <TableHead key={mi}
                      className={cn('text-center font-black uppercase tracking-wider text-[10px] w-[52px] px-1.5',
                        mi === currentMonth ? 'text-primary border-x border-emerald-500/20' : 'text-muted-foreground/70')}
                      style={mi === currentMonth ? { backgroundColor: 'rgba(16,185,129,0.06)' } : undefined}>
                      {m}
                      {mi === currentMonth && <div className="w-1 h-1 rounded-full bg-emerald-500 mx-auto mt-0.5" />}
                    </TableHead>
                  ))}
                  <TableHead className="text-center text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider w-[44px]">
                    <BarChart2 className="h-3 w-3 mx-auto" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((fish, fi) => {
                  const curStatus = fish.months[currentMonth];
                  const insight = statusInsight(curStatus, fish.isSushi);
                  const InsightIcon = insight.icon;
                  return (
                    <TableRow key={fish.slug} className={cn(fi % 2 === 0 ? '' : 'bg-muted/10', 'group/row')}>
                      {/* Fish name cell */}
                      <TableCell className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-muted border border-border/40 flex items-center justify-center mt-0.5">
                            {fish.image
                              ? <Image src={fish.image} alt={fish.name} width={36} height={36} className="w-full h-full object-cover" unoptimized />
                              : <Fish className="h-5 w-5 text-muted-foreground/50" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-foreground uppercase tracking-tight text-xs">{fish.name}</span>
                            {/* Micro-insight row */}
                            <div className={cn('flex items-center gap-1 text-[9px] font-bold mt-0.5', insight.cls)}>
                              <InsightIcon className="h-2.5 w-2.5 shrink-0" />
                              <span>{insight.text}</span>
                            </div>
                            {/* Tags */}
                            <div className="flex items-center gap-1 mt-0.5">
                              {fish.waterType === 'sea' ? <Waves className="h-3 w-3 text-muted-foreground/60" />
                                : fish.waterType === 'freshwater' ? <Mountain className="h-3 w-3 text-muted-foreground/60" />
                                : <><Waves className="h-3 w-3 text-muted-foreground/60" /><Mountain className="h-3 w-3 text-muted-foreground/60" /></>}
                              {fish.isSushi && (
                                <Badge variant="outline" className="text-[8px] h-4 px-1 font-black text-primary border-primary/20">sushi</Badge>
                              )}
                              {fish.live && <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" title="Live" />}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Month dots */}
                      {fish.months.map((avail, mi) => (
                        <TableCell key={mi}
                          className="py-2.5 px-1.5 text-center relative group/cell"
                          style={mi === currentMonth ? { backgroundColor: 'rgba(16,185,129,0.04)' } : undefined}
                          onMouseEnter={() => setTooltip({ fishIdx: fi, monthIdx: mi })}
                          onMouseLeave={() => setTooltip(null)}>
                          <div className={cn('w-4 h-4 mx-auto rounded-full cursor-default transition-transform group-hover/cell:scale-125', dotStyles[avail])} />
                          {tooltip?.fishIdx === fi && tooltip?.monthIdx === mi && (
                            <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
                              <div className="bg-popover text-popover-foreground text-[10px] font-bold px-3 py-2.5 rounded-xl shadow-xl border border-border/60 whitespace-nowrap min-w-[140px] space-y-1">
                                <div className={cn('font-black text-[11px] flex items-center gap-1.5', statusTextClass[avail])}>
                                  <div className={cn('w-2 h-2 rounded-full', statusDotClass[avail])} />
                                  {i18n.season[avail]}
                                </div>
                                <div className="text-muted-foreground font-medium">{monthHeaders[mi] ?? MONTH_SHORT[mi]}</div>
                                {/* Enriched tooltip */}
                                {avail === 'peak' && <div className="text-emerald-600 dark:text-emerald-400 text-[9px] flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5" /> Best quality &amp; price</div>}
                                {avail === 'good' && <div className="text-amber-500 text-[9px] flex items-center gap-1"><Check className="h-2.5 w-2.5" /> Good availability</div>}
                                {avail === 'limited' && <div className="text-orange-500 text-[9px] flex items-center gap-1"><TrendingDown className="h-2.5 w-2.5" /> Price may be higher</div>}
                                {avail === 'off' && <div className="text-muted-foreground/50 text-[9px] flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5" /> Not recommended</div>}
                                <div className="text-muted-foreground/70 text-[9px] uppercase tracking-wider flex items-center gap-1 pt-0.5 border-t border-border/30">
                                  {fish.waterType === 'sea' ? <><Waves className="h-2.5 w-2.5" /> Sea</>
                                    : fish.waterType === 'freshwater' ? <><Mountain className="h-2.5 w-2.5" /> Freshwater</>
                                    : <><Waves className="h-2.5 w-2.5" /><Mountain className="h-2.5 w-2.5" /> Both</>}
                                </div>
                              </div>
                              <div className="w-2 h-2 bg-popover border-r border-b border-border/60 rotate-45 mx-auto -mt-1" />
                            </div>
                          )}
                        </TableCell>
                      ))}

                      {/* Chart button */}
                      <TableCell className="py-2.5 px-2 text-center">
                        <button onClick={() => setChartFish(fish)}
                          className="p-1 rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors" title="Show chart">
                          <BarChart2 className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {displayed.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-10 font-medium">No results</p>
          )}
        </Card>
      )}

      {/* ── CARD VIEW ── */}
      {view === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((fish) => {
            const peakMonths = fish.months.map((a, i) => ({ a, i })).filter((x) => x.a === 'peak').map((x) => monthHeaders[x.i] ?? MONTH_SHORT[x.i]);
            const curStatus = fish.months[currentMonth];
            const isAvailable = curStatus === 'peak' || curStatus === 'good' || curStatus === 'limited';
            return (
              <Card key={fish.slug} className="hover:border-primary/30 hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted border border-border/40 flex items-center justify-center">
                      {fish.image ? <Image src={fish.image} alt={fish.name} width={56} height={56} className="w-full h-full object-cover" unoptimized /> : <Fish className="h-8 w-8 text-muted-foreground/40" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-foreground uppercase tracking-tight text-sm leading-tight">{fish.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {fish.isSushi && (
                          <Badge variant="outline" className="text-[9px] h-5 px-1.5 font-black text-primary border-primary/20">sushi</Badge>
                        )}
                        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-0.5">
                          {fish.waterType === 'sea' ? <><Waves className="h-3 w-3" /> sea</> : fish.waterType === 'freshwater' ? <><Mountain className="h-3 w-3" /> fresh</> : <><Waves className="h-3 w-3" /><Mountain className="h-3 w-3" /></>}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {isAvailable && (
                        <Badge variant="outline" className={cn('text-[9px] font-black uppercase tracking-wider',
                          curStatus === 'peak' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : curStatus === 'good' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-400/20')}>
                          {i18n.season[curStatus as Availability]}
                        </Badge>
                      )}
                      <button onClick={() => setChartFish(fish)} className="p-1 rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors">
                        <BarChart2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <SeasonChart months={fish.months} monthHeaders={monthHeaders} currentMonth={currentMonth} />
                  {peakMonths.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-3 font-medium">Peak: {peakMonths.join(', ')}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {displayed.length === 0 && <p className="col-span-full text-center text-muted-foreground text-sm py-10 font-medium">No results</p>}
        </div>
      )}

      {/* ── SMART MODE ── */}
      {view === 'smart' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <Brain className="h-4 w-4 text-primary" />
            <span>Smart mode — sorted by availability now</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((fish) => (
              <SmartModeCard key={fish.slug} fish={fish} currentMonth={currentMonth}
                monthHeaders={monthHeaders} i18n={i18n} onShowChart={setChartFish} />
            ))}
          </div>
          {displayed.length === 0 && <p className="text-center text-muted-foreground text-sm py-10 font-medium">No results</p>}
        </div>
      )}
    </div>
  );
}

