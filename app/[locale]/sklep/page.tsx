import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProducts, productName, productPrice, productShortDescription } from '@/lib/cms';
import { categoryName, getCopy, isLocale, localPath } from '@/lib/i18n';

export const revalidate = 300;

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);
  const products = await getProducts();

  return (
    <section className="page">
      <header className="page-heading">
        <p className="eyebrow">{t.shop.eyebrow}</p>
        <h1>{t.shop.title}</h1>
        <p>{t.shop.lead}</p>
      </header>
      <div className="shop-grid">
        {products.map((product) => {
          const name = productName(product, locale);
          return (
            <Link href={localPath(locale, `/sklep/${product.slug}`)} className="shop-card" key={product.id}>
              <div className="media media--product">
                {product.image_urls[0] ? <img src={product.image_urls[0]} alt={name} /> : <span>{categoryName(product.category, locale)}</span>}
              </div>
              <div className="shop-card__top"><span>{categoryName(product.category, locale)}</span><strong>{productPrice(product, locale, t.shop.priceOnRequest)}</strong></div>
              <h2>{name}</h2>
              <p>{productShortDescription(product, locale)}</p>
            </Link>
          );
        })}
        {products.length === 0 && <p className="empty">{t.shop.empty}</p>}
      </div>
    </section>
  );
}
