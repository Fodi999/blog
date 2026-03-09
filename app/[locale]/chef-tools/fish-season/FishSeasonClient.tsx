'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Search, Grid3X3, Table2, Share2, Check, Flame, BarChart2, X, MapPin, Waves, Mountain, Fish } from 'lucide-react';
import type { BestRightNowResponse, FishSeasonStatus } from '@/lib/api';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

/** Per-region data for a single fish: status now + peak month range label */
export type RegionEntry = {
  status: Availability;
  /** e.g. "Apr–Sep" or "—" */
  peakRange: string;
};
/** slug → region-code → entry */
export type RegionRows = Record<string, Partial<Record<string, RegionEntry>>>;

// ─── Constants ────────────────────────────────────────────────────────────────

const dotStyles: Record<Availability, string> = {
  peak:    'bg-primary shadow-sm shadow-primary/40',
  good:    'bg-lime-500 dark:bg-lime-400',
  limited: 'bg-amber-400 dark:bg-amber-300',
  off:     'bg-muted border-2 border-border/60',
};

const barStyles: Record<Availability, string> = {
  peak:    'bg-primary',
  good:    'bg-lime-500',
  limited: 'bg-amber-400',
  off:     'bg-muted border border-border/40',
};

const statusScore: Record<Availability, number> = { peak: 3, good: 2, limited: 1, off: 0 };

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─── Region compare strip ─────────────────────────────────────────────────────

const REGION_LABELS: Record<string, string> = {
  GLOBAL: 'Global', PL: 'Poland', EU: 'EU', ES: 'Spain', UA: 'Ukraine',
};
const REGION_ORDER = ['PL', 'EU', 'ES', 'UA', 'GLOBAL'];

const statusDotClass: Record<Availability, string> = {
  peak:    'bg-primary',
  good:    'bg-lime-500',
  limited: 'bg-amber-400',
  off:     'bg-border/60',
};
const statusTextClass: Record<Availability, string> = {
  peak:    'text-primary font-black',
  good:    'text-lime-600 dark:text-lime-400 font-bold',
  limited: 'text-amber-500 font-bold',
  off:     'text-muted-foreground/40 font-medium',
};

function RegionCompare({
  slug,
  regionRows,
  activeRegion,
}: {
  slug: string;
  regionRows: RegionRows;
  activeRegion?: string;
}) {
  const entries = regionRows[slug];
  if (!entries) return null;

  const filled = REGION_ORDER.filter((r) => entries[r]);
  if (filled.length === 0) return null;

  // Don't show if all regions are identical
  const statuses = filled.map((r) => entries[r]!.status);
  const ranges = filled.map((r) => entries[r]!.peakRange);
  const allSame = statuses.every((s) => s === statuses[0]) && ranges.every((r) => r === ranges[0]);
  if (allSame) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/30 space-y-1">
      {filled.map((r) => {
        const e = entries[r]!;
        const isActive = r === activeRegion;
        return (
          <div
            key={r}
            className={`flex items-center gap-2 rounded-lg px-2 py-0.5 transition-colors ${
              isActive ? 'bg-primary/5' : ''
            }`}
          >
            {/* Region code badge */}
            <span className={`text-[9px] font-black uppercase tracking-wider w-8 shrink-0 ${
              isActive ? 'text-primary' : 'text-muted-foreground/60'
            }`}>
              {r === 'GLOBAL' ? 'GL' : r}
            </span>
            {/* Status dot */}
            <div className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass[e.status]}`} />
            {/* Status + range */}
            <span className={`text-[10px] leading-none ${statusTextClass[e.status]}`}>
              {e.status}
            </span>
            {e.peakRange !== '—' && (
              <span className="text-[9px] text-muted-foreground/60 font-medium ml-auto">
                {e.peakRange}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function SeasonChart({ months, monthHeaders, currentMonth }: {
  months: Availability[];
  monthHeaders: string[];
  currentMonth: number;
}) {
  return (
    <div className="flex items-end gap-[3px] h-10">
      {months.map((a, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
          <div
            className={`w-full rounded-sm transition-all ${barStyles[a]} ${
              i === currentMonth ? 'ring-1 ring-primary ring-offset-1' : ''
            }`}
            style={{ height: `${Math.max(4, statusScore[a] * 11)}px` }}
          />
          <span className={`text-[6px] font-bold leading-none ${
            i === currentMonth ? 'text-primary' : 'text-muted-foreground/50'
          }`}>
            {(monthHeaders[i] ?? MONTH_SHORT[i]).slice(0, 1)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Chart modal ─────────────────────────────────────────────────────────────

function ChartModal({ fish, monthHeaders, currentMonth, i18n, regionRows, activeRegion, onClose }: {
  fish: FishRow;
  monthHeaders: string[];
  currentMonth: number;
  i18n: I18n;
  regionRows?: RegionRows;
  activeRegion?: string;
  onClose: () => void;
}) {
  const maxH = 80;

  // Compute region rows for this fish (only if regions actually differ)
  const regionEntries = regionRows?.[fish.slug];
  const filledRegions = regionEntries ? REGION_ORDER.filter((r) => regionEntries[r]) : [];
  const showRegions = filledRegions.length > 1 && (() => {
    const statuses = filledRegions.map((r) => regionEntries![r]!.status);
    const ranges   = filledRegions.map((r) => regionEntries![r]!.peakRange);
    return !(statuses.every((s) => s === statuses[0]) && ranges.every((r) => r === ranges[0]));
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-3xl border border-border/60 shadow-2xl p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
                {fish.waterType === 'sea' ? (
                  <Waves className="h-3 w-3" />
                ) : fish.waterType === 'freshwater' ? (
                  <Mountain className="h-3 w-3" />
                ) : (
                  <><Waves className="h-3 w-3" /><Mountain className="h-3 w-3" /></>
                )}
                {fish.waterType}
                {fish.isSushi ? ' · sushi' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-1.5 mb-3" style={{ height: `${maxH + 24}px` }}>
          {fish.months.map((a, i) => {
            const h = Math.max(4, statusScore[a] * (maxH / 3));
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-full rounded-t-md transition-all ${barStyles[a]} ${
                    i === currentMonth ? 'ring-2 ring-primary ring-offset-1' : ''
                  }`}
                  style={{ height: `${h}px` }}
                />
                <span className={`text-[9px] font-bold ${i === currentMonth ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  {(monthHeaders[i] ?? MONTH_SHORT[i]).slice(0, 1)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-3 border-t border-border/40 mb-0">
          {(['peak','good','limited','off'] as Availability[]).map((a) => (
            <div key={a} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${barStyles[a]} border border-border/20`} />
              <span className="text-[10px] text-muted-foreground font-medium capitalize">{i18n.season[a]}</span>
            </div>
          ))}
        </div>

        {/* Region comparison table */}
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
                  <div
                    key={r}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                      isActive ? 'bg-primary/8 ring-1 ring-primary/20' : 'bg-muted/30'
                    }`}
                  >
                    {/* Region label */}
                    <span className={`text-[11px] font-black uppercase tracking-wider w-10 shrink-0 ${
                      isActive ? 'text-primary' : 'text-muted-foreground/70'
                    }`}>
                      {r === 'GLOBAL' ? 'GL' : r}
                    </span>
                    {/* Status dot + name */}
                    <div className="flex items-center gap-1.5 flex-1">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass[e.status]}`} />
                      <span className={`text-[11px] leading-none ${statusTextClass[e.status]}`}>
                        {e.status}
                      </span>
                    </div>
                    {/* Season range */}
                    <span className={`text-[11px] font-mono font-semibold shrink-0 ${
                      e.peakRange === '—' ? 'text-muted-foreground/30' : 'text-muted-foreground/70'
                    }`}>
                      {e.peakRange}
                    </span>
                    {/* Active marker */}
                    {isActive && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-primary/60 border border-primary/20 rounded px-1 shrink-0">
                        you
                      </span>
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

// ─── Component ────────────────────────────────────────────────────────────────

export function FishSeasonClient({
  rows,
  monthHeaders,
  i18n,
  bestRightNow,
  regionRows,
  activeRegion,
}: {
  rows: FishRow[];
  monthHeaders: string[];
  i18n: I18n;
  bestRightNow: BestRightNowResponse | null;
  regionRows?: RegionRows;
  activeRegion?: string;
}) {
  const currentMonth = new Date().getMonth();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sea' | 'freshwater' | 'sushi'>('all');
  const [peakOnly, setPeakOnly] = useState(false);
  const [sort, setSort] = useState<'peak' | 'alpha'>('peak');
  const [view, setView] = useState<'table' | 'card'>('table');
  const [copied, setCopied] = useState(false);
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

  // ── Share ───────────────────────────────────────────────────────────────────
  function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Best fish in ${MONTH_FULL[currentMonth]} — ${url}`;
    if (navigator.share) {
      navigator.share({ title: `Fish in ${MONTH_FULL[currentMonth]}`, text, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Chart modal ───────────────────────────────────────────────────── */}
      {chartFish && (
        <ChartModal
          fish={chartFish}
          monthHeaders={monthHeaders}
          currentMonth={currentMonth}
          i18n={i18n}
          regionRows={regionRows}
          activeRegion={activeRegion}
          onClose={() => setChartFish(null)}
        />
      )}

      {/* ── Best Right Now ────────────────────────────────────────────────── */}
      {bestRightNow && (bestRightNow.peak.length > 0 || bestRightNow.also_good.length > 0) && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary shrink-0" />
              <h2 className="font-black text-foreground uppercase tracking-tight text-sm">
                {bestRightNow.headline || i18n.bestNow}
              </h2>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <MapPin className="h-3 w-3" />
              {bestRightNow.month_name}
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium mb-4">{i18n.bestNowSubtitle}</p>

          {bestRightNow.peak.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-1">
                <Flame className="h-3 w-3" /> {i18n.season.peak}
              </p>
              <div className="flex flex-wrap gap-2">
                {bestRightNow.peak.map((fish) => (
                  <div key={fish.slug} className="flex items-center gap-1.5 bg-background border border-primary/20 rounded-xl px-2.5 py-1.5">
                    {fish.image_url && (
                      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-muted">
                        <Image src={fish.image_url} alt={fish.name} width={20} height={20} className="w-full h-full object-cover" unoptimized />
                      </div>
                    )}
                    <span className="text-xs font-bold text-foreground">{fish.name}</span>
                    {fish.sushi_grade && (
                      <Badge variant="outline" className="text-[8px] h-4 px-1 font-black text-primary border-primary/30">s</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {bestRightNow.also_good.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-lime-600 dark:text-lime-400 mb-2 flex items-center gap-1">
                <Check className="h-3 w-3" /> {i18n.season.good}
              </p>
              <div className="flex flex-wrap gap-2">
                {bestRightNow.also_good.map((fish) => (
                  <div key={fish.slug} className="flex items-center gap-1.5 bg-background border border-border/60 rounded-xl px-2.5 py-1.5">
                    {fish.image_url && (
                      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-muted">
                        <Image src={fish.image_url} alt={fish.name} width={20} height={20} className="w-full h-full object-cover" unoptimized />
                      </div>
                    )}
                    <span className="text-xs font-medium text-foreground">{fish.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Controls bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={i18n.searchPlaceholder}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Type filter badges */}
        <div className="flex gap-1.5 flex-wrap items-center">
          {([
            { id: 'all',        label: i18n.filterAll },
            { id: 'sea',        label: i18n.filterSea },
            { id: 'freshwater', label: i18n.filterFresh },
            { id: 'sushi',      label: i18n.filterSushi },
          ] as const).map((f) => (
            <Badge
              key={f.id}
              variant={filterType === f.id ? 'default' : 'outline'}
              className="cursor-pointer text-[11px] font-black uppercase tracking-wider px-3 py-1.5 h-auto"
              onClick={() => setFilterType(f.id)}
            >
              {f.label}
            </Badge>
          ))}
        </div>

        {/* Right-side controls */}
        <div className="flex gap-2 ml-auto flex-wrap items-center">
          <Badge
            variant={peakOnly ? 'default' : 'outline'}
            className="cursor-pointer text-[11px] font-black uppercase tracking-wider px-3 py-1.5 h-auto"
            onClick={() => setPeakOnly((v) => !v)}
          >
            {i18n.peakOnly}
          </Badge>

          {/* Sort select */}
          <Select value={sort} onValueChange={(v) => setSort(v as 'peak' | 'alpha')}>
            <SelectTrigger className="h-9 text-[11px] font-black uppercase tracking-wider w-auto min-w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="peak" className="text-[11px] font-bold uppercase tracking-wider">{i18n.sortPeakFirst}</SelectItem>
              <SelectItem value="alpha" className="text-[11px] font-bold uppercase tracking-wider">{i18n.sortAlpha}</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex bg-muted/50 rounded-xl p-0.5 border border-border/40">
            <button
              onClick={() => setView('table')}
              className={`p-1.5 rounded-lg transition-colors ${view === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Table2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView('card')}
              className={`p-1.5 rounded-lg transition-colors ${view === 'card' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-border/60 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Share2 className="h-3 w-3" />}
            {copied ? i18n.shareCopied : i18n.shareBtn}
          </button>
        </div>
      </div>

      {/* ── TABLE VIEW ────────────────────────────────────────────────────── */}
      {view === 'table' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
                  <TableHead className="font-black text-foreground uppercase tracking-tight text-[11px] whitespace-nowrap min-w-[160px]">
                    {i18n.fishColumn}
                  </TableHead>
                  {monthHeaders.map((m, mi) => (
                    <TableHead
                      key={mi}
                      className={`text-center font-black uppercase tracking-wider text-[10px] w-[52px] px-1.5 ${
                        mi === currentMonth
                          ? 'text-primary border-x border-primary/20'
                          : 'text-muted-foreground/70'
                      }`}
                      style={mi === currentMonth ? { backgroundColor: 'rgba(239,68,68,0.08)' } : undefined}
                    >
                      {m}
                      {mi === currentMonth && <div className="w-1 h-1 rounded-full bg-primary mx-auto mt-0.5" />}
                    </TableHead>
                  ))}
                  <TableHead className="text-center text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider w-[44px]">
                    <BarChart2 className="h-3 w-3 mx-auto" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((fish, fi) => (
                  <TableRow key={fish.slug} className={fi % 2 === 0 ? '' : 'bg-muted/10'}>
                    {/* Fish name cell */}
                    <TableCell className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-muted border border-border/40 flex items-center justify-center">
                          {fish.image ? (
                            <Image src={fish.image} alt={fish.name} width={36} height={36} className="w-full h-full object-cover" unoptimized />
                          ) : (
                            <Fish className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-foreground uppercase tracking-tight text-xs whitespace-nowrap">
                            {fish.name}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            {fish.waterType === 'sea' ? (
                              <Waves className="h-3 w-3 text-muted-foreground/60" />
                            ) : fish.waterType === 'freshwater' ? (
                              <Mountain className="h-3 w-3 text-muted-foreground/60" />
                            ) : (
                              <><Waves className="h-3 w-3 text-muted-foreground/60" /><Mountain className="h-3 w-3 text-muted-foreground/60" /></>
                            )}
                            {fish.isSushi && (
                              <Badge variant="outline" className="text-[8px] h-4 px-1 font-black text-primary border-primary/20">sushi</Badge>
                            )}
                            {fish.live && <span className="w-1 h-1 rounded-full bg-green-500 shrink-0" title="Live" />}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Month dots */}
                    {fish.months.map((avail, mi) => (
                      <TableCell
                        key={mi}
                        className={`py-2.5 px-1.5 text-center relative group/cell`}
                        style={mi === currentMonth ? { backgroundColor: 'rgba(239,68,68,0.04)' } : undefined}
                        onMouseEnter={() => setTooltip({ fishIdx: fi, monthIdx: mi })}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <div className={`w-4 h-4 mx-auto rounded-full cursor-default transition-transform group-hover/cell:scale-125 ${dotStyles[avail]}`} />
                        {tooltip?.fishIdx === fi && tooltip?.monthIdx === mi && (
                          <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
                            <div className="bg-popover text-popover-foreground text-[10px] font-bold px-3 py-2 rounded-xl shadow-xl border border-border/60 whitespace-nowrap min-w-[110px]">
                              <div className="font-black text-[11px] mb-0.5">
                                {avail !== 'off' ? (
                                  <span className={avail === 'peak' ? 'text-primary' : avail === 'good' ? 'text-lime-600 dark:text-lime-400' : 'text-amber-500'}>
                                    {i18n.season[avail]}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">{i18n.season.off}</span>
                                )}
                              </div>
                              <div className="text-muted-foreground font-medium">{monthHeaders[mi] ?? MONTH_SHORT[mi]}</div>
                              <div className="text-muted-foreground/70 font-medium mt-0.5 text-[9px] uppercase tracking-wider flex items-center gap-1">
                                {fish.waterType === 'sea' ? (
                                  <><Waves className="h-2.5 w-2.5" /> Sea</>
                                ) : fish.waterType === 'freshwater' ? (
                                  <><Mountain className="h-2.5 w-2.5" /> Freshwater</>
                                ) : (
                                  <><Waves className="h-2.5 w-2.5" /><Mountain className="h-2.5 w-2.5" /> Both</>
                                )}
                              </div>
                            </div>
                            <div className="w-2 h-2 bg-popover border-r border-b border-border/60 rotate-45 mx-auto -mt-1" />
                          </div>
                        )}
                      </TableCell>
                    ))}

                    {/* Chart button */}
                    <TableCell className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => setChartFish(fish)}
                        className="p-1 rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Show chart"
                      >
                        <BarChart2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {displayed.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-10 font-medium">No results</p>
          )}
        </Card>
      )}

      {/* ── CARD VIEW ─────────────────────────────────────────────────────── */}
      {view === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((fish) => {
            const peakMonths = fish.months
              .map((a, i) => ({ a, i }))
              .filter((x) => x.a === 'peak')
              .map((x) => monthHeaders[x.i] ?? MONTH_SHORT[x.i]);

            const curStatus = fish.months[currentMonth];
            const isAvailable = curStatus === 'peak' || curStatus === 'good' || curStatus === 'limited';

            return (
              <Card
                key={fish.slug}
                className="hover:border-primary/30 hover:shadow-md transition-all"
              >
                <CardContent className="p-5">
                  {/* Card header */}
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted border border-border/40 flex items-center justify-center">
                      {fish.image ? (
                        <Image src={fish.image} alt={fish.name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <Fish className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-foreground uppercase tracking-tight text-sm leading-tight">
                        {fish.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {fish.isSushi && (
                          <Badge variant="outline" className="text-[9px] h-5 px-1.5 font-black text-primary border-primary/20">sushi</Badge>
                        )}
                        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-0.5">
                          {fish.waterType === 'sea' ? (
                            <><Waves className="h-3 w-3" /> sea</>
                          ) : fish.waterType === 'freshwater' ? (
                            <><Mountain className="h-3 w-3" /> fresh</>
                          ) : (
                            <><Waves className="h-3 w-3" /><Mountain className="h-3 w-3" /></>
                          )}
                        </span>
                        {fish.wildFarmed && fish.wildFarmed !== 'both' && (
                          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                            {fish.wildFarmed === 'wild' ? 'wild' : 'farmed'}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Status badge + chart btn */}
                    <div className="flex flex-col items-end gap-1.5">
                      {isAvailable && (
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-black uppercase tracking-wider ${
                            curStatus === 'peak'
                              ? 'ds-score-high'
                              : curStatus === 'good'
                              ? 'bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-400/20'
                          }`}
                        >
                          {i18n.season[curStatus as Availability]}
                        </Badge>
                      )}
                      <button
                        onClick={() => setChartFish(fish)}
                        className="p-1 rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Show chart"
                      >
                        <BarChart2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Season mini chart */}
                  <SeasonChart months={fish.months} monthHeaders={monthHeaders} currentMonth={currentMonth} />

                  {/* Peak info */}
                  {peakMonths.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-3 font-medium">
                      Peak: {peakMonths.join(', ')}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {displayed.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground text-sm py-10 font-medium">No results</p>
          )}
        </div>
      )}
    </div>
  );
}
