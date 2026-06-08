import { notFound } from 'next/navigation';
import { aboutContent, aboutTitle, galleryAlt, galleryDescription, galleryTitle, getAboutPage, getGallery } from '@/lib/cms';
import { getCopy, isLocale } from '@/lib/i18n';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);
  const [about, gallery] = await Promise.all([getAboutPage(), getGallery()]);
  const title = about ? aboutTitle(about, locale) : t.about.title;
  const content = about ? aboutContent(about, locale) : `${t.about.p1}\n\n${t.about.p2}`;
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);

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
