import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { articleDescription, articleTitle, getArticles } from '@/lib/cms';
import { categoryName, getCopy, isLocale, localPath } from '@/lib/i18n';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getCopy(locale);
  return {
    title: t.home.title,
    description: t.home.lead,
    alternates: { canonical: localPath(locale, '') },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);
  const articles = await getArticles();

  return (
    <>
      <section className="hero">
        <p className="eyebrow">{t.home.eyebrow}</p>
        <h1>{t.home.title}</h1>
        <p className="hero__lead">{t.home.lead}</p>
        <div className="hero__actions">
          <Link className="button button--dark" href={localPath(locale, '/blog')}>{t.home.readBlog}</Link>
          <Link className="button button--line" href={localPath(locale, '/kontakt')}>{t.nav.contact}</Link>
        </div>
      </section>

      <section className="section local-seo-section">
        <div className="section-heading">
          <p className="eyebrow">Trójmiasto</p>
          <h2>{t.home.localTitle}</h2>
          <p>{t.home.localLead}</p>
        </div>
        <div className="local-place-grid">
          {t.home.localPlaces.map((place) => (
            <article className="local-place-card" key={place.title}>
              <span>{place.title.slice(0, 2).toUpperCase()}</span>
              <h3>{place.title}</h3>
              <p>{place.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">{t.home.latest}</p>
          <h2>{t.home.stories}</h2>
          <Link href={localPath(locale, '/blog')}>{t.home.allArticles} →</Link>
        </div>
        <div className="editorial-grid">
          {articles.slice(0, 3).map((article) => (
            <Link className="editorial-card" href={localPath(locale, `/blog/${article.slug}`)} key={article.slug}>
              <div className="media">
                {article.image_url ? <img src={article.image_url} alt="" /> : <span>{categoryName(article.category, locale)}</span>}
              </div>
              <p className="meta">{categoryName(article.category, locale)}</p>
              <h3>{articleTitle(article, locale)}</h3>
              <p>{articleDescription(article, locale)}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
