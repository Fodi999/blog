import Link from 'next/link';
import { articleTitle, getArticles, getProducts, productName, productPrice } from '@/lib/cms';

export const revalidate = 300;

export default async function HomePage() {
  const [articles, products] = await Promise.all([getArticles(), getProducts()]);

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Chef · Technolog · Autor</p>
        <h1>Kuchnia bez zbędnych słów.</h1>
        <p className="hero__lead">Profesjonalna wiedza, konkretne produkty i doświadczenie zbudowane przy stole oraz na zapleczu kuchni.</p>
        <div className="hero__actions">
          <Link className="button button--dark" href="/blog">Czytaj blog</Link>
          <Link className="button button--line" href="/sklep">Zobacz sklep</Link>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Najnowsze</p>
          <h2>Historie i techniki</h2>
          <Link href="/blog">Wszystkie artykuły →</Link>
        </div>
        <div className="editorial-grid">
          {articles.slice(0, 3).map((article) => (
            <Link className="editorial-card" href={`/blog/${article.slug}`} key={article.slug}>
              <div className="media">
                {article.image_url ? <img src={article.image_url} alt="" /> : <span>{article.category}</span>}
              </div>
              <p className="meta">{article.category}</p>
              <h3>{articleTitle(article)}</h3>
              <p>{article.seo_description}</p>
            </Link>
          ))}
        </div>
      </section>

      {products.length > 0 && (
        <section className="section section--dark">
          <div className="section-heading">
            <p className="eyebrow">Sklep</p>
            <h2>Wybrane produkty</h2>
            <Link href="/sklep">Cały sklep →</Link>
          </div>
          <div className="product-strip">
            {products.slice(0, 3).map((product) => (
              <Link href={`/sklep/${product.slug}`} key={product.id}>
                <strong>{productName(product)}</strong>
                <span>{productPrice(product)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
