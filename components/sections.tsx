import Link from 'next/link';
import { siteButtonVariants } from '@/components/site/Button';
import { localPath, type Dict, type Locale } from '@/lib/i18n';

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11.5px] tracking-[.16em] text-steel uppercase">
      <span className="h-px w-6 bg-steel/60" aria-hidden="true" />
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, lead, center = false }: { eyebrow?: string; title: string; lead?: string; center?: boolean }) {
  return (
    <div className={`max-w-3xl ${center ? 'mx-auto text-center' : ''}`} data-reveal>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-4 font-display text-[clamp(28px,4.2vw,48px)] leading-[1.08] font-semibold tracking-[-.02em] text-balance text-on-ink">{title}</h2>
      {lead ? <p className="mt-5 text-[17px] leading-relaxed text-pretty text-on-ink-muted">{lead}</p> : null}
    </div>
  );
}

const check = (
  <svg viewBox="0 0 16 16" className="mt-1 size-4 shrink-0 text-signal" aria-hidden="true" fill="none">
    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function PricingPlans({ locale, t }: { locale: Locale; t: Dict['pricing'] }) {
  const kindFor: Record<string, string> = { free: 'early_access', pro: 'early_access', factory: 'pilot' };
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-3">
        {t.plans.map((plan, i) => (
          <div
            key={plan.id}
            data-reveal
            style={{ '--reveal-delay': `${i * 90}ms` } as React.CSSProperties}
            className={`relative flex flex-col rounded-3xl border p-7 ${
              plan.highlight
                ? 'border-signal/50 bg-[linear-gradient(180deg,rgba(196,255,77,.09),rgba(13,17,23,.9)_45%)] shadow-[0_40px_120px_-40px_rgba(196,255,77,.35)]'
                : 'border-hairline-ink bg-ink-2'
            }`}
          >
            {plan.highlight ? (
              <span className="absolute -top-3 left-7 rounded-full bg-signal px-3 py-1 font-mono text-[10.5px] font-medium tracking-[.1em] text-ink uppercase">{t.popular}</span>
            ) : null}
            <h3 className="font-display text-[20px] font-semibold text-on-ink">{plan.name}</h3>
            <p className="mt-1.5 text-[14px] text-on-ink-muted">{plan.desc}</p>
            <p className="mt-6 flex items-baseline gap-1.5">
              <span className="font-display text-[44px] leading-none font-semibold tracking-[-.03em] text-on-ink">{plan.price}</span>
              {plan.id !== 'free' ? <span className="text-[14px] text-on-ink-muted">{t.perMonth}</span> : null}
            </p>
            <ul className="mt-7 flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-3 text-[14.5px] leading-snug text-on-ink">
                  {check}
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={localPath(locale, `/contact?kind=${kindFor[plan.id] ?? 'early_access'}&plan=${plan.id}`)}
              className={`${siteButtonVariants({ variant: plan.highlight ? 'primary' : 'ghost' })} mt-8 w-full`}
              data-ga-event="pricing_cta"
              data-ga-label={plan.id}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
      <div data-reveal className="mt-5 flex flex-col items-start justify-between gap-5 rounded-3xl border border-hairline-ink bg-ink-2 p-7 md:flex-row md:items-center">
        <div>
          <h3 className="font-display text-[18px] font-semibold text-on-ink">{t.custom.title}</h3>
          <p className="mt-1.5 text-[14.5px] text-on-ink-muted">{t.custom.text}</p>
        </div>
        <Link href={localPath(locale, '/contact?kind=custom')} className={siteButtonVariants({ variant: 'ghost' })}>
          {t.custom.cta}
        </Link>
      </div>
      <p className="mt-6 max-w-3xl text-[13.5px] leading-relaxed text-on-ink-muted">{t.note}</p>
    </div>
  );
}

export function Faq({ t }: { t: Dict['faq'] }) {
  return (
    <div className="divide-y divide-hairline-ink rounded-3xl border border-hairline-ink bg-ink-2">
      {t.items.map((item) => (
        <details key={item.q} className="group px-6 py-1 [&_summary::-webkit-details-marker]:hidden" data-reveal>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[16.5px] font-semibold text-on-ink">
            {item.q}
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-hairline-ink-strong text-on-ink-muted transition-transform duration-ui group-open:rotate-45" aria-hidden="true">
              +
            </span>
          </summary>
          <p className="pb-6 text-[15px] leading-relaxed text-on-ink-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function StatusBoard({ t }: { t: Dict['status'] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-3xl border border-hairline-ink bg-ink-2 p-7" data-reveal>
        <h3 className="flex items-center gap-2.5 font-mono text-[12px] tracking-[.14em] text-signal uppercase">
          <span className="size-2 rounded-full bg-signal shadow-[0_0_12px_rgba(196,255,77,.9)]" aria-hidden="true" />
          {t.doneTitle}
        </h3>
        <ul className="mt-5 space-y-3">
          {t.done.map((x) => (
            <li key={x} className="flex gap-3 text-[15px] text-on-ink">
              {check}
              {x}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-3xl border border-hairline-ink bg-ink-2 p-7" data-reveal style={{ '--reveal-delay': '90ms' } as React.CSSProperties}>
        <h3 className="flex items-center gap-2.5 font-mono text-[12px] tracking-[.14em] text-steel uppercase">
          <span className="size-2 animate-pulse rounded-full bg-steel" aria-hidden="true" />
          {t.nextTitle}
        </h3>
        <ul className="mt-5 space-y-3">
          {t.next.map((x) => (
            <li key={x} className="flex gap-3 text-[15px] text-on-ink-muted">
              <span className="mt-[9px] h-px w-3 shrink-0 bg-steel" aria-hidden="true" />
              {x}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PageHero({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <section className="relative overflow-hidden pt-36 pb-14">
      <div className="blueprint pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_70%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-steel/10 blur-[120px]" aria-hidden="true" />
      <div className="content-frame relative animate-reveal">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="mt-4 max-w-4xl font-display text-[clamp(34px,5.6vw,64px)] leading-[1.04] font-semibold tracking-[-.025em] text-balance text-on-ink">{title}</h1>
        {lead ? <p className="mt-6 max-w-2xl text-[18px] leading-relaxed text-pretty text-on-ink-muted">{lead}</p> : null}
      </div>
    </section>
  );
}
