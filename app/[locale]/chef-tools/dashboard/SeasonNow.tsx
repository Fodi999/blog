'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Loader2, Fish, Leaf, ArrowRight, TrendingUp } from 'lucide-react';
import { fetchBestInSeason, type SeasonItem } from '@/lib/tools';
import { Badge } from '@/components/ui/badge';

const statusColor: Record<string, string> = {
  peak: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20',
  good: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
  off: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20',
  avoid: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20',
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
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
            <TrendingUp className="h-4.5 w-4.5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground italic">
            {t('seasonNow')}
          </h2>
        </div>
        <Link
          href="/chef-tools/fish-season"
          className="text-xs font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
        >
          {t('viewAll')}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t('noData')}</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((item) => (
            <button
              key={item.slug}
              onClick={() => onSelect(item.slug, item.name, item.image_url)}
              className="group relative rounded-2xl border border-border/60 bg-background p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col items-center text-center cursor-pointer"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-14 h-14 rounded-xl object-cover mb-3"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-3">
                  {item.water_type ? (
                    <Fish className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <Leaf className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              )}
              <p className="text-xs font-bold text-foreground truncate w-full group-hover:text-primary transition-colors">
                {item.name}
              </p>
              <Badge
                variant="outline"
                className={`mt-2 text-[10px] font-bold uppercase px-2 py-0 ${statusColor[item.status] ?? ''}`}
              >
                {t(`status.${item.status}`)}
              </Badge>
              {item.sushi_grade && (
                <span className="absolute top-2 right-2 text-[10px] font-bold text-primary">
                  🍣
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
