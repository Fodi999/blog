import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LibraryCard } from '@/components/LibraryCard';
import { ModelViewer } from '@/components/ModelViewer';
import { Eyebrow } from '@/components/sections';
import { siteButtonVariants } from '@/components/site/Button';
import { getDict, isLocale, locales, localPath } from '@/lib/i18n';
import { formatsOf, getItem, getItems, seedItems } from '@/lib/library';
import { pageMetadata, SITE_URL } from '@/lib/seo';

export const revalidate = 600;
export const dynamicParams = true;

export function generateStaticParams() {
  return locales.flatMap((locale) => seedItems.map((i) => ({ locale, slug: i.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const item = await getItem(slug);
  if (!item) return {};
  return pageMetadata(locale, `/library/${slug}`, item.title[locale], item.summary[locale], item.image);
}

export default async function ItemPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const item = await getItem(slug);
  if (!item) notFound();
  const t = getDict(locale);
  const related = (await getItems()).filter((i) => i.slug !== item.slug).slice(0, 3);

  const specs: [string, string][] = [
    [t.item.material, item.material[locale]],
    [t.item.dimensions, item.dimensions],
    ...(item.massKg ? ([[t.item.mass, `${item.massKg.toLocaleString(locale)} kg`]] as [string, string][]) : []),
    ...(item.faces ? ([[t.item.faces, String(item.faces)]] as [string, string][]) : []),
    [t.item.formats, formatsOf(item).join(' · ')],
    [t.item.version, `Monge ${item.version}`],
  ];

  const ld = {
    '@context': 'https://schema.org',
    '@type': '3DModel',
    name: item.title[locale],
    description: item.summary[locale],
    image: `${SITE_URL}${item.image}`,
    url: `${SITE_URL}/${locale}/library/${item.slug}`,
    encoding: item.model ? [{ '@type': 'MediaObject', contentUrl: `${SITE_URL}${item.model}`, encodingFormat: 'model/gltf-binary' }] : undefined,
    dateModified: item.updated,
    creator: { '@type': 'Organization', name: 'Monge' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="content-frame pt-28 md:pt-32">
        <Link href={localPath(locale, '/library')} className="inline-flex items-center gap-2 text-[14px] text-on-ink-muted transition-colors hover:text-on-ink">
          ← {t.item.back}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="animate-reveal">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] border border-hairline-ink bg-[radial-gradient(ellipse_at_50%_50%,rgba(92,210,255,.12),rgba(7,9,12,0)_65%)]">
              <div className="blueprint absolute inset-0 opacity-70" aria-hidden="true" />
              {item.model ? (
                <ModelViewer
                  src={item.model}
                  poster={item.image}
                  alt={item.title[locale]}
                  finish={item.finish}
                  view={item.view}
                  rotate={item.rotate}
                  dims={item.dims}
                  labels={t.item.viewer}
                  loadingLabel={t.item.loading}
                  fallbackLabel={t.item.noWebgl}
                  className="absolute inset-0"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.title[locale]} className="absolute inset-0 size-full object-contain p-8" />
              )}
            </div>
            <p className="mt-3 text-center font-mono text-[11.5px] text-on-ink-muted">{t.item.viewerHint}</p>
          </div>

          <div className="animate-reveal [animation-delay:120ms]">
            <Eyebrow>{t.library.categories[item.category]}</Eyebrow>
            <h1 className="mt-4 font-display text-[clamp(28px,3.6vw,42px)] leading-[1.1] font-semibold tracking-[-.02em] text-balance text-on-ink">{item.title[locale]}</h1>
            <p className="mt-5 text-[16.5px] leading-relaxed text-on-ink-muted">{item.summary[locale]}</p>

            <h2 className="mt-9 font-mono text-[11.5px] tracking-[.14em] text-on-ink-muted uppercase">{t.item.specs}</h2>
            <dl className="mt-3 divide-y divide-hairline-ink rounded-2xl border border-hairline-ink bg-ink-2">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 px-5 py-3.5 text-[14.5px]">
                  <dt className="text-on-ink-muted">{k}</dt>
                  <dd className="text-right text-on-ink">{v}</dd>
                </div>
              ))}
            </dl>

            <h2 className="mt-9 font-mono text-[11.5px] tracking-[.14em] text-on-ink-muted uppercase">{t.item.downloads}</h2>
            <ul className="mt-3 space-y-2.5">
              {item.files.map((f) => (
                <li key={f.href} className="flex items-center justify-between gap-4 rounded-2xl border border-hairline-ink bg-ink-2 px-5 py-3.5">
                  <span className="flex items-center gap-3">
                    <span className="rounded-md border border-hairline-ink-strong px-2 py-0.5 font-mono text-[11px] text-on-ink">{f.format}</span>
                    <span className="text-[14px] text-on-ink-muted">{f.format === 'GLB' ? t.item.preview : f.access === 'free' ? t.item.free : t.item.getPro}</span>
                  </span>
                  {f.access === 'free' ? (
                    <a href={f.href} download className={siteButtonVariants({ variant: 'ghost', size: 'sm' })} data-ga-event="file_download" data-ga-item-id={item.slug} data-ga-label={f.format}>
                      ↓
                    </a>
                  ) : (
                    <Link href={localPath(locale, '/pricing')} className="rounded-full bg-signal/10 px-3 py-1 font-mono text-[11px] font-medium text-signal">
                      {t.item.pro}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            <Link href={localPath(locale, '/contact?kind=early_access')} className={`${siteButtonVariants({ variant: 'primary' })} mt-8 w-full`} data-ga-event="cta_item">
              {t.nav.cta}
            </Link>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="content-frame mt-24">
          <h2 className="font-display text-[24px] font-semibold text-on-ink">{t.item.related}</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <LibraryCard key={r.slug} item={r} locale={locale} categoryLabel={t.library.categories[r.category]} openLabel={t.library.open} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
