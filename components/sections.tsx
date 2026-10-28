import type { Dict } from '@/lib/i18n';

/** A short label over a page title (the page's place on the site), in plain sentence case. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="text-[14px] font-medium text-steel">{children}</span>;
}

export function SectionHeading({ title, lead, id }: { title: string; lead?: string; id?: string }) {
  return (
    <div className="max-w-3xl">
      <h2 id={id} className="font-display text-[clamp(32px,4vw,52px)] leading-[1.02] font-semibold tracking-[-.01em] text-balance text-on-ink">
        {title}
      </h2>
      {lead ? <p className="mt-5 max-w-[62ch] text-[17.5px] leading-relaxed text-pretty text-on-ink-muted">{lead}</p> : null}
    </div>
  );
}

export function Faq({ t }: { t: Dict['faq'] }) {
  return (
    <div className="border-t border-hairline-ink-strong">
      {t.items.map((item) => (
        <details key={item.q} className="group border-b border-hairline-ink-strong [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-semibold text-on-ink">
            {item.q}
            <span className="grid size-7 shrink-0 place-items-center text-[20px] leading-none font-light text-on-ink-muted transition-transform duration-ui group-open:rotate-45" aria-hidden="true">
              +
            </span>
          </summary>
          <p className="max-w-[68ch] pb-6 text-[16px] leading-relaxed text-on-ink-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function PageHero({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <section className="relative pt-32 pb-12 md:pt-36">
      <div className="content-frame animate-reveal">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="mt-3 max-w-4xl font-display text-[clamp(38px,5.6vw,72px)] leading-[1] font-semibold tracking-[-.01em] text-balance text-on-ink">{title}</h1>
        {lead ? <p className="mt-6 max-w-[62ch] text-[18px] leading-relaxed text-pretty text-on-ink-muted">{lead}</p> : null}
      </div>
    </section>
  );
}
