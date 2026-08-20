import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteButtonVariants } from '@/components/site/Button';
import { eyebrowClass } from '@/components/site/classes';
import {
  aboutContent,
  aboutTitle,
  experienceDescription,
  expertiseTitle,
  galleryAlt,
  galleryDescription,
  galleryTitle,
  getAboutPage,
  getExperience,
  getExpertise,
  getGallery
} from '@/lib/cms';
import { getCopy, isLocale, localPath } from '@/lib/i18n';
import { languageAlternates, ogLocale, SITE_URL } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getCopy(locale);
  const about = await getAboutPage();
  const path = '/o-mnie';
  const title = about ? aboutTitle(about, locale) : t.about.title;
  const description = t.about.p1;
  return {
    title,
    description,
    alternates: {
      canonical: localPath(locale, path),
      languages: languageAlternates(path),
    },
    openGraph: {
      type: 'profile',
      locale: ogLocale[locale],
      url: `${SITE_URL}/${locale}${path}`,
      title,
      description,
      images: about?.image_url ? [{ url: about.image_url }] : undefined,
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);
  const [about, gallery, experience, expertise] = await Promise.all([getAboutPage(), getGallery('kitchen'), getExperience(), getExpertise()]);
  const title = about ? aboutTitle(about, locale) : t.about.title;
  const content = about ? aboutContent(about, locale) : `${t.about.p1}\n\n${t.about.p2}`;
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);
  const offer = t.about.offer;
  const cv = t.about.cv;

  return (
    <section className="bg-ink text-on-ink">
      <div className="content-frame py-24 md:py-32">
        <header className="animate-reveal">
          <p className={eyebrowClass}>Dima Fomin</p>
          <h1 className="mt-5 max-w-[24ch] font-display text-[clamp(40px,6vw,72px)] leading-[1.05] font-medium">{title}</h1>
        </header>

        <div className="mt-16 grid grid-cols-1 items-start gap-10 md:mt-20 md:grid-cols-[minmax(280px,0.8fr)_minmax(400px,1.2fr)] md:gap-x-[7vw]">
          {about?.image_url && (
            <div className="animate-reveal aspect-[4/5] overflow-hidden bg-ink-2">
              <img className="size-full object-cover" src={about.image_url} alt="Dima Fomin" />
            </div>
          )}
          <div className="animate-reveal grid gap-5 md:mt-auto" style={{ animationDelay: '80ms' }}>
            {paragraphs.map((paragraph) => (
              <p className="text-[clamp(18px,1.7vw,22px)] leading-[1.6] text-on-ink-muted" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {expertise.length > 0 && (
          <section className="mt-16 grid animate-reveal grid-cols-2 gap-3 sm:grid-cols-4 md:mt-20" aria-label="Expertise">
            {expertise.map((item) => (
              <article key={item.id} className="min-w-0 border border-hairline-ink bg-ink-2 p-5">
                {/^https?:\/\//i.test(item.icon) ? (
                  <div className="mb-4 aspect-4/3 overflow-hidden border border-hairline-ink">
                    <img className="size-full object-cover" src={item.icon} alt="" />
                  </div>
                ) : (
                  <span className="mb-4 block text-3xl leading-none">{item.icon}</span>
                )}
                <strong className="block font-display text-sm leading-[1.2] font-medium">{expertiseTitle(item, locale)}</strong>
              </article>
            ))}
          </section>
        )}

        <section className="mt-24 grid animate-reveal grid-cols-1 gap-x-[7vw] gap-y-10 border-t border-hairline-ink pt-12 md:mt-28 md:grid-cols-[minmax(280px,0.86fr)_minmax(0,1.14fr)]" aria-labelledby="about-offer-title">
          <div>
            <p className={eyebrowClass}>{offer.eyebrow}</p>
            <h2 id="about-offer-title" className="mt-4 max-w-[26ch] font-display text-[clamp(26px,2.8vw,38px)] leading-[1.2] font-medium">
              {offer.title}
            </h2>
            <p className="mt-5 text-[17px] leading-[1.6] text-on-ink-muted">{offer.lead}</p>
          </div>
          <div className="grid content-start gap-7">
            {offer.paragraphs.map((paragraph) => (
              <p className="text-[17px] leading-[1.6] text-on-ink-muted" key={paragraph}>
                {paragraph}
              </p>
            ))}
            <div className="border-y border-hairline-ink py-7">
              <h3 className="mb-5 font-display text-xl font-medium">{offer.listTitle}</h3>
              <ul className="m-0 grid list-none gap-3.5 p-0">
                {offer.items.map((item) => (
                  <li key={item} className="relative pl-6 text-[17px] leading-[1.5] text-on-ink-muted before:absolute before:top-[0.6em] before:left-0 before:size-1.5 before:bg-copper before:content-['']">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[17px] leading-[1.6] text-on-ink-muted">{offer.strength}</p>
            <p className="text-[17px] leading-[1.6] text-on-ink-muted">{offer.partners}</p>
            <a className={`${siteButtonVariants({ variant: 'light' })} mt-1 justify-self-start`} href={localPath(locale, '/kontakt')}>
              {offer.cta}
            </a>
          </div>
        </section>

        <section className="mt-24 animate-reveal border-t border-hairline-ink pt-12 md:mt-28" aria-labelledby="about-cv-title">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className={eyebrowClass}>{cv.eyebrow}</p>
              <h2 id="about-cv-title" className="mt-4 max-w-[30ch] font-display text-[clamp(30px,3.6vw,48px)] leading-[1.1] font-medium">
                {cv.title}
              </h2>
              <p className="mt-4 max-w-[60ch] text-lg leading-[1.55] text-on-ink-muted">{cv.lead}</p>
            </div>
            <a className={siteButtonVariants({ variant: 'outline-light' })} href="/cv-dmytro-fomin.pdf" download>
              {cv.download}
            </a>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)] md:gap-12">
            <aside className="self-start border border-hairline-ink bg-ink-2 p-7" aria-label={cv.contactTitle}>
              <h3 className="mb-4 font-display text-xl font-medium">{cv.contactTitle}</h3>
              <ul className="m-0 list-none p-0">
                {cv.contact.map((item) => (
                  <li key={item.label} className="grid gap-1.5 border-t border-hairline-ink py-4 first:border-t-0 first:pt-0">
                    <span className="text-[11px] font-bold tracking-[.06em] text-on-ink-muted uppercase">{item.label}</span>
                    {'href' in item ? (
                      <a className="text-lg font-bold underline decoration-1 underline-offset-4 [overflow-wrap:anywhere] hover:text-gold" href={item.href}>
                        {item.value}
                      </a>
                    ) : (
                      <strong className="text-lg font-bold [overflow-wrap:anywhere]">{item.value}</strong>
                    )}
                  </li>
                ))}
              </ul>
              <h3 className="mt-8 mb-4 font-display text-xl font-medium">{cv.skillsTitle}</h3>
              <div className="flex flex-wrap gap-2">
                {(expertise.length ? expertise.map((item) => expertiseTitle(item, locale)).filter(Boolean) : cv.skills).map((skill) => (
                  <span key={skill} className="border border-hairline-ink px-3 py-2.5 text-xs font-bold uppercase">
                    {skill}
                  </span>
                ))}
              </div>
            </aside>
            <div className="grid gap-7">
              {experience.length > 0 && (
                <section className="border-b border-hairline-ink pb-7 last:border-b-0 last:pb-0">
                  <h3 className="mb-4 font-display text-xl font-medium">
                    {locale === 'pl' ? 'Doświadczenie' : locale === 'en' ? 'Experience' : locale === 'uk' ? 'Досвід' : 'Опыт'}
                  </h3>
                  <ul className="m-0 list-none p-0">
                    {experience.map((item) => {
                      const years = [item.start_year, item.end_year || (locale === 'en' ? 'now' : locale === 'pl' ? 'teraz' : locale === 'uk' ? 'дотепер' : 'сейчас')].filter(Boolean).join(' - ');
                      const description = experienceDescription(item, locale);
                      return (
                        <li key={item.id} className="relative py-0 pb-[18px] pl-6 text-[17px] leading-[1.55] text-on-ink-muted last:pb-0 before:absolute before:top-[0.68em] before:left-0 before:size-1.5 before:bg-copper before:content-['']">
                          <strong className="font-bold text-on-ink">{item.restaurant}</strong>
                          {item.position ? `, ${item.position}` : ''}
                          {item.country ? ` · ${item.country}` : ''}
                          {years ? ` · ${years}` : ''}
                          {description ? <p className="mt-2 whitespace-pre-line">{description}</p> : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
              {(experience.length ? cv.sections.filter((section) => !/experience|doświadczenie|опыт|досвід/i.test(section.title)) : cv.sections).map((section) => (
                <section key={section.title} className="border-b border-hairline-ink pb-7 last:border-b-0 last:pb-0">
                  <h3 className="mb-4 font-display text-xl font-medium">{section.title}</h3>
                  <ul className="m-0 list-none p-0">
                    {section.items.map((item) => (
                      <li key={item} className="relative py-0 pb-[18px] pl-6 text-[17px] leading-[1.55] text-on-ink-muted last:pb-0 before:absolute before:top-[0.68em] before:left-0 before:size-1.5 before:bg-copper before:content-['']">
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </section>

        {gallery.length > 0 && (
          <section className="mt-24 animate-reveal border-t border-hairline-ink pt-12 md:mt-28">
            <p className={eyebrowClass}>{locale === 'pl' ? 'Wybrane realizacje' : locale === 'en' ? 'Selected work' : locale === 'uk' ? 'Обрані роботи' : 'Избранные работы'}</p>
            <h2 className="mt-4 mb-14 max-w-[22ch] font-display text-[clamp(30px,3.8vw,52px)] leading-[1.05] font-medium">
              {locale === 'pl' ? 'Moja praca' : locale === 'en' ? 'My work' : locale === 'uk' ? 'Моя робота' : 'Моя работа'}
            </h2>
            <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2">
              {gallery.map((item, index) => {
                const itemTitle = galleryTitle(item, locale);
                const description = galleryDescription(item, locale);
                return (
                  <article
                    className="group min-w-0 animate-reveal"
                    style={{ animationDelay: `${(index % 4) * 70}ms` }}
                    key={item.id}
                  >
                    <div className="mb-5 aspect-[4/3] overflow-hidden bg-ink-2">
                      <img
                        className="size-full object-cover transition-transform duration-reveal ease-premium group-hover:scale-[1.03]"
                        src={item.image_url}
                        alt={galleryAlt(item, locale)}
                      />
                    </div>
                    {(itemTitle || description) && (
                      <div>
                        {itemTitle && <h3 className="font-display text-2xl leading-[1.1] font-medium">{itemTitle}</h3>}
                        {description && <p className="mt-2 max-w-[60ch] whitespace-pre-line text-[15.5px] leading-[1.55] text-on-ink-muted">{description}</p>}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
