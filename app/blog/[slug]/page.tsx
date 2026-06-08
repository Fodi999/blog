import { notFound } from 'next/navigation';
import { ArticleBody } from '@/components/ArticleBody';
import { articleContent, articleTitle, getArticle } from '@/lib/cms';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  return article ? { title: articleTitle(article), description: article.seo_description } : {};
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <article className="article">
      <header className="article__heading">
        <p className="eyebrow">{article.category}</p>
        <h1>{articleTitle(article)}</h1>
        <p>{article.seo_description}</p>
      </header>
      {article.image_url && <img className="article__hero" src={article.image_url} alt={articleTitle(article)} />}
      <ArticleBody content={articleContent(article)} />
    </article>
  );
}
