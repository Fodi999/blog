import Link from 'next/link';
import { eyebrowClass } from '@/components/site/classes';

export function ProductCard({
  href,
  id,
  image,
  category,
  name,
  description,
  price,
  stock,
  delayMs,
  gaItemId,
}: {
  href: string;
  id?: string;
  image?: string | null;
  category: string;
  name: string;
  description?: string;
  price?: string;
  stock?: string;
  delayMs?: number;
  /** When set, tags the card for the shop's `select_item` analytics event. */
  gaItemId?: string;
}) {
  return (
    <Link
      href={href}
      id={id}
      className="group block animate-reveal"
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
      {...(gaItemId
        ? {
            'data-ga-event': 'select_item',
            'data-ga-item-id': gaItemId,
            'data-ga-item-name': name,
            'data-ga-item-category': category,
          }
        : {})}
    >
      <div className="relative mb-5 aspect-[4/5] overflow-hidden bg-ink-2">
        {image ? (
          <img src={image} alt={name} className="size-full object-cover transition-transform duration-reveal ease-premium group-hover:scale-[1.04]" />
        ) : (
          <div className="grid size-full place-items-center text-xs font-bold tracking-[.14em] text-on-ink-muted uppercase">{category}</div>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <p className={eyebrowClass}>{category}</p>
        {stock ? <span className="text-[11px] font-bold tracking-[.06em] text-on-ink-muted uppercase">{stock}</span> : null}
      </div>
      <h3 className="mt-2 font-display text-[22px] leading-[1.15] font-medium">{name}</h3>
      {description ? <p className="mt-1.5 line-clamp-2 text-sm leading-[1.55] text-on-ink-muted">{description}</p> : null}
      {price ? <span className="mt-3 block font-display text-[15px] italic text-on-ink">{price}</span> : null}
    </Link>
  );
}
