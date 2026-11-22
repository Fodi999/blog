import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SpecList } from '@/components/drawing';
import { PageHero } from '@/components/sections';
import { siteButtonVariants } from '@/components/site/Button';
import { getDict, isLocale, localPath } from '@/lib/i18n';
import { EMAIL, INSTAGRAM_URL, pageMetadata, PHOTO, SITE_URL, TELEGRAM_URL, YOUTUBE_URL } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return pageMetadata(locale, '/about', t.about.title, `${t.about.role} ${t.about.text[0]}`, PHOTO);
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const a = t.about;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      '@id': `${SITE_URL}/#developer`,
      name: 'Dima Fomin',
      alternateName: ['Dmytro Fomin', 'Дима Фомин'],
      jobTitle: a.role,
      description: a.role,
      image: `${SITE_URL}${PHOTO}`,
      email: `mailto:${EMAIL}`,
      address: { '@type': 'PostalAddress', addressLocality: 'Gdańsk', addressCountry: 'PL' },
      sameAs: [YOUTUBE_URL, INSTAGRAM_URL, TELEGRAM_URL],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <PageHero eyebrow={t.developer.title} title={a.title} lead={a.role} />
      <section className="content-frame grid gap-12 border-t-2 border-on-ink/45 pt-10 lg:grid-cols-[1.7fr_1fr]">
        <div className="grid max-w-[66ch] content-start gap-6">
          {a.text.map((p) =>
            // a paragraph written **so** is the story's turn: set apart, in the signal colour's rule
            p.startsWith('**') && p.endsWith('**') ? (
              <p key={p} className="border-l-2 border-signal pl-5 font-display text-[22px] leading-snug font-semibold text-on-ink">
                {p.slice(2, -2)}
              </p>
            ) : (
              <p key={p} className="text-[18px] leading-relaxed text-on-ink">
                {p}
              </p>
            ),
          )}
        </div>
        <aside>
          <figure className="mb-8 overflow-hidden rounded-xl border border-hairline-ink-strong bg-bone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PHOTO} alt={a.photo} width={720} height={960} decoding="async" className="aspect-[3/4] w-full object-cover" />
          </figure>
          <SpecList items={a.facts} />
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href={`mailto:${EMAIL}`} className={siteButtonVariants({ variant: 'primary' })} data-ga-event="email_developer">
              {a.write}: {EMAIL}
            </a>
            <Link href={localPath(locale, '/contact?kind=other')} className={siteButtonVariants({ variant: 'ghost' })}>
              {t.nav.contact}
            </Link>
            <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className={siteButtonVariants({ variant: 'quiet-light' })}>
              {a.youtube}
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={siteButtonVariants({ variant: 'quiet-light' })}>
              Instagram
            </a>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={siteButtonVariants({ variant: 'quiet-light' })}>
              Telegram
            </a>
          </div>
        </aside>
      </section>
    </>
  );
}
