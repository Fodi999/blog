import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { ChevronLeft, Wifi, WifiOff } from 'lucide-react';
import { fetchFishSeason } from '@/lib/api';

export const revalidate = 86400;

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

type Availability = 'peak' | 'good' | 'poor' | 'none';

type FishRow = {
  name: string;
  months: Availability[];
};

const STATIC_FISH: FishRow[] = [
  { name: 'Salmon',     months: ['good','good','good','good','peak','peak','peak','peak','good','good','good','good'] },
  { name: 'Tuna',       months: ['good','good','peak','peak','peak','good','good','good','good','good','good','good'] },
  { name: 'Sea Bass',   months: ['none','none','poor','good','peak','peak','peak','good','poor','none','none','none'] },
  { name: 'Mackerel',   months: ['poor','poor','poor','poor','good','peak','peak','peak','good','poor','poor','poor'] },
  { name: 'Shrimp',     months: ['good','good','peak','peak','peak','good','good','good','good','peak','peak','good'] },
  { name: 'Scallop',    months: ['peak','peak','good','good','none','none','none','none','good','good','peak','peak'] },
  { name: 'Squid',      months: ['poor','poor','good','peak','peak','peak','good','good','poor','poor','poor','poor'] },
  { name: 'Eel',        months: ['good','good','good','good','good','good','peak','peak','peak','good','good','good'] },
  { name: 'Crab',       months: ['peak','peak','good','good','none','none','none','none','good','peak','peak','peak'] },
  { name: 'Yellowtail', months: ['peak','peak','peak','good','good','good','poor','poor','good','good','peak','peak'] },
  { name: 'Cod',        months: ['peak','peak','good','good','none','none','none','none','good','good','peak','peak'] },
];

const STATIC_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function boolToAvailability(available: boolean): Availability {
  return available ? 'good' : 'none';
}

const dotMap: Record<Availability, string> = {
  peak: 'bg-primary',
  good: 'bg-primary/40',
  poor: 'bg-muted-foreground/30',
  none: 'bg-transparent border border-border/30',
};

export default async function FishSeasonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'chefTools' });

  const [salmonApi, tunaApi, codApi] = await Promise.all([
    fetchFishSeason('salmon', locale),
    fetchFishSeason('tuna', locale),
    fetchFishSeason('cod', locale),
  ]);

  const fromApi = salmonApi !== null;

  // Month headers: localized by API via month_name, sliced to 3 chars
  const monthHeaders: string[] = fromApi
    ? salmonApi!.season.map((m) => m.month_name.slice(0, 3))
    : STATIC_MONTHS;

  const fishRows: FishRow[] = STATIC_FISH.map((row) => {
    let apiData = null;
    if (fromApi) {
      if (row.name === 'Salmon') apiData = salmonApi;
      if (row.name === 'Tuna')   apiData = tunaApi;
      if (row.name === 'Cod')    apiData = codApi;
    }
    if (apiData) {
      return {
        name: row.name,
        months: apiData.season.map((m) => boolToAvailability(m.available)),
      };
    }
    return row;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <Link
        href="/chef-tools"
        className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-10"
      >
        <ChevronLeft className="h-4 w-4" />
        {t('back')}
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-12">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground uppercase italic leading-[0.85] mb-4">
            {t('tools.fishSeason.title')}<span className="text-primary">.</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            {t('tools.fishSeason.description')}
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${
          fromApi
            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
            : 'bg-muted text-muted-foreground border-border/60'
        }`}>
          {fromApi ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {fromApi ? 'Live API' : 'Static data'}
        </div>
      </div>

      <div className="flex flex-wrap gap-6 mb-10">
        {(['peak','good','poor','none'] as Availability[]).map((a) => (
          <div key={a} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${dotMap[a]}`} />
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              {t(`season.${a}`)}
            </span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-3xl border-2 border-border/60">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-border/60 bg-muted/30">
              <th className="text-left py-4 px-6 font-black uppercase tracking-widest text-sm text-foreground whitespace-nowrap">
                {t('fishColumn')}
              </th>
              {monthHeaders.map((m, i) => (
                <th key={i} className="py-4 px-2 font-black uppercase tracking-widest text-xs text-muted-foreground text-center min-w-[40px]">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fishRows.map((fish, i) => (
              <tr
                key={fish.name}
                className={`border-b border-border/40 transition-colors hover:bg-muted/20 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
              >
                <td className="py-4 px-6 font-black text-foreground text-sm uppercase tracking-tight whitespace-nowrap">
                  {fish.name}
                </td>
                {fish.months.map((avail, mi) => (
                  <td key={mi} className="py-4 px-2 text-center">
                    <div className={`w-5 h-5 mx-auto rounded-full ${dotMap[avail]}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {fromApi && (
        <p className="text-xs text-muted-foreground mt-4 text-right font-medium">
          Salmon, Tuna, Cod — live data · api.dima-fomin.pl · Updated every 24h
        </p>
      )}
    </div>
  );
}
