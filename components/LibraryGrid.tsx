'use client';

import { useState } from 'react';
import { LibraryCard } from '@/components/LibraryCard';
import type { Dict, Locale } from '@/lib/i18n';
import type { Category, LibraryItem } from '@/lib/library';

type Props = { items: LibraryItem[]; locale: Locale; t: Dict['library'] };

export function LibraryGrid({ items, locale, t }: Props) {
  const present = Array.from(new Set(items.map((i) => i.category))) as Category[];
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const shown = filter === 'all' ? items : items.filter((i) => i.category === filter);

  return (
    <div>
      <div role="tablist" aria-label={t.title} className="flex flex-wrap gap-2">
        {(['all', ...present] as const).map((c) => (
          <button
            key={c}
            role="tab"
            type="button"
            aria-selected={filter === c}
            onClick={() => setFilter(c)}
            className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
              filter === c ? 'border-on-ink bg-on-ink text-ink' : 'border-hairline-ink-strong text-on-ink-muted hover:text-on-ink'
            }`}
          >
            {c === 'all' ? t.all : t.categories[c]}
            <span className="ml-2 font-mono text-[11px] opacity-60">{c === 'all' ? items.length : items.filter((i) => i.category === c).length}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-on-ink-muted">{t.empty}</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((item, i) => (
            <LibraryCard key={item.slug} item={item} locale={locale} categoryLabel={t.categories[item.category]} openLabel={t.open} priority={i < 3} />
          ))}
        </div>
      )}
    </div>
  );
}
