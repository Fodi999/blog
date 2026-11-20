import Link from 'next/link';
import type { LibraryItem } from '@/lib/library';
import { localPath, type Locale } from '@/lib/i18n';

/** The library's generators as a compact grid of renders (home page). */
export function LibraryStrip({ items, locale }: { items: LibraryItem[]; locale: Locale }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={localPath(locale, `/library/${item.slug}`)}
            className="group relative block overflow-hidden rounded-xl border border-hairline-ink-strong bg-ink-2 transition-[border-color,transform] duration-ui ease-premium hover:-translate-y-0.5 hover:border-on-ink/50"
            data-ga-event="library_open"
            data-ga-item-id={item.slug}
          >
            <div className="relative aspect-[4/3] bg-[radial-gradient(ellipse_at_50%_55%,rgba(92,210,255,.12),transparent_65%)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.title[locale]} width={600} height={450} loading="lazy" decoding="async" className="size-full object-contain p-3 transition-transform duration-[700ms] ease-premium group-hover:scale-[1.06]" />
              <span className="absolute top-2 left-2 rounded-full bg-ink/75 px-2 py-0.5 font-mono text-[10.5px] text-steel backdrop-blur-sm">{item.standards?.[0]}</span>
            </div>
            <p className="line-clamp-2 min-h-[3.4em] border-t border-hairline-ink px-3 py-2.5 text-[13px] leading-snug text-on-ink-muted group-hover:text-on-ink">{item.title[locale]}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
