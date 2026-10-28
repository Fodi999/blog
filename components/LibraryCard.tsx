import Link from 'next/link';
import type { LibraryItem } from '@/lib/library';
import { localPath, type Locale } from '@/lib/i18n';

type Props = { item: LibraryItem; locale: Locale; categoryLabel: string; openLabel: string; priority?: boolean };

export function LibraryCard({ item, locale, categoryLabel, openLabel, priority = false }: Props) {
  const formats = Array.from(new Set(item.files.map((f) => f.format)));
  return (
    <Link
      href={localPath(locale, `/library/${item.slug}`)}
      className="group relative flex flex-col overflow-hidden border border-hairline-ink-strong bg-ink-2 transition-[border-color] duration-ui ease-premium hover:border-on-ink/60"
      data-ga-event="library_open"
      data-ga-item-id={item.slug}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(ellipse_at_50%_60%,rgba(92,210,255,.10),transparent_65%)]">
        <div className="blueprint absolute inset-0 opacity-60" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.title[locale]}
          width={1200}
          height={900}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="relative size-full object-contain p-6"
        />
        <span className="absolute top-3 left-4 text-[13px] text-on-ink-muted">
          {categoryLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-display text-[19px] leading-snug font-semibold text-on-ink">{item.title[locale]}</h3>
        <p className="line-clamp-2 text-[14px] leading-relaxed text-on-ink-muted">{item.summary[locale]}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex gap-1.5">
            {formats.map((f) => (
              <span key={f} className="rounded-md border border-hairline-ink px-2 py-0.5 font-mono text-[10.5px] text-on-ink-muted">
                {f}
              </span>
            ))}
          </div>
          <span className="text-[14px] font-semibold text-on-ink underline-offset-4 group-hover:underline">{openLabel}</span>
        </div>
      </div>
    </Link>
  );
}
