import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleBody } from '@/components/ArticleBody';
import { eyebrowClass } from '@/components/site/classes';
import { articleContent, articleDescription, articleTitle, getAboutPage, getSiteArticle } from '@/lib/cms';
import { getCopy, isLocale, localPath } from '@/lib/i18n';
import { languageAlternates, ogLocale, SITE_URL } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getCopy(locale);
  const page = await getSiteArticle('kontakt');
  const path = '/kontakt';
  const title = page ? articleTitle(page, locale) : t.contact.title;
  const description = page ? articleDescription(page, locale) : t.contact.title;
  return {
    title,
    description,
    alternates: {
      canonical: localPath(locale, path),
      languages: languageAlternates(path),
    },
    openGraph: {
      type: 'website',
      locale: ogLocale[locale],
      url: `${SITE_URL}/${locale}${path}`,
      title,
      description,
    },
  };
}

function contactConfig(content: string) {
  let email = 'kontakt@dima-fomin.pl';
  let instagram = 'https://instagram.com';
  const body: string[] = [];

  for (const line of content.split(/\r?\n/)) {
    const emailMatch = line.match(/^email:\s*(.+)$/i);
    const instagramMatch = line.match(/^instagram:\s*(.+)$/i);

    if (emailMatch) {
      email = emailMatch[1].trim();
      continue;
    }

    if (instagramMatch) {
      instagram = instagramMatch[1].trim();
      continue;
    }

    body.push(line);
  }

  return { email, instagram, body: body.join('\n').trim() };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);
  const [page, about] = await Promise.all([getSiteArticle('kontakt'), getAboutPage()]);
  const title = page ? articleTitle(page, locale) : t.contact.title;
  const content = page ? articleContent(page, locale) : '';
  const contact = contactConfig(content);

  return (
    <section className="bg-ink text-on-ink">
      <div className="content-frame py-24 md:py-32">
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] md:gap-x-[7vw]">
          <div>
            <p className={`${eyebrowClass} animate-reveal`}>{t.nav.contact}</p>
            <h1 className="animate-reveal mt-5 max-w-[18ch] text-balance font-display text-[clamp(40px,6vw,72px)] leading-[1.05] font-medium" style={{ animationDelay: '60ms' }}>
              {title}
            </h1>
            {contact.body ? (
              <div className="animate-reveal mt-10" style={{ animationDelay: '120ms' }}>
                <ArticleBody content={contact.body} dark />
              </div>
            ) : null}
          </div>
          {about?.image_url ? (
            <div className="animate-reveal order-first aspect-[4/5] overflow-hidden bg-ink-2 md:order-none" style={{ animationDelay: '80ms' }}>
              <img className="size-full object-cover" src={about.image_url} alt="Dima Fomin" />
            </div>
          ) : null}
        </div>

        <div className="animate-reveal mt-16 border-t-2 border-on-ink md:mt-20" style={{ animationDelay: '160ms' }}>
          <a
            className="group flex flex-col gap-2 border-b border-hairline-ink py-8 transition-colors duration-ui ease-premium hover:text-gold sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            href={`mailto:${contact.email}`}
            data-ga-event="email_click"
            data-ga-label="contact_email"
          >
            <span>
              <span className="block text-xs font-bold tracking-[.14em] text-on-ink-muted uppercase">Email</span>
              <span className="font-display text-[clamp(24px,3.4vw,44px)] leading-tight font-medium">{contact.email}</span>
            </span>
            <span className="self-end text-2xl transition-transform duration-ui ease-premium group-hover:translate-x-1 group-hover:-translate-y-1 sm:self-auto">↗</span>
          </a>
          <a
            className="group flex flex-col gap-2 border-b border-hairline-ink py-8 transition-colors duration-ui ease-premium hover:text-gold sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            href={contact.instagram}
            target="_blank"
            rel="noreferrer"
            data-ga-event="social_click"
            data-ga-label="instagram"
          >
            <span>
              <span className="block text-xs font-bold tracking-[.14em] text-on-ink-muted uppercase">Instagram</span>
              <span className="font-display text-[clamp(24px,3.4vw,44px)] leading-tight font-medium">@fodifood</span>
            </span>
            <span className="self-end text-2xl transition-transform duration-ui ease-premium group-hover:translate-x-1 group-hover:-translate-y-1 sm:self-auto">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
