'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Loader2, Fish, Leaf, ArrowRight, TrendingUp } from 'lucide-react';
import { fetchBestInSeason, type SeasonItem } from '@/lib/tools';
import { Badge } from '@/components/ui/badge';

const statusColor: Record<string, string> = {
  peak: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-emerald-500/5',
  good: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-blue-500/5',
  off: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-amber-500/5',
  avoid: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-rose-500/5',
};

type SeasonNowProps = {
  onSelect: (slug: string, name: string, image?: string | null) => void;
};

export function SeasonNow({ onSelect }: SeasonNowProps) {
  const locale = useLocale();
  const t = useTranslations('chefTools.dashboard');

  const [items, setItems] = useState<SeasonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchBestInSeason(locale).then((data) => {
      if (!cancelled && data) setItems(data.items.slice(0, 12));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [locale]);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center shadow-inner">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground italic text-shimmer leading-none">
            {t('seasonNow')}
          </h2>
        </div>
        <Link
          href="/chef-tools/fish-season"
          className="px-4 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all italic flex items-center gap-2 group/link"
        >
          {t('viewAll')}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t('noData')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <button
              key={item.slug}
              onClick={() => onSelect(item.slug, item.name, item.image_url)}
              className="group relative rounded-[2.5rem] border-2 border-border/20 bg-card/30 backdrop-blur-xl p-6 hover:border-emerald-500/30 hover:bg-card/50 shadow-xl shadow-black/5 transition-all duration-700 flex flex-col items-center text-center cursor-pointer hover-lift hover-glow"
            >
              {item.image_url ? (
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 mb-4 transition-transform duration-500 group-hover:scale-110">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-muted/20 border-2 border-border/10 flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110">
                  {item.water_type ? (
                    <Fish className="h-8 w-8 text-muted-foreground/40" />
                  ) : (
                    <Leaf className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
              )}
              <p className="text-[13px] font-black italic uppercase tracking-tighter text-foreground leading-[1.1] w-full transition-colors group-hover:text-emerald-500">
                {item.name}
              </p>
              <div
                className={`mt-3 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border italic transition-all duration-500 ${statusColor[item.status] ?? ''}`}
              >
                {t(`status.${item.status}`)}
              </div>
              {item.sushi_grade && (
                <div className="absolute top-4 right-4 text-sm filter drop-shadow-sm transition-transform group-hover:scale-125 duration-500">
                  🍣
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
