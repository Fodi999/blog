import { notFound } from 'next/navigation';
import { ArticleBody } from '@/components/ArticleBody';
import { articleContent, articleDescription, articleTitle, getArticle } from '@/lib/cms';
import { categoryName, isLocale } from '@/lib/i18n';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const article = await getArticle(slug);
  return article ? { title: articleTitle(article, locale), description: articleDescription(article, locale) } : {};
}

export default async function ArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const article = await getArticle(slug);
  if (!article) notFound();
  const title = articleTitle(article, locale);

  return (
    <article className="article">
      <header className="article__heading">
        <p className="eyebrow">{categoryName(article.category, locale)}</p>
        <h1>{title}</h1>
        <p>{articleDescription(article, locale)}</p>
      </header>
      {article.image_url && <img className="article__hero" src={article.image_url} alt={title} />}
      <ArticleBody content={articleContent(article, locale)} />
    </article>
  );
}
