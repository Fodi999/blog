import Link from 'next/link';
import { notFound } from 'next/navigation';
import { articleDescription, articleTitle, getArticles, getProducts, productName, productPrice } from '@/lib/cms';
import { categoryName, getCopy, isLocale, localPath } from '@/lib/i18n';

export const revalidate = 300;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);
  const [articles, products] = await Promise.all([getArticles(), getProducts()]);

  return (
    <>
      <section className="hero">
        <p className="eyebrow">{t.home.eyebrow}</p>
        <h1>{t.home.title}</h1>
        <p className="hero__lead">{t.home.lead}</p>
        <div className="hero__actions">
          <Link className="button button--dark" href={localPath(locale, '/blog')}>{t.home.readBlog}</Link>
          <Link className="button button--line" href={localPath(locale, '/sklep')}>{t.home.seeShop}</Link>
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

      {products.length > 0 && (
        <section className="section section--dark">
          <div className="section-heading">
            <p className="eyebrow">{t.home.shop}</p>
            <h2>{t.home.products}</h2>
            <Link href={localPath(locale, '/sklep')}>{t.home.allShop} →</Link>
          </div>
          <div className="product-strip">
            {products.slice(0, 3).map((product) => (
              <Link href={localPath(locale, `/sklep/${product.slug}`)} key={product.id}>
                <strong>{productName(product, locale)}</strong>
                <span>{productPrice(product, locale, t.shop.priceOnRequest)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
