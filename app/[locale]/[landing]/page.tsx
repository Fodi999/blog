import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleBody } from '@/components/ArticleBody';
import { siteButtonVariants } from '@/components/site/Button';
import { eyebrowClass } from '@/components/site/classes';
import { cateringPages, cateringSlugs, cateringText, isCateringSlug } from '@/lib/catering';
import { articleContent, articleDescription, articleSeoTitle, articleTitle, getSiteArticle } from '@/lib/cms';
import { isLocale, localPath, locales, type Locale } from '@/lib/i18n';

export const revalidate = 300;

const baseUrl = 'https://dima-fomin.pl';

export function generateStaticParams() {
  return locales.flatMap((locale) => cateringSlugs.map((landing) => ({ locale, landing })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; landing: string }> }): Promise<Metadata> {
  const { locale, landing } = await params;
  if (!isLocale(locale) || !isCateringSlug(landing)) return {};
  const page = cateringPages[landing];
  const cmsPage = await getSiteArticle(landing);
  const path = `/${landing}`;
  const title = cmsPage ? articleSeoTitle(cmsPage, locale) : page.title[locale];
  const description = cmsPage ? articleDescription(cmsPage, locale) : page.metaDescription[locale];
  const image = cmsPage?.image_url || page.image;

  return {
    title,
    description,
    alternates: {
      canonical: localPath(locale, path),
      languages: {
        ...Object.fromEntries(locales.map((item) => [item, `${baseUrl}/${item}${path}`])),
        'x-default': `${baseUrl}/pl${path}`,
      },
    },
    openGraph: {
      type: 'website',
      url: `${baseUrl}/${locale}${path}`,
      title,
      description,
      images: [{ url: image, width: 1600, height: 1067, alt: title }],
    },
  };
}

const sectionClass = 'content-frame py-20 md:py-28';
const narrowHeadingWrapClass = 'mb-14 max-w-[720px] animate-reveal md:mb-16';

export default async function CateringLandingPage({ params }: { params: Promise<{ locale: string; landing: string }> }) {
  const { locale, landing } = await params;
  if (!isLocale(locale) || !isCateringSlug(landing)) notFound();

  const activeLocale = locale as Locale;
  const page = cateringPages[landing];
  const cmsPage = await getSiteArticle(landing);
  const t = cateringText[activeLocale];
  const cityLinks = cateringSlugs.filter((slug) => slug !== landing);
  const pageTitle = cmsPage ? articleTitle(cmsPage, activeLocale) : page.title[activeLocale];
  const pageLead = cmsPage ? articleDescription(cmsPage, activeLocale) : page.lead[activeLocale];
  const pageImage = cmsPage?.image_url || page.image;
  const managedContent = cmsPage ? articleContent(cmsPage, activeLocale) : '';
  const contactSubject = encodeURIComponent(`Catering ${page.city}`);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FoodService',
        '@id': `${baseUrl}/${activeLocale}/${landing}#foodservice`,
        name: `Dima Fomin - ${page.title.pl}`,
        url: `${baseUrl}/${activeLocale}/${landing}`,
        image: pageImage,
        telephone: '+48576212418',
        email: 'kontakt@dima-fomin.pl',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Gdańsk',
          addressRegion: 'Pomorskie',
          addressCountry: 'PL',
        },
        areaServed: page.districts.map((district) => ({ '@type': 'Place', name: district })),
        servesCuisine: ['catering dietetyczny', 'catering firmowy', 'zdrowe posiłki'],
        sameAs: ['https://instagram.com/fodifood'],
      },
      {
        '@type': 'FAQPage',
        '@id': `${baseUrl}/${activeLocale}/${landing}#faq`,
        mainEntity: t.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <article className="overflow-hidden bg-ink text-on-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="content-frame grid min-h-[calc(100dvh-80px)] grid-cols-1 items-center gap-12 py-20 md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:py-28">
        <div className="order-2 md:order-1">
          <p className={`${eyebrowClass} animate-reveal`}>{t.eyebrow}</p>
          <h1 className="animate-reveal mt-5 max-w-[18ch] text-balance font-display text-[clamp(38px,5.6vw,68px)] leading-[1.05] font-medium" style={{ animationDelay: '60ms' }}>
            {pageTitle}
          </h1>
          <p className="animate-reveal mt-6 max-w-[52ch] text-[clamp(16px,1.3vw,19px)] leading-[1.6] text-on-ink-muted" style={{ animationDelay: '120ms' }}>
            {pageLead}
          </p>
          <div className="animate-reveal mt-9 flex flex-wrap gap-3" style={{ animationDelay: '180ms' }}>
            <a
              className={siteButtonVariants({ variant: 'light' })}
              href={`mailto:kontakt@dima-fomin.pl?subject=${contactSubject}`}
              data-ga-event="catering_email_click"
              data-ga-label={landing}
            >
              {t.primaryCta}
            </a>
            <a className={siteButtonVariants({ variant: 'outline-light' })} href="#delivery">
              {t.secondaryCta}
            </a>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="relative aspect-[4/5] overflow-hidden bg-ink-2 md:aspect-[3/4]">
            <img className="size-full object-cover" src={pageImage} alt={pageTitle} />
            <div className="absolute inset-x-5 bottom-5 grid gap-2">
              {t.proof.map((item) => (
                <span key={item} className="w-max max-w-full border border-white/20 bg-ink/80 px-3 py-2.5 text-xs font-bold tracking-[.02em] text-on-ink uppercase backdrop-blur-md">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {managedContent ? (
        <section className="bg-bone">
          <div className="content-frame-reading py-20 md:py-28">
            <ArticleBody content={managedContent} />
          </div>
        </section>
      ) : null}

      <section className={sectionClass}>
        <div className={narrowHeadingWrapClass}>
          <p className={eyebrowClass}>{page.area}</p>
          <h2 className="mt-4 font-display text-[clamp(30px,3.6vw,44px)] leading-[1.08] font-medium">{t.serviceTitle}</h2>
          <p className="mt-4 text-[16.5px] leading-[1.6] text-on-ink-muted">{t.serviceLead}</p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {t.services.map((service, index) => (
            <article
              className="min-h-[200px] animate-reveal border-t-2 border-on-ink pt-6"
              style={{ animationDelay: `${index * 80}ms` }}
              key={service.title}
            >
              <h3 className="mb-3 font-display text-2xl font-medium">{service.title}</h3>
              <p className="max-w-[38ch] leading-[1.6] text-on-ink-muted">{service.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-hairline-ink bg-ink-2" id="delivery">
        <div className={sectionClass}>
          <div className={narrowHeadingWrapClass}>
            <p className={eyebrowClass}>{page.city}</p>
            <h2 className="mt-4 font-display text-[clamp(30px,3.6vw,44px)] leading-[1.08] font-medium">{t.deliveryTitle}</h2>
            <p className="mt-4 text-[16.5px] leading-[1.6] text-on-ink-muted">{t.deliveryLead}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {page.districts.map((district) => (
              <span key={district} className="border border-hairline-ink-strong p-4 font-display text-lg leading-[1.1] font-medium">
                {district}
              </span>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-1 items-center gap-x-8 gap-y-5 border-t border-hairline-ink pt-8 sm:grid-cols-[auto_1fr]">
            <p className={eyebrowClass}>{t.cityLinksTitle}</p>
            <div className="flex flex-wrap gap-2.5">
              {cityLinks.map((slug) => (
                <Link
                  key={slug}
                  className="border border-hairline-ink-strong px-3.5 py-3 text-xs font-bold tracking-[.04em] uppercase transition-colors duration-hover ease-premium hover:border-gold hover:text-gold"
                  href={localPath(activeLocale, `/${slug}`)}
                >
                  {cateringPages[slug].city}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className={`${narrowHeadingWrapClass} flex flex-wrap items-end justify-between gap-6`}>
          <div>
            <p className={eyebrowClass}>Menu</p>
            <h2 className="mt-4 font-display text-[clamp(30px,3.6vw,44px)] leading-[1.08] font-medium">{t.packageTitle}</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {t.packages.map((item, index) => (
            <article
              className="grid min-h-[220px] animate-reveal content-start gap-4 border-t-2 border-on-ink pt-6"
              style={{ animationDelay: `${index * 80}ms` }}
              key={item.title}
            >
              <span className="font-display text-[clamp(34px,4.4vw,56px)] leading-[0.95] font-medium italic">{item.title}</span>
              <p className="max-w-[38ch] leading-[1.6] text-on-ink-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ink-2">
        <div className={sectionClass}>
          <div className={narrowHeadingWrapClass}>
            <p className={eyebrowClass}>Order</p>
            <h2 className="mt-4 font-display text-[clamp(30px,3.6vw,44px)] leading-[1.08] font-medium">{t.processTitle}</h2>
          </div>
          <ol className="m-0 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-3">
            {t.process.map((item, index) => (
              <li
                key={item}
                className="min-h-[180px] animate-reveal border border-hairline-ink bg-ink p-7 text-[17px] leading-[1.4]"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <span aria-hidden className="mb-8 block font-display text-2xl italic text-gold">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={sectionClass}>
        <div className={narrowHeadingWrapClass}>
          <p className={eyebrowClass}>FAQ</p>
          <h2 className="mt-4 font-display text-[clamp(30px,3.6vw,44px)] leading-[1.08] font-medium">{t.faqTitle}</h2>
        </div>
        <div className="border-t-2 border-on-ink">
          {t.faq.map((item) => (
            <details key={item.question} className="group border-b border-hairline-ink">
              <summary className="cursor-pointer list-none py-6 font-display text-xl leading-[1.2] font-medium marker:content-none">
                <span className="mr-3 text-gold transition-transform duration-ui ease-premium group-open:rotate-45 inline-block">+</span>
                {item.question}
              </summary>
              <p className="max-w-[70ch] pb-6 pl-7 text-[16.5px] leading-[1.6] text-on-ink-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-bone text-on-bone" id="request">
        <div className="content-frame grid grid-cols-1 gap-10 py-20 md:grid-cols-[minmax(0,0.75fr)_minmax(420px,1fr)] md:gap-[7vw] md:py-28">
          <div className="animate-reveal max-w-[500px]">
            <p className={eyebrowClass}>{t.primaryCta}</p>
            <h2 className="mt-4 font-display text-[clamp(28px,3.2vw,42px)] leading-[1.1] font-medium">{t.formTitle}</h2>
            <p className="mt-4 text-[16.5px] leading-[1.6] text-on-bone-muted">{t.formLead}</p>
          </div>
          <form className="animate-reveal grid grid-cols-2 gap-4 max-[580px]:grid-cols-1" action="mailto:kontakt@dima-fomin.pl" method="post" encType="text/plain" style={{ animationDelay: '80ms' }}>
            <label className="grid gap-2 text-xs font-bold tracking-[.06em] text-on-bone-muted uppercase">
              {t.fields.name}
              <input
                className="w-full border border-hairline-bone bg-white p-4 text-on-bone [font:inherit] focus:border-gold focus:outline-none"
                name="name"
                autoComplete="name"
              />
            </label>
            <label className="grid gap-2 text-xs font-bold tracking-[.06em] text-on-bone-muted uppercase">
              {t.fields.phone}
              <input
                className="w-full border border-hairline-bone bg-white p-4 text-on-bone [font:inherit] focus:border-gold focus:outline-none"
                name="phone"
                type="tel"
                autoComplete="tel"
              />
            </label>
            <label className="grid gap-2 text-xs font-bold tracking-[.06em] text-on-bone-muted uppercase">
              {t.fields.city}
              <input
                className="w-full border border-hairline-bone bg-white p-4 text-on-bone [font:inherit] focus:border-gold focus:outline-none"
                name="city"
                defaultValue={page.city}
              />
            </label>
            <label className="grid gap-2 text-xs font-bold tracking-[.06em] text-on-bone-muted uppercase">
              {t.fields.date}
              <input
                className="w-full border border-hairline-bone bg-white p-4 text-on-bone [font:inherit] focus:border-gold focus:outline-none"
                name="date"
                type="date"
              />
            </label>
            <label className="col-span-full grid gap-2 text-xs font-bold tracking-[.06em] text-on-bone-muted uppercase">
              {t.fields.message}
              <textarea
                className="w-full resize-y border border-hairline-bone bg-white p-4 text-on-bone [font:inherit] focus:border-gold focus:outline-none"
                name="message"
                rows={5}
                defaultValue={`${page.title[activeLocale]}\n`}
              />
            </label>
            <button className={`${siteButtonVariants({ variant: 'dark' })} col-span-full`} type="submit" data-ga-event="catering_form_submit" data-ga-label={landing}>
              {t.fields.submit}
            </button>
          </form>
        </div>
      </section>
    </article>
  );
}
