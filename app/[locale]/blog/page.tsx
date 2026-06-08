import Link from 'next/link';
import { notFound } from 'next/navigation';
import { articleTitle, getArticles } from '@/lib/cms';
import { getCopy, isLocale, localPath } from '@/lib/i18n';

export const revalidate = 300;

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);
  const articles = await getArticles();

  return (
    <section className="page">
      <header className="page-heading">
        <p className="eyebrow">{t.blog.eyebrow}</p>
        <h1>{t.nav.blog}</h1>
        <p>{t.blog.lead}</p>
      </header>
      <div className="article-list">
        {articles.map((article, index) => (
          <Link href={localPath(locale, `/blog/${article.slug}`)} className="article-row" key={article.slug}>
            <span className="article-row__number">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <p className="meta">{article.category}</p>
              <h2>{articleTitle(article, locale)}</h2>
              <p>{article.seo_description}</p>
            </div>
            <span className="article-row__arrow">↗</span>
          </Link>
        ))}
        {articles.length === 0 && <p className="empty">{t.blog.empty}</p>}
      </div>
    </section>
  );
}
