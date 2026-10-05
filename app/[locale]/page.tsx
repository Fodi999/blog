import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LeadForm } from '@/components/LeadForm';
import { LibraryCard } from '@/components/LibraryCard';
import { ModelViewer } from '@/components/ModelViewer';
import { Eyebrow, Faq, PricingPlans, SectionHeading, StatusBoard } from '@/components/sections';
import { siteButtonVariants } from '@/components/site/Button';
import { getDict, isLocale, localPath, type Locale } from '@/lib/i18n';
import { getItems } from '@/lib/library';
import { pageMetadata, SITE_URL } from '@/lib/seo';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return pageMetadata(locale, '', undefined, t.meta.description);
}

const featureIcons: Record<string, React.ReactNode> = {
  kernel: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 0v18M4 7.5l8 4.5 8-4.5" />,
  ai: <path d="M12 3v3m0 12v3M3 12h3m12 0h3M6.3 6.3l2.1 2.1m7.2 7.2l2.1 2.1m0-11.4l-2.1 2.1m-7.2 7.2l-2.1 2.1M12 9a3 3 0 100 6 3 3 0 000-6z" />,
  history: <path d="M4 6h10M4 12h16M4 18h7M17 4l3 2-3 2M14 16l3 2-3 2" />,
  render: <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm-4 7a4 4 0 017-1" />,
  sheet: <path d="M4 18L12 6l8 12M4 18h16M8 12h8" />,
  cloud: <path d="M7 18a4 4 0 01-.5-8 6 6 0 0111.5 1.5A3.5 3.5 0 0117.5 18H7zm5-7v5m-2-2l2 2 2-2" />,
};

function jsonLd(locale: Locale, description: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${SITE_URL}/#org`, name: 'Monge', url: SITE_URL, logo: `${SITE_URL}/icon.svg` },
      {
        '@type': 'SoftwareApplication',
        name: 'Monge',
        applicationCategory: 'DesignApplication',
        operatingSystem: 'macOS',
        softwareVersion: '0.3.0',
        description,
        url: `${SITE_URL}/${locale}`,
        publisher: { '@id': `${SITE_URL}/#org` },
        offers: [
          { '@type': 'Offer', name: 'Pro', price: '49', priceCurrency: 'EUR' },
          { '@type': 'Offer', name: 'Factory', price: '149', priceCurrency: 'EUR' },
        ],
      },
    ],
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const items = await getItems();
  const heroItem = items.find((i) => i.category === 'stainless' && i.model) ?? items.find((i) => i.model);
  const wheel = items.find((i) => i.slug.startsWith('wheel')) ?? heroItem;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(locale, t.meta.description)) }} />

      {/* ───────── Hero ───────── */}
      <section className="relative isolate overflow-hidden pt-28 pb-10 md:pt-36">
        <div className="blueprint pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_60%_30%,black_20%,transparent_75%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-32 right-[-10%] -z-10 h-[620px] w-[620px] rounded-full bg-steel/15 blur-[140px]" aria-hidden="true" />
        <div className="pointer-events-none absolute top-40 left-[-15%] -z-10 h-[420px] w-[520px] rounded-full bg-signal/[.07] blur-[120px]" aria-hidden="true" />

        <div className="content-frame grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div className="animate-reveal">
            <span className="glass inline-flex items-center gap-2.5 rounded-full border border-hairline-ink py-1.5 pr-4 pl-1.5 text-[13px] text-on-ink-muted">
              <span className="rounded-full bg-signal px-2 py-0.5 font-mono text-[10.5px] font-medium text-ink">NEW</span>
              {t.hero.badge}
            </span>
            <h1 className="mt-7 font-display text-[clamp(34px,4.6vw,66px)] leading-[1.02] font-semibold tracking-[-.035em] text-on-ink">
              <span className="block">{t.hero.titleA}</span>
              <span className="text-gradient block">{t.hero.titleB}</span>
              <span className="block text-on-ink-muted">{t.hero.titleC}</span>
            </h1>
            <p className="mt-7 max-w-xl text-[18px] leading-relaxed text-pretty text-on-ink-muted">{t.hero.lead}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href={localPath(locale, '/contact?kind=early_access')} className={siteButtonVariants({ variant: 'primary', size: 'lg' })} data-ga-event="cta_hero">
                {t.hero.primary}
                <span aria-hidden="true">→</span>
              </Link>
              <Link href={localPath(locale, '/library')} className={siteButtonVariants({ variant: 'ghost', size: 'lg' })}>
                {t.hero.secondary}
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-[13px] text-on-ink-muted">
              <span className="size-1.5 rounded-full bg-signal" aria-hidden="true" />
              {t.hero.note}
            </p>
          </div>

          {heroItem?.model ? (
            <div className="relative animate-reveal [animation-delay:150ms]">
              <div className="relative aspect-square overflow-hidden rounded-[32px] border border-hairline-ink bg-[radial-gradient(ellipse_at_50%_45%,rgba(92,210,255,.13),rgba(7,9,12,0)_62%)] sm:aspect-[5/4] lg:aspect-square">
                <div className="blueprint absolute inset-0 opacity-70" aria-hidden="true" />
                <ModelViewer
                  src={heroItem.model}
                  poster={heroItem.image}
                  alt={heroItem.title[locale]}
                  finish={heroItem.finish}
                  view={heroItem.view}
                  rotate={heroItem.rotate}
                  dims={heroItem.dims}
                  labels={t.item.viewer}
                  autoDemo
                  loadingLabel={t.item.loading}
                  className="absolute inset-0"
                />
                {/* Viewport chrome: makes the panel read as a live CAD viewport */}
                <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between font-mono text-[10.5px] text-on-ink-muted">
                  <span className="glass rounded-full border border-hairline-ink px-3 py-1">● {t.hero.viewerLabel}</span>
                  <span className="glass hidden rounded-full border border-hairline-ink px-3 py-1 sm:inline">B-Rep · STEP</span>
                </div>
                <div className="pointer-events-none absolute top-14 left-4 font-mono text-[10.5px] leading-relaxed text-on-ink-muted">
                  <div>{heroItem.title[locale]}</div>
                  <div className="text-steel">{heroItem.dimensions}</div>
                </div>
                <svg viewBox="0 0 40 40" className="pointer-events-none absolute top-14 right-4 size-10" aria-hidden="true">
                  <path d="M8 32h20" stroke="#ff6b5b" strokeWidth="1.5" />
                  <path d="M8 32V12" stroke="#c4ff4d" strokeWidth="1.5" />
                  <path d="M8 32l12-8" stroke="#5cd2ff" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          ) : null}
        </div>

        <div className="content-frame mt-14 grid gap-px overflow-hidden rounded-3xl border border-hairline-ink bg-hairline-ink sm:grid-cols-3">
          {t.hero.stats.map((s) => (
            <div key={s.label} className="bg-ink-2 px-6 py-6">
              <div className="font-display text-[28px] font-semibold tracking-[-.02em] text-on-ink">{s.value}</div>
              <div className="mt-1.5 text-[13.5px] text-on-ink-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Marquee of product types ───────── */}
      <section aria-label={t.libraryPreview.eyebrow} className="relative overflow-hidden border-y border-hairline-ink py-5 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
          {[...t.marquee, ...t.marquee].map((m, i) => (
            <span key={i} className="flex items-center gap-10 font-display text-[15px] font-medium text-on-ink-muted">
              {m}
              <span className="text-signal" aria-hidden="true">
                ✦
              </span>
            </span>
          ))}
        </div>
      </section>

      {/* ───────── Problem → solution ───────── */}
      <section id="product" className="content-frame py-24 md:py-32">
        <SectionHeading eyebrow={t.pain.eyebrow} title={t.pain.title} lead={t.pain.lead} />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-hairline-ink bg-ink-2 p-7" data-reveal>
            <h3 className="font-mono text-[12px] tracking-[.14em] text-on-ink-muted uppercase">{t.pain.before}</h3>
            <ul className="mt-5 space-y-3.5">
              {t.pain.beforeItems.map((x) => (
                <li key={x} className="flex gap-3 text-[15.5px] text-on-ink-muted">
                  <span className="mt-0.5 text-destructive" aria-hidden="true">
                    ✕
                  </span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-signal/35 bg-[linear-gradient(160deg,rgba(196,255,77,.08),rgba(13,17,23,.95)_55%)] p-7" data-reveal style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
            <h3 className="font-mono text-[12px] tracking-[.14em] text-signal uppercase">{t.pain.after}</h3>
            <ul className="mt-5 space-y-3.5">
              {t.pain.afterItems.map((x) => (
                <li key={x} className="flex gap-3 text-[15.5px] text-on-ink">
                  <span className="mt-0.5 text-signal" aria-hidden="true">
                    ✓
                  </span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section className="relative border-y border-hairline-ink bg-ink-2/60 py-24 md:py-32">
        <div className="content-frame">
          <SectionHeading eyebrow={t.how.eyebrow} title={t.how.title} />
          <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {t.how.steps.map((s, i) => (
              <li key={s.title} className="relative rounded-3xl border border-hairline-ink bg-ink p-7" data-reveal style={{ '--reveal-delay': `${i * 90}ms` } as React.CSSProperties}>
                <span className="font-mono text-[12px] text-steel">0{i + 1}</span>
                <h3 className="mt-6 font-display text-[19px] font-semibold text-on-ink">{s.title}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-on-ink-muted">{s.text}</p>
                {i < t.how.steps.length - 1 ? (
                  <span className="absolute top-1/2 -right-3 z-10 hidden size-6 -translate-y-1/2 place-items-center rounded-full border border-hairline-ink bg-ink-2 text-[11px] text-signal lg:grid" aria-hidden="true">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── Features (bento) ───────── */}
      <section className="content-frame py-24 md:py-32">
        <SectionHeading eyebrow={t.features.eyebrow} title={t.features.title} />
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((f, i) => (
            <article
              key={f.key}
              data-reveal
              style={{ '--reveal-delay': `${(i % 3) * 80}ms` } as React.CSSProperties}
              className={`group relative overflow-hidden rounded-3xl border border-hairline-ink bg-ink-2 p-7 transition-colors duration-ui hover:border-hairline-ink-strong ${i === 0 ? 'lg:col-span-2' : ''}`}
            >
              <div className="pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-steel/10 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-2xl border border-hairline-ink-strong bg-ink text-signal">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {featureIcons[f.key]}
                  </svg>
                </span>
                {f.soon ? <span className="rounded-full border border-steel/40 px-2.5 py-1 font-mono text-[10.5px] text-steel">{t.features.soon}</span> : null}
              </div>
              <h3 className="mt-6 font-display text-[19px] font-semibold text-on-ink">{f.title}</h3>
              <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-on-ink-muted">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ───────── Showcase: the wheel ───────── */}
      {wheel?.model ? (
        <section className="relative overflow-hidden border-y border-hairline-ink py-24 md:py-32">
          <div className="blueprint pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_30%_50%,black,transparent_70%)]" aria-hidden="true" />
          <div className="content-frame relative grid items-center gap-12 lg:grid-cols-2">
            <div className="relative order-2 aspect-square overflow-hidden rounded-[32px] border border-hairline-ink bg-[radial-gradient(ellipse_at_50%_50%,rgba(196,255,77,.07),transparent_65%)] lg:order-1" data-reveal>
              <ModelViewer src={wheel.model} poster={wheel.image} alt={wheel.title[locale]} finish={wheel.finish} view={wheel.view} rotate={wheel.rotate} loadingLabel={t.item.loading} className="absolute inset-0" />
              <span className="glass pointer-events-none absolute top-4 left-4 rounded-full border border-hairline-ink px-3 py-1 font-mono text-[10.5px] text-on-ink-muted">{wheel.dimensions}</span>
            </div>
            <div className="order-1 lg:order-2">
              <SectionHeading eyebrow={t.showcase.eyebrow} title={t.showcase.title} lead={t.showcase.text} />
              <dl className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-hairline-ink bg-hairline-ink" data-reveal>
                {t.showcase.facts.map((f) => (
                  <div key={f.label} className="bg-ink-2 px-4 py-5">
                    <dt className="text-[12.5px] text-on-ink-muted">{f.label}</dt>
                    <dd className="mt-1 font-display text-[30px] font-semibold text-on-ink">{f.value}</dd>
                  </div>
                ))}
              </dl>
              <Link href={localPath(locale, `/library/${wheel.slug}`)} className={`${siteButtonVariants({ variant: 'ghost' })} mt-8`} data-reveal>
                {t.showcase.cta} →
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* ───────── Library preview ───────── */}
      <section className="content-frame py-24 md:py-32">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow={t.libraryPreview.eyebrow} title={t.libraryPreview.title} lead={t.libraryPreview.lead} />
          <Link href={localPath(locale, '/library')} className={siteButtonVariants({ variant: 'ghost' })}>
            {t.libraryPreview.cta} →
          </Link>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 3).map((item) => (
            <div key={item.slug} data-reveal>
              <LibraryCard item={item} locale={locale} categoryLabel={t.library.categories[item.category]} openLabel={t.library.open} />
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Status ───────── */}
      <section className="content-frame pb-24 md:pb-32">
        <SectionHeading eyebrow={t.status.eyebrow} title={t.status.title} />
        <div className="mt-12">
          <StatusBoard t={t.status} />
        </div>
      </section>

      {/* ───────── Pricing ───────── */}
      <section id="pricing" className="border-y border-hairline-ink bg-ink-2/60 py-24 md:py-32">
        <div className="content-frame">
          <SectionHeading eyebrow={t.pricing.eyebrow} title={t.pricing.title} lead={t.pricing.lead} />
          <div className="mt-14">
            <PricingPlans locale={locale} t={t.pricing} />
          </div>
        </div>
      </section>

      {/* ───────── Story ───────── */}
      <section className="content-frame py-24 md:py-32">
        <SectionHeading eyebrow={t.story.eyebrow} title={t.story.title} />
        <ol className="relative mt-14 grid gap-8 md:grid-cols-4 md:gap-5">
          <span className="absolute top-[7px] right-0 left-0 hidden h-px bg-gradient-to-r from-hairline-ink-strong via-steel/50 to-signal md:block" aria-hidden="true" />
          {t.story.items.map((s, i) => (
            <li key={s.year} className="relative pl-6 md:pl-0 md:pt-8" data-reveal style={{ '--reveal-delay': `${i * 100}ms` } as React.CSSProperties}>
              <span
                className={`absolute top-1 left-0 size-3.5 rounded-full border-2 md:top-0 ${i === t.story.items.length - 1 ? 'border-signal bg-signal shadow-[0_0_16px_rgba(196,255,77,.8)]' : 'border-steel bg-ink'}`}
                aria-hidden="true"
              />
              <div className="font-mono text-[12px] text-steel">{s.year}</div>
              <div className="mt-2 font-display text-[22px] font-semibold text-on-ink">{s.name}</div>
              <p className="mt-1.5 text-[14px] text-on-ink-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="content-frame grid gap-12 pb-24 md:pb-32 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeading eyebrow={t.faq.eyebrow} title={t.faq.title} />
        <Faq t={t.faq} />
      </section>

      {/* ───────── Final CTA + form ───────── */}
      <section id="contact" className="content-frame">
        <div className="relative overflow-hidden rounded-[36px] border border-hairline-ink bg-ink-2 p-7 md:p-14">
          <div className="pointer-events-none absolute -top-40 -left-20 h-[420px] w-[620px] rounded-full bg-signal/[.08] blur-[120px]" aria-hidden="true" />
          <div className="blueprint pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
          <div className="relative grid gap-12 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <Eyebrow>{t.nav.cta}</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(30px,4.4vw,52px)] leading-[1.05] font-semibold tracking-[-.025em] text-balance text-on-ink">{t.cta.title}</h2>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-on-ink-muted">{t.cta.text}</p>
            </div>
            <LeadForm locale={locale} t={t.form} />
          </div>
        </div>
      </section>
    </>
  );
}
