import Link from 'next/link';
import type { LibraryItem } from '@/lib/library';
import { localPath, type Locale } from '@/lib/i18n';

type Props = { item: LibraryItem; locale: Locale; categoryLabel: string; openLabel: string; configsLabel?: string; priority?: boolean };

export function LibraryCard({ item, locale, categoryLabel, openLabel, configsLabel, priority = false }: Props) {
  const formats = Array.from(new Set(item.files.map((f) => f.format)));
  // A generator shows the standards it is built by; a product — its file formats.
  const chips = item.standards?.length ? item.standards.slice(0, 3) : formats;
  const more = item.standards && item.standards.length > 3 ? item.standards.length - 3 : 0;
  return (
    <Link
      href={localPath(locale, `/library/${item.slug}`)}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-hairline-ink-strong bg-ink-2 transition-[border-color,transform,box-shadow] duration-ui ease-premium hover:-translate-y-0.5 hover:border-on-ink/50 hover:shadow-[0_18px_50px_-24px_rgba(92,210,255,.35)]"
      data-ga-event="library_open"
      data-ga-item-id={item.slug}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(ellipse_at_50%_55%,rgba(92,210,255,.13),transparent_62%)]">
        <div className="blueprint absolute inset-0 opacity-50 transition-opacity duration-ui group-hover:opacity-80" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.title[locale]}
          width={1200}
          height={900}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="relative size-full object-contain p-6 transition-transform duration-[700ms] ease-premium group-hover:scale-[1.04]"
        />
        <span className="absolute top-3 left-3 rounded-full border border-hairline-ink-strong bg-ink/70 px-2.5 py-1 text-[12px] text-on-ink-muted backdrop-blur-sm">
          {categoryLabel}
        </span>
        {item.configs && configsLabel ? (
          <span className="absolute top-3 right-3 rounded-full bg-signal/12 px-2.5 py-1 font-mono text-[11.5px] text-signal">
            {item.configs} {configsLabel}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 border-t border-hairline-ink p-5">
        <h3 className="font-display text-[19px] leading-snug font-semibold text-on-ink">{item.title[locale]}</h3>
        <p className="line-clamp-2 text-[14px] leading-relaxed text-on-ink-muted">{item.summary[locale]}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span key={c} className="rounded-md border border-hairline-ink px-2 py-0.5 font-mono text-[10.5px] whitespace-nowrap text-on-ink-muted">
                {c}
              </span>
            ))}
            {more ? <span className="px-1 py-0.5 font-mono text-[10.5px] text-on-ink-muted">+{more}</span> : null}
          </div>
          <span className="flex shrink-0 items-center gap-3">
            {item.downloads ? (
              <span className="font-mono text-[11.5px] text-on-ink-muted tabular-nums" title="↓">
                ↓ {new Intl.NumberFormat(locale).format(item.downloads)}
              </span>
            ) : null}
            <span className="text-[14px] font-semibold text-on-ink transition-colors group-hover:text-signal">{openLabel} →</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
