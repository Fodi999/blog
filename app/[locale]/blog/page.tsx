import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { articleDescription, articleTitle, getBlogArticles } from '@/lib/cms';
import { categoryName, getCopy, isLocale, localPath } from '@/lib/i18n';
import { languageAlternates, ogLocale, SITE_URL } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getCopy(locale);
  const path = '/blog';
  const title = locale === 'pl' ? 'Blog Trójmiasto: Gdańsk, Sopot, Gdynia' : t.nav.blog;
  return {
    title,
    description: t.blog.lead,
    alternates: {
      canonical: localPath(locale, path),
      languages: languageAlternates(path),
    },
    openGraph: {
      type: 'website',
      locale: ogLocale[locale],
      url: `${SITE_URL}/${locale}${path}`,
      title,
      description: t.blog.lead,
    },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);
  const articles = await getBlogArticles();

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
              <p className="meta">{categoryName(article.category, locale)}</p>
              <h2>{articleTitle(article, locale)}</h2>
              <p>{articleDescription(article, locale)}</p>
            </div>
            <span className="article-row__arrow">↗</span>
          </Link>
        ))}
        {articles.length === 0 && <p className="empty">{t.blog.empty}</p>}
      </div>
    </section>
  );
}
