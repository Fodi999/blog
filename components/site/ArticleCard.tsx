import Link from 'next/link';
import { eyebrowClass } from '@/components/site/classes';

export function ArticleCard({
  href,
  image,
  category,
  title,
  description,
  delayMs,
}: {
  href: string;
  image?: string | null;
  category: string;
  title: string;
  description?: string;
  delayMs?: number;
}) {
  return (
    <Link href={href} className="group block animate-reveal" style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
      <div className="relative mb-5 aspect-[4/3] overflow-hidden bg-ink-2">
        {image ? (
          <img src={image} alt="" className="size-full object-cover transition-transform duration-reveal ease-premium group-hover:scale-[1.04]" />
        ) : (
          <div className="grid size-full place-items-center text-xs font-bold tracking-[.14em] text-on-ink-muted uppercase">{category}</div>
        )}
      </div>
      <p className={eyebrowClass}>{category}</p>
      <h3 className="mt-2 font-display text-[22px] leading-[1.15] font-medium">{title}</h3>
      {description ? <p className="mt-1.5 line-clamp-2 text-sm leading-[1.55] text-on-ink-muted">{description}</p> : null}
    </Link>
  );
}
