import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchFishSeasonTable } from '@/lib/api';
import Image from 'next/image';

export const revalidate = 3600;

// ─── Month config ─────────────────────────────────────────────────────────────

const MONTH_SLUGS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const MONTH_NUMBERS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

export async function generateStaticParams() {
  return MONTH_SLUGS.map((month) => ({ month }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; month: string }>;
}) {
  const { locale, month } = await params;
  if (!MONTH_NUMBERS[month]) return {};
  const t = await getTranslations({ locale, namespace: 'chefTools' });
  const monthNum = MONTH_NUMBERS[month];
  // Capitalize month name
  const monthName = month.charAt(0).toUpperCase() + month.slice(1);
  return genMeta({
    title: `Fish in ${monthName} · ${t('tools.fishSeason.title')}`,
    description: `Best fish and seafood to eat in ${monthName}. Peak season fish, sushi-grade picks, and seasonal availability for Poland region.`,
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: `/chef-tools/fish-season/${month}`,
  });
}

// ─── Status dot ──────────────────────────────────────────────────────────────

const DOT: Record<string, string> = {
  peak:    'bg-primary shadow-sm shadow-primary/40',
  good:    'bg-lime-500/70',
  limited: 'bg-amber-400/70',
  off:     'bg-muted-foreground/20 border border-border/40',
};

const BADGE: Record<string, string> = {
  peak:    'bg-primary/10 text-primary border-primary/20',
  good:    'bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-500/20',
  limited: 'bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-400/20',
};

const BADGE_LABEL: Record<string, string> = {
  peak: '🔴 Peak', good: '🟢 Good', limited: '🟡 Limited',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FishInMonthPage({
  params,
}: {
  params: Promise<{ locale: string; month: string }>;
}) {
  const { locale, month } = await params;
  const monthNum = MONTH_NUMBERS[month];
  if (!monthNum) notFound();

  const t = await getTranslations({ locale, namespace: 'chefTools' });
  const tableData = await fetchFishSeasonTable(locale, 'PL');

  const monthName = month.charAt(0).toUpperCase() + month.slice(1);

  // Filter fish available (not 'off') this month
  const available = (tableData?.fish ?? []).filter((fish) => {
    const s = fish.season.find((m) => m.month === monthNum);
    return s?.available === true;
  });

  const peak    = available.filter((f) => f.status === 'peak');
  const good    = available.filter((f) => f.status === 'good');
  const limited = available.filter((f) => f.status === 'limited');

  // Prev / next month navigation
  const prevMonthSlug = MONTH_SLUGS[(monthNum - 2 + 12) % 12];
  const nextMonthSlug = MONTH_SLUGS[monthNum % 12];

  // All month names from API or static
  const apiMonthName = tableData?.fish[0]?.season.find((s) => s.month === monthNum)?.month_name ?? monthName;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: `Best fish in ${monthName}`,
          description: `Peak season fish and seafood for ${monthName} — Poland region.`,
          url: `https://dima-fomin.pl/${locale}/chef-tools/fish-season/${month}`,
        }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8">
        <Link href="/chef-tools" className="hover:text-primary transition-colors">
          {t('back')}
        </Link>
        <span>/</span>
        <Link href="/chef-tools/fish-season" className="hover:text-primary transition-colors">
          {t('tools.fishSeason.title')}
        </Link>
        <span>/</span>
        <span className="text-foreground">{apiMonthName}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-foreground uppercase italic leading-tight mb-3">
          Fish in {apiMonthName}<span className="text-primary">.</span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground font-medium max-w-xl">
          Best fish and seafood available in {apiMonthName} · Poland region · {available.length} species
        </p>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-10 p-4 rounded-2xl border border-border/40 bg-muted/20">
        <Link
          href={`/chef-tools/fish-season/${prevMonthSlug}`}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {MONTH_SLUGS[(monthNum - 2 + 12) % 12].charAt(0).toUpperCase() + MONTH_SLUGS[(monthNum - 2 + 12) % 12].slice(1)}
        </Link>

        {/* Month strip */}
        <div className="hidden sm:flex gap-1">
          {MONTH_SLUGS.map((s, i) => (
            <Link
              key={s}
              href={`/chef-tools/fish-season/${s}`}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black uppercase transition-colors ${
                i + 1 === monthNum
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {s.slice(0, 1).toUpperCase()}
            </Link>
          ))}
        </div>

        <Link
          href={`/chef-tools/fish-season/${nextMonthSlug}`}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
        >
          {MONTH_SLUGS[monthNum % 12].charAt(0).toUpperCase() + MONTH_SLUGS[monthNum % 12].slice(1)}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {available.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🚫</p>
          <p className="text-muted-foreground font-medium">No fish available data for {apiMonthName}</p>
          <Link href="/chef-tools/fish-season" className="mt-4 inline-block text-sm font-black text-primary hover:underline">
            View full calendar →
          </Link>
        </div>
      ) : (
        <div className="space-y-10">

          {/* Peak section */}
          {peak.length > 0 && (
            <section>
              <h2 className="text-xl font-black uppercase tracking-tighter text-foreground mb-4 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${DOT.peak}`} />
                Peak season
                <span className="text-sm font-bold text-muted-foreground normal-case tracking-normal">({peak.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {peak.map((fish) => (
                  <FishCard key={fish.slug} fish={fish} status="peak" />
                ))}
              </div>
            </section>
          )}

          {/* Good section */}
          {good.length > 0 && (
            <section>
              <h2 className="text-xl font-black uppercase tracking-tighter text-foreground mb-4 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${DOT.good}`} />
                In season
                <span className="text-sm font-bold text-muted-foreground normal-case tracking-normal">({good.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {good.map((fish) => (
                  <FishCard key={fish.slug} fish={fish} status="good" />
                ))}
              </div>
            </section>
          )}

          {/* Limited section */}
          {limited.length > 0 && (
            <section>
              <h2 className="text-xl font-black uppercase tracking-tighter text-foreground mb-4 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${DOT.limited}`} />
                Limited
                <span className="text-sm font-bold text-muted-foreground normal-case tracking-normal">({limited.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {limited.map((fish) => (
                  <FishCard key={fish.slug} fish={fish} status="limited" />
                ))}
              </div>
            </section>
          )}

          {/* CTA back to full calendar */}
          <div className="pt-6 border-t border-border/40 flex items-center justify-between flex-wrap gap-4">
            <Link
              href="/chef-tools/fish-season"
              className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Full year calendar
            </Link>
            <div className="flex gap-2">
              {MONTH_SLUGS.filter((_, i) => i + 1 !== monthNum).slice(0, 4).map((s) => (
                <Link
                  key={s}
                  href={`/chef-tools/fish-season/${s}`}
                  className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors capitalize"
                >
                  {s.charAt(0).toUpperCase() + s.slice(1, 3)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Fish card component ──────────────────────────────────────────────────────

function FishCard({
  fish,
  status,
}: {
  fish: { slug: string; name: string; image_url: string | null; sushi_grade: boolean | null; water_type: string | null; wild_farmed: string | null };
  status: 'peak' | 'good' | 'limited';
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background p-3 hover:border-primary/30 hover:shadow-sm transition-all flex flex-col items-center text-center gap-2">
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted border border-border/40 flex items-center justify-center">
        {fish.image_url ? (
          <Image
            src={fish.image_url}
            alt={fish.name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-3xl">🐟</span>
        )}
      </div>
      <div>
        <p className="font-black text-foreground uppercase tracking-tight text-xs leading-tight">
          {fish.name}
        </p>
        <div className="flex items-center justify-center gap-1 mt-0.5 flex-wrap">
          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${BADGE[status]}`}>
            {BADGE_LABEL[status]}
          </span>
          {fish.sushi_grade && (
            <span className="text-[8px] font-black uppercase tracking-widest text-primary/70 border border-primary/20 rounded px-1">sushi</span>
          )}
        </div>
        {fish.water_type && (
          <p className="text-[8px] text-muted-foreground mt-0.5">
            {fish.water_type === 'sea' ? '🌊 Sea' : fish.water_type === 'freshwater' ? '💧 Fresh' : '🌊💧'}
          </p>
        )}
      </div>
    </div>
  );
}
