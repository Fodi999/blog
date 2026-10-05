import Link from 'next/link';
import type { LibraryItem } from '@/lib/library';
import { localPath, type Locale } from '@/lib/i18n';

type Props = { item: LibraryItem; locale: Locale; categoryLabel: string; openLabel: string; priority?: boolean };

export function LibraryCard({ item, locale, categoryLabel, openLabel, priority = false }: Props) {
  const formats = Array.from(new Set(item.files.map((f) => f.format)));
  return (
    <Link
      href={localPath(locale, `/library/${item.slug}`)}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-hairline-ink bg-ink-2 transition-[border-color,transform,box-shadow] duration-ui ease-premium hover:-translate-y-1 hover:border-hairline-ink-strong hover:shadow-[0_30px_80px_-30px_rgba(92,210,255,.25)]"
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
          className="relative size-full object-contain p-6 transition-transform duration-[900ms] ease-premium group-hover:scale-[1.04]"
        />
        <span className="glass absolute top-4 left-4 rounded-full border border-hairline-ink px-3 py-1 font-mono text-[10.5px] tracking-[.12em] text-on-ink-muted uppercase">
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
          <span className="text-[13px] font-semibold text-signal transition-transform group-hover:translate-x-1">{openLabel} →</span>
        </div>
      </div>
    </Link>
  );
}
