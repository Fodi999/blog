import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DirectContacts } from '@/components/DirectContacts';
import { Protocol, Revisions, SpecList, TitleBlock } from '@/components/drawing';
import { LeadForm } from '@/components/LeadForm';
import { ModelViewer } from '@/components/ModelViewer';
import { Faq, SectionHeading } from '@/components/sections';
import { siteButtonVariants } from '@/components/site/Button';
import { VideoEmbed } from '@/components/VideoEmbed';
import { fill, getDict, isLocale, localPath, type Locale } from '@/lib/i18n';
import { getItems } from '@/lib/library';
import { shots, type ShotId } from '@/lib/media';
import { INSTAGRAM_URL, pageMetadata, SITE_URL, TELEGRAM_URL, VIDEO, YOUTUBE_URL } from '@/lib/seo';
import { status } from '@/lib/status';
import { statusValues } from '@/lib/statusText';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return pageMetadata(locale, '', undefined, t.meta.description);
}

function jsonLd(locale: Locale, description: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${SITE_URL}/#org`, name: 'Monge', url: SITE_URL, logo: `${SITE_URL}/icon.svg`, founder: { '@id': `${SITE_URL}/#developer` } },
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#developer`,
        name: 'Dmytro Fomin',
        url: `${SITE_URL}/${locale}/about`,
        address: { '@type': 'PostalAddress', addressLocality: 'Gdańsk', addressCountry: 'PL' },
        sameAs: [YOUTUBE_URL, INSTAGRAM_URL, TELEGRAM_URL],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Monge',
        applicationCategory: 'DesignApplication',
        operatingSystem: 'macOS',
        softwareVersion: status.version,
        description,
        url: `${SITE_URL}/${locale}`,
        author: { '@id': `${SITE_URL}/#developer` },
        publisher: { '@id': `${SITE_URL}/#org` },
      },
    ],
  };
}

const section = 'content-frame scroll-mt-24 pt-28 md:pt-36';

function Shot({ id, alt, caption, n, fig, priority = false }: { id: ShotId; alt: string; caption: string; n: number; fig: string; priority?: boolean }) {
  const s = shots[id];
  return (
    <figure>
      <a href={s.src} target="_blank" rel="noopener" className="block overflow-hidden border border-hairline-ink-strong bg-ink-2 transition-colors hover:border-on-ink/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.src} width={s.w} height={s.h} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" className="aspect-[16/10] w-full object-cover" />
      </a>
      <figcaption className="mt-3 max-w-[70ch] text-[14.5px] leading-snug text-on-ink-muted">
        <span className="text-on-ink">
          {fig} {n}.
        </span>{' '}
        {caption}
      </figcaption>
    </figure>
  );
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const v = statusValues(locale, t);
  const items = await getItems();
  const heroItem = items.find((i) => i.category === 'stainless' && i.model) ?? items.find((i) => i.model);
  const shot = (key: string) => t.now.shots.find((s) => s.key === key)!;
  const gallery: ShotId[] = ['suspension', 'wheel', 'render'];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(locale, t.meta.description)) }} />

      {/* Hero: what Monge is, a live model from it, and the project's title block. */}
      <section className="pt-28 md:pt-36">
        <div className="content-frame grid items-end gap-10 lg:grid-cols-[1fr_1.05fr]">
          <div className="animate-reveal">
            <h1 className="font-display text-[clamp(44px,6.2vw,92px)] leading-[.95] font-semibold tracking-[-.015em] text-balance text-on-ink">{t.hero.title}</h1>
            <p className="mt-7 max-w-[56ch] text-[18.5px] leading-relaxed text-pretty text-on-ink-muted">{t.hero.lead}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href={`${localPath(locale)}#beta`} className={siteButtonVariants({ variant: 'primary', size: 'lg' })} data-ga-event="cta_hero">
                {t.hero.primary}
              </Link>
              <Link href={`${localPath(locale)}#protocol`} className={siteButtonVariants({ variant: 'ghost', size: 'lg' })}>
                {t.hero.secondary}
              </Link>
            </div>
            <p className="mt-5 text-[14.5px] text-on-ink-muted">{t.hero.note}</p>
          </div>

          {heroItem?.model ? (
            <div className="relative animate-reveal [animation-delay:120ms]">
              <div className="relative aspect-[5/4] overflow-hidden border border-hairline-ink-strong bg-ink-2">
                <div className="blueprint absolute inset-0 opacity-60" aria-hidden="true" />
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
                <div className="pointer-events-none absolute top-3 left-3 text-[13px] leading-snug text-on-ink-muted">
                  <span className="text-on-ink">{t.hero.viewerLabel}</span>
                  <span className="block">{heroItem.title[locale]}</span>
                </div>
                <svg viewBox="0 0 40 40" className="pointer-events-none absolute top-3 right-3 size-10" aria-hidden="true">
                  <path d="M8 32h20" stroke="#ff6b5b" strokeWidth="1.5" />
                  <path d="M8 32V12" stroke="#c4ff4d" strokeWidth="1.5" />
                  <path d="M8 32l12-8" stroke="#5cd2ff" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          ) : null}
        </div>
        <div className="content-frame mt-8">
          <TitleBlock locale={locale} t={t} className="animate-reveal [animation-delay:240ms] lg:ml-auto lg:max-w-[900px]" />
        </div>
      </section>

      {/* The program as it is today. */}
      <section aria-labelledby="now" className={section}>
        <SectionHeading id="now" title={t.now.title} lead={fill(t.now.lead, v)} />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:items-end">
          <VideoEmbed id={VIDEO.id} title={t.now.videoTitle} meta={t.now.videoMeta} playLabel={t.now.play} />
          <div>
            <p className="max-w-[44ch] text-[17px] leading-relaxed text-on-ink">{t.now.videoText}</p>
            <a href={VIDEO.url} target="_blank" rel="noopener noreferrer" className={`${siteButtonVariants({ variant: 'ghost' })} mt-6`} data-ga-event="video_open">
              {t.now.open}
            </a>
            <p className="mt-4 text-[13.5px] text-on-ink-muted">{t.now.videoPrivacy}</p>
          </div>
        </div>
        <div className="mt-14 grid gap-x-6 gap-y-10 md:grid-cols-3">
          {gallery.map((key, i) => (
            <Shot key={key} id={key} alt={shot(key).alt} caption={shot(key).caption} n={i + 1} fig={t.now.fig} />
          ))}
        </div>
      </section>

      {/* Directions. */}
      <section id="directions" aria-labelledby="directions-title" className={section}>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.7fr]">
          <SectionHeading id="directions-title" title={t.directions.title} lead={t.directions.lead} />
          <ul className="border-t-2 border-on-ink/45">
            {t.directions.items.map((d) => (
              <li key={d.title} className="grid gap-2 border-b border-hairline-ink-strong py-6 sm:grid-cols-[minmax(190px,.8fr)_1.4fr] sm:gap-8">
                <h3 className="font-display text-[23px] leading-tight font-semibold text-on-ink">{d.title}</h3>
                <p className="text-[16.5px] leading-relaxed text-on-ink-muted">{d.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Its own kernel. */}
      <section id="kernel" aria-labelledby="kernel-title" className={section}>
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div>
            <SectionHeading id="kernel-title" title={t.kernel.title} lead={t.kernel.lead} />
            <SpecList items={t.kernel.facts.map(([k, d]) => [k, fill(d, v)])} className="mt-8" />
            <Link href={localPath(locale, '/kernel')} className={`${siteButtonVariants({ variant: 'ghost' })} mt-8`}>
              {t.kernel.link}
            </Link>
          </div>
          <figure className="lg:sticky lg:top-28">
            <div className="overflow-hidden border border-hairline-ink-strong bg-ink-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shots.disc.src} width={shots.disc.w} height={shots.disc.h} alt={shot('disc').alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
            </div>
            <figcaption className="mt-3 text-[14.5px] leading-snug text-on-ink-muted">{t.kernel.figure}</figcaption>
          </figure>
        </div>
      </section>

      {/* Test protocol. */}
      <section id="protocol" aria-labelledby="protocol-title" className={section}>
        <SectionHeading id="protocol-title" title={t.protocol.title} lead={fill(t.protocol.lead, v)} />
        <div className="mt-10">
          <Protocol locale={locale} t={t} />
        </div>
        <Link href={localPath(locale, '/kernel')} className={`${siteButtonVariants({ variant: 'ghost' })} mt-6`}>
          {t.protocol.link}
        </Link>
      </section>

      {/* Stage and development log. */}
      <section id="progress" aria-labelledby="progress-title" className={section}>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.7fr]">
          <div>
            <SectionHeading id="progress-title" title={t.progress.title} />
            <SpecList items={t.progress.stage} className="mt-8" />
          </div>
          <div>
            <h3 className="font-display text-[26px] font-semibold text-on-ink">{t.progress.historyTitle}</h3>
            <div className="mt-4">
              <Revisions t={t} />
            </div>
            <h3 className="mt-12 font-display text-[26px] font-semibold text-on-ink">{t.progress.nextTitle}</h3>
            <ul className="mt-4 border-t border-hairline-ink-strong">
              {t.progress.next.map((n) => (
                <li key={n} className="flex gap-4 border-b border-hairline-ink-strong py-3.5 text-[16px] leading-snug text-on-ink">
                  <span className="mt-[11px] h-px w-4 shrink-0 bg-steel" aria-hidden="true" />
                  {fill(n, v)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* The developer. */}
      <section aria-labelledby="developer-title" className={section}>
        <div className="grid gap-8 border-y-2 border-on-ink/45 py-10 lg:grid-cols-[1fr_1.7fr] lg:gap-12">
          <div>
            <p className="text-[14px] font-medium text-steel">{t.developer.title}</p>
            <h2 id="developer-title" className="mt-2 font-display text-[clamp(34px,4vw,48px)] leading-none font-semibold text-on-ink">
              {t.developer.name}
            </h2>
            <p className="mt-3 text-[16px] text-on-ink-muted">{t.developer.role}</p>
          </div>
          <div>
            <p className="max-w-[64ch] text-[17.5px] leading-relaxed text-on-ink">{t.developer.text}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href={localPath(locale, '/about')} className={siteButtonVariants({ variant: 'ghost' })}>
                {t.developer.link}
              </Link>
              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className={siteButtonVariants({ variant: 'quiet-light' })}>
                {t.updates.youtube}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Beta sign-up. */}
      <section id="beta" aria-labelledby="beta-title" className={section}>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <div>
            <SectionHeading id="beta-title" title={t.updates.title} lead={t.updates.text} />
            <DirectContacts t={t.contacts} className="mt-8" />
          </div>
          <div className="border-2 border-on-ink/45 p-6 md:p-8">
            <LeadForm locale={locale} t={t.form} beta context="home" />
          </div>
        </div>
      </section>

      {/* Questions. */}
      <section aria-labelledby="faq-title" className={`${section} grid gap-10 lg:grid-cols-[1fr_1.7fr]`}>
        <SectionHeading id="faq-title" title={t.faq.title} />
        <Faq t={t.faq} />
      </section>
    </>
  );
}
