import Link from 'next/link';
import { articleTitle, getArticles } from '@/lib/cms';

export const revalidate = 300;
export const metadata = { title: 'Blog', description: 'Artykuły o kuchni, produktach i technice.' };

export default async function BlogPage() {
  const articles = await getArticles();

  return (
    <section className="page">
      <header className="page-heading">
        <p className="eyebrow">Wiedza z kuchni</p>
        <h1>Blog</h1>
        <p>Technika, produkt i proces. Bez dekoracji, tylko rzeczy, które działają.</p>
      </header>
      <div className="article-list">
        {articles.map((article, index) => (
          <Link href={`/blog/${article.slug}`} className="article-row" key={article.slug}>
            <span className="article-row__number">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <p className="meta">{article.category}</p>
              <h2>{articleTitle(article)}</h2>
              <p>{article.seo_description}</p>
            </div>
            <span className="article-row__arrow">↗</span>
          </Link>
        ))}
        {articles.length === 0 && <p className="empty">Pierwsze artykuły pojawią się tutaj po publikacji w panelu administracyjnym.</p>}
      </div>
    </section>
  );
}
