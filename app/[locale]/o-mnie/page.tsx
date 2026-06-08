import { notFound } from 'next/navigation';
import { aboutContent, aboutTitle, getAboutPage } from '@/lib/cms';
import { getCopy, isLocale } from '@/lib/i18n';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);
  const about = await getAboutPage();
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
    </section>
  );
}
