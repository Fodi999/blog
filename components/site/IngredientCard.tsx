import Link from 'next/link';

export function IngredientCard({
  href,
  image,
  category,
  name,
  description,
  meta,
  delayMs,
}: {
  href: string;
  image?: string | null;
  category: string;
  name: string;
  description?: string;
  meta?: React.ReactNode;
  delayMs?: number;
}) {
  return (
    <Link href={href} className="group block animate-reveal" style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
      <div className="relative mb-4 aspect-square overflow-hidden bg-ink-2 p-6">
        {image ? (
          <img src={image} alt={name} className="size-full object-contain transition-transform duration-reveal ease-premium group-hover:scale-[1.04]" />
        ) : (
          <div className="grid size-full place-items-center text-[11px] font-bold tracking-[.1em] text-on-ink-muted uppercase">{category}</div>
        )}
      </div>
      <h3 className="font-display text-lg leading-[1.15] font-medium">{name}</h3>
      {description ? <p className="mt-1 line-clamp-2 text-[13px] leading-[1.5] text-on-ink-muted">{description}</p> : null}
      {meta}
    </Link>
  );
}
