import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/site/ArticleCard';
import { eyebrowClass } from '@/components/site/classes';
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
    <section className="bg-ink text-on-ink">
      <div className="content-frame py-24 md:py-32">
        <header className="mb-16 max-w-[64ch] md:mb-20">
          <p className={`${eyebrowClass} animate-reveal`}>{t.blog.eyebrow}</p>
          <h1 className="animate-reveal mt-5 font-display text-[clamp(38px,5.6vw,64px)] leading-[1.05] font-medium" style={{ animationDelay: '60ms' }}>
            {t.nav.blog}
          </h1>
          <p className="animate-reveal mt-5 text-[16.5px] leading-[1.65] text-on-ink-muted" style={{ animationDelay: '120ms' }}>
            {t.blog.lead}
          </p>
        </header>
        <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <ArticleCard
              key={article.slug}
              href={localPath(locale, `/blog/${article.slug}`)}
              image={article.image_url}
              category={categoryName(article.category, locale)}
              title={articleTitle(article, locale)}
              description={articleDescription(article, locale)}
              delayMs={(index % 6) * 70}
            />
          ))}
        </div>
        {articles.length === 0 && <p className="py-16 text-lg text-on-ink-muted">{t.blog.empty}</p>}
      </div>
    </section>
  );
}
