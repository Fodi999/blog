import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cateringPages, cateringSlugs, cateringText, isCateringSlug } from '@/lib/catering';
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
  const path = `/${landing}`;

  return {
    title: page.title[locale],
    description: page.metaDescription[locale],
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
      title: page.title[locale],
      description: page.metaDescription[locale],
      images: [{ url: page.image, width: 1600, height: 1067, alt: page.title[locale] }],
    },
  };
}

export default async function CateringLandingPage({ params }: { params: Promise<{ locale: string; landing: string }> }) {
  const { locale, landing } = await params;
  if (!isLocale(locale) || !isCateringSlug(landing)) notFound();

  const activeLocale = locale as Locale;
  const page = cateringPages[landing];
  const t = cateringText[activeLocale];
  const cityLinks = cateringSlugs.filter((slug) => slug !== landing);
  const contactSubject = encodeURIComponent(`Catering ${page.city}`);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FoodService',
        '@id': `${baseUrl}/${activeLocale}/${landing}#foodservice`,
        name: `Dima Fomin - ${page.title.pl}`,
        url: `${baseUrl}/${activeLocale}/${landing}`,
        image: page.image,
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
    <article className="catering-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="catering-hero">
        <div className="catering-hero__copy">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{page.title[activeLocale]}</h1>
          <p>{page.lead[activeLocale]}</p>
          <div className="hero__actions">
            <a className="button button--dark" href={`mailto:kontakt@dima-fomin.pl?subject=${contactSubject}`} data-ga-event="catering_email_click" data-ga-label={landing}>
              {t.primaryCta}
            </a>
            <a className="button button--line" href="#delivery">{t.secondaryCta}</a>
          </div>
        </div>
        <div className="catering-hero__media">
          <img src={page.image} alt={page.title[activeLocale]} />
          <div className="catering-hero__proof">
            {t.proof.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section catering-intro">
        <div className="section-heading">
          <p className="eyebrow">{page.area}</p>
          <h2>{t.serviceTitle}</h2>
          <p>{t.serviceLead}</p>
        </div>
        <div className="catering-card-grid">
          {t.services.map((service) => (
            <article className="catering-card" key={service.title}>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--dark catering-delivery" id="delivery">
        <div className="section-heading">
          <p className="eyebrow">{page.city}</p>
          <h2>{t.deliveryTitle}</h2>
          <p>{t.deliveryLead}</p>
        </div>
        <div className="district-grid">
          {page.districts.map((district) => (
            <span key={district}>{district}</span>
          ))}
        </div>
        <div className="city-link-panel">
          <p className="eyebrow">{t.cityLinksTitle}</p>
          <div>
            {cityLinks.map((slug) => (
              <Link key={slug} href={localPath(activeLocale, `/${slug}`)}>
                {cateringPages[slug].city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section catering-packages">
        <div className="section-heading">
          <p className="eyebrow">Menu</p>
          <h2>{t.packageTitle}</h2>
        </div>
        <div className="catering-package-grid">
          {t.packages.map((item) => (
            <article className="catering-package" key={item.title}>
              <span>{item.title}</span>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section catering-process">
        <div className="section-heading">
          <p className="eyebrow">Order</p>
          <h2>{t.processTitle}</h2>
        </div>
        <ol>
          {t.process.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="section catering-faq">
        <div className="section-heading">
          <p className="eyebrow">FAQ</p>
          <h2>{t.faqTitle}</h2>
        </div>
        <div className="faq-list">
          {t.faq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section catering-request" id="request">
        <div>
          <p className="eyebrow">{t.primaryCta}</p>
          <h2>{t.formTitle}</h2>
          <p>{t.formLead}</p>
        </div>
        <form action="mailto:kontakt@dima-fomin.pl" method="post" encType="text/plain">
          <label>
            {t.fields.name}
            <input name="name" autoComplete="name" />
          </label>
          <label>
            {t.fields.phone}
            <input name="phone" type="tel" autoComplete="tel" />
          </label>
          <label>
            {t.fields.city}
            <input name="city" defaultValue={page.city} />
          </label>
          <label>
            {t.fields.date}
            <input name="date" type="date" />
          </label>
          <label className="catering-request__wide">
            {t.fields.message}
            <textarea name="message" rows={5} defaultValue={`${page.title[activeLocale]}\n`} />
          </label>
          <button className="button button--dark" type="submit" data-ga-event="catering_form_submit" data-ga-label={landing}>
            {t.fields.submit}
          </button>
        </form>
      </section>
    </article>
  );
}
