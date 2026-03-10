import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { ChevronLeft, Wifi, WifiOff, Table2 } from 'lucide-react';
import { fetchFishSeasonTable, fetchBestRightNow } from '@/lib/api';
import { FishSeasonClient, type FishRow, type I18n, type Availability, type RegionRows } from './FishSeasonClient';
import { ChefToolsNav } from '../ChefToolsNav';

export const revalidate = 0; // dynamic — region can change per request

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'chefTools' });
  return genMeta({
    title: t('tools.fishSeason.title'),
    description: t('tools.fishSeason.description'),
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: '/chef-tools/fish-season',
  });
}

const VALID_REGIONS = ['GLOBAL', 'PL', 'EU', 'ES', 'UA'] as const;
type Region = (typeof VALID_REGIONS)[number];

const REGION_NAMES: Record<Region, string> = {
  GLOBAL: 'Global',
  PL: 'Poland',
  EU: 'EU',
  ES: 'Spain',
  UA: 'Ukraine',
};

/** Map API boolean season array + fish's current status → Availability per month */
function buildMonths(
  season: { month: number; available: boolean }[],
  currentStatus: Availability,
): Availability[] {
  const currentMonthIdx = new Date().getMonth();
  return Array.from({ length: 12 }, (_, i) => {
    const s = season.find((m) => m.month === i + 1);
    if (!s || !s.available) return 'off';
    if (i === currentMonthIdx) return currentStatus;
    return 'good';
  });
}

export default async function FishSeasonPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ region?: string }>;
}) {
  const { locale } = await params;
  const { region: regionParam } = await searchParams;
  const region: Region = VALID_REGIONS.includes(regionParam as Region)
    ? (regionParam as Region)
    : 'PL';

  const t = await getTranslations({ locale, namespace: 'chefTools' });

  /* ── Navigation logic ─────────────────────────────────────────────────── */

  const nav = (
    <ChefToolsNav 
        locale={locale} 
        translations={{
          back: t('back'),
          tabs: {
            tools: t('tabs.tools'),
            tables: t('tabs.tables'),
            products: t('tabs.products'),
          },
          tools: {
            converter: { title: t('tools.converter.title') },
            fishSeason: { title: t('tools.fishSeason.title') },
            ingredientAnalyzer: { title: t('tools.ingredientAnalyzer.title') },
            ingredientsCatalog: { title: t('ingredients.catalog.title') },
            nutrition: { title: t('nutrition.title') },
          }
        }} 
      />
  );

  // Fetch the selected region + all other regions + bestRightNow in parallel
  const allRegionCodes = VALID_REGIONS.filter((r) => r !== region);
  const [tableData, bestRightNow, ...otherTables] = await Promise.all([
    fetchFishSeasonTable(locale, region),
    fetchBestRightNow('seafood', locale, region),
    ...allRegionCodes.map((r) => fetchFishSeasonTable('en', r)),
  ]);

  const isLive = tableData !== null;

  // Use localized month abbreviations from translations
  const monthHeaders: string[] = [
    t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'),
    t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'),
    t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec'),
  ];

  const rows: FishRow[] = (tableData?.fish ?? []).map((fish) => ({
    slug: fish.slug,
    name: fish.name,
    image: fish.image_url,
    months: buildMonths(fish.season, fish.status),
    currentStatus: fish.status,
    live: true,
    isSushi: fish.sushi_grade ?? false,
    waterType: fish.water_type ?? 'both',
    wildFarmed: fish.wild_farmed ?? null,
  }));

  /** Build peak-month range label: "Apr–Sep" or "—" */
  function peakRangeLabel(season: { month: number; available: boolean }[]): string {
    const available = season.filter((m) => m.available).map((m) => m.month);
    if (available.length === 0) return '—';
    const SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const first = SHORT[available[0] - 1];
    const last  = SHORT[available[available.length - 1] - 1];
    return first === last ? first : `${first}–${last}`;
  }

  // Build regionRows: slug → region → { status, peakRange }
  const allTables: [string, typeof tableData][] = [
    [region, tableData],
    ...allRegionCodes.map((r, i) => [r, otherTables[i]] as [string, typeof tableData]),
  ];

  const regionRows: RegionRows = {};
  for (const [r, table] of allTables) {
    if (!table) continue;
    for (const fish of table.fish) {
      if (!regionRows[fish.slug]) regionRows[fish.slug] = {};
      regionRows[fish.slug][r] = {
        status: fish.status,
        peakRange: peakRangeLabel(fish.season),
      };
    }
  }

  const i18n: I18n = {
    fishColumn: t('fishColumn'),
    searchPlaceholder: t('fishSeason.search'),
    bestNow: t('fishSeason.bestNow'),
    bestNowSubtitle: t('fishSeason.bestNowSubtitle'),
    filterAll: t('fishSeason.filterAll'),
    filterSea: t('fishSeason.filterSea'),
    filterFresh: t('fishSeason.filterFresh'),
    filterSushi: t('fishSeason.filterSushi'),
    filterType: '',
    peakOnly: t('fishSeason.peakOnly'),
    sortPeakFirst: t('fishSeason.sortPeakFirst'),
    sortAlpha: t('fishSeason.sortAlpha'),
    tableView: t('fishSeason.tableView'),
    cardView: t('fishSeason.cardView'),
    shareBtn: t('fishSeason.shareBtn'),
    shareCopied: t('fishSeason.shareCopied'),
    allYearLabel: t('fishSeason.allYear'),
    season: {
      peak: t('season.peak'),
      good: t('season.good'),
      limited: t('season.limited'),
      off: t('season.off'),
    },
    months: monthHeaders,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
      {nav}
      {/* Header — centered on mobile, left on desktop */}
      <div className="mb-12 border-t border-primary/20 pt-10 text-center md:text-left">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic leading-tight mb-2">
            {t('tools.fishSeason.title')}<span className="text-primary">.</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium max-w-xl">
            {t('tools.fishSeason.description')}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-border/60 bg-muted/50 text-muted-foreground shrink-0">
          <Table2 className="h-3 w-3" />
          {rows.length} {t('tools.fishSeason.itemsCount' as any) || 'fish'}
        </div>
      </div>

      {/* Legend + Region selector row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {(['peak','good','limited','off'] as Availability[]).map((a) => (
            <div key={a} className="flex items-center gap-2">
              <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                a === 'peak'    ? 'bg-primary shadow-sm shadow-primary/50' :
                a === 'good'    ? 'bg-lime-500/70' :
                a === 'limited' ? 'bg-amber-400/70' :
                'bg-transparent border border-border/40'
              }`} />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {i18n.season[a]}
              </span>
            </div>
          ))}
        </div>

        {/* Region picker (server-rendered links) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-1">
            🌍
          </span>
          {VALID_REGIONS.map((r) => (
            <Link
              key={r}
              href={`/chef-tools/fish-season?region=${r}`}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors ${
                region === r
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {REGION_NAMES[r]}
            </Link>
          ))}
        </div>
      </div>

      {/* Month quick-links */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {['january','february','march','april','may','june','july','august','september','october','november','december'].map((m, i) => {
          const isCurrent = i === new Date().getMonth();
          return (
            <Link
              key={m}
              href={`/chef-tools/fish-season/${m}`}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors ${
                isCurrent
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {m.slice(0, 3)}
            </Link>
          );
        })}
      </div>

      {/* Interactive client table */}
      <FishSeasonClient
        rows={rows}
        monthHeaders={monthHeaders}
        i18n={i18n}
        bestRightNow={bestRightNow}
        regionRows={regionRows}
        activeRegion={region}
      />

      {/* All-year items */}
      {tableData?.all_year && tableData.all_year.length > 0 && (
        <div className="mt-6 p-4 rounded-2xl border border-border/40 bg-muted/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
            {i18n.allYearLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {tableData.all_year.map((item) => (
              <span
                key={item.slug}
                className="text-xs font-medium text-muted-foreground bg-background border border-border/40 rounded-lg px-2.5 py-1"
              >
                {item.name}
              </span>
            ))}
          </div>
          {tableData.note_all_year && (
            <p className="text-[10px] text-muted-foreground mt-2 italic">{tableData.note_all_year}</p>
          )}
        </div>
      )}

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground mt-4 text-right font-medium uppercase tracking-wider">
        {isLive
          ? `${rows.length} fish · ${REGION_NAMES[region]} · Updated live`
          : 'api.dima-fomin.pl'}
      </p>
    </div>
  );
}
