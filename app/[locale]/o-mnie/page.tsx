import { notFound } from 'next/navigation';
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
    <section className="statement-page">
      <p className="eyebrow">Dima Fomin</p>
      <h1>{title}</h1>
      <div className="about-public-grid">
        {about?.image_url && <img className="about-public-photo" src={about.image_url} alt="Dima Fomin" />}
        <div className="statement-page__copy">
          {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </div>
      {expertise.length > 0 && (
        <section className="about-expertise-section" aria-label="Expertise">
          {expertise.map((item) => (
            <article key={item.id}>
              <span>{item.icon}</span>
              <strong>{expertiseTitle(item, locale)}</strong>
            </article>
          ))}
        </section>
      )}
      <section className="about-offer-section" aria-labelledby="about-offer-title">
        <div className="about-offer-intro">
          <p className="eyebrow">{offer.eyebrow}</p>
          <h2 id="about-offer-title">{offer.title}</h2>
          <p>{offer.lead}</p>
        </div>
        <div className="about-offer-copy">
          {offer.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <div className="about-offer-list">
            <h3>{offer.listTitle}</h3>
            <ul>
              {offer.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <p>{offer.strength}</p>
          <p>{offer.partners}</p>
          <a className="button button--dark" href={localPath(locale, '/kontakt')}>
            {offer.cta}
          </a>
        </div>
      </section>
      <section className="about-cv-section" aria-labelledby="about-cv-title">
        <div className="about-cv-heading">
          <div>
            <p className="eyebrow">{cv.eyebrow}</p>
            <h2 id="about-cv-title">{cv.title}</h2>
            <p>{cv.lead}</p>
          </div>
          <a className="button button--dark" href="/cv-dmytro-fomin.pdf" download>
            {cv.download}
          </a>
        </div>
        <div className="about-cv-grid">
          <aside className="about-cv-contact" aria-label={cv.contactTitle}>
            <h3>{cv.contactTitle}</h3>
            <ul>
              {cv.contact.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  {'href' in item ? <a href={item.href}>{item.value}</a> : <strong>{item.value}</strong>}
                </li>
              ))}
            </ul>
            <h3>{cv.skillsTitle}</h3>
            <div className="about-cv-skills">
              {(expertise.length ? expertise.map((item) => expertiseTitle(item, locale)).filter(Boolean) : cv.skills).map((skill) => <span key={skill}>{skill}</span>)}
            </div>
          </aside>
          <div className="about-cv-timeline">
            {experience.length > 0 && (
              <section>
                <h3>{locale === 'pl' ? 'Doświadczenie' : locale === 'en' ? 'Experience' : locale === 'uk' ? 'Досвід' : 'Опыт'}</h3>
                <ul>
                  {experience.map((item) => {
                    const years = [item.start_year, item.end_year || (locale === 'en' ? 'now' : locale === 'pl' ? 'teraz' : locale === 'uk' ? 'дотепер' : 'сейчас')].filter(Boolean).join(' - ');
                    const description = experienceDescription(item, locale);
                    return (
                      <li key={item.id}>
                        <strong>{item.restaurant}</strong>{item.position ? `, ${item.position}` : ''}{item.country ? ` · ${item.country}` : ''}{years ? ` · ${years}` : ''}
                        {description ? <p>{description}</p> : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
            {(experience.length ? cv.sections.filter((section) => !/experience|doświadczenie|опыт|досвід/i.test(section.title)) : cv.sections).map((section) => (
              <section key={section.title}>
                <h3>{section.title}</h3>
                <ul>
                  {section.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>
      {gallery.length > 0 && (
        <section className="about-work-section">
          <p className="eyebrow">{locale === 'pl' ? 'Wybrane realizacje' : locale === 'en' ? 'Selected work' : locale === 'uk' ? 'Обрані роботи' : 'Избранные работы'}</p>
          <h2>{locale === 'pl' ? 'Moja praca' : locale === 'en' ? 'My work' : locale === 'uk' ? 'Моя робота' : 'Моя работа'}</h2>
          <div className="about-work-grid">
            {gallery.map((item) => {
              const itemTitle = galleryTitle(item, locale);
              const description = galleryDescription(item, locale);
              return (
                <article className="about-work-card" key={item.id}>
                  <div className="about-work-media">
                    <img src={item.image_url} alt={galleryAlt(item, locale)} />
                  </div>
                  {(itemTitle || description) && (
                    <div className="about-work-copy">
                      {itemTitle && <h3>{itemTitle}</h3>}
                      {description && <p>{description}</p>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
