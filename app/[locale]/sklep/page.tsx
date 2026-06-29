import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProducts, productCategory, productName, productPrice, productShortDescription } from '@/lib/cms';
import { categoryName, getCopy, isLocale, localPath } from '@/lib/i18n';

export const revalidate = 300;

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);
  const products = await getProducts();
  const categories = Array.from(new Set(products.map((product) => productCategory(product)).filter(Boolean)));
  const featured = products[0];
  const firstProductByCategory = new Set<string>();

  return (
    <section className="page">
      <header className="page-heading shop-heading">
        <div>
          <p className="eyebrow">{t.shop.eyebrow}</p>
          <h1>{t.shop.title}</h1>
          <p>{t.shop.lead}</p>
        </div>
        {products.length > 0 ? (
          <div className="shop-heading__meta">
            <strong>{products.length}</strong>
            <span>{categories.length || 1} {t.shop.categories}</span>
          </div>
        ) : null}
      </header>

      {categories.length > 0 ? (
        <nav className="shop-category-nav" aria-label="Shop categories">
          <a href="#all">{locale === 'pl' ? 'Wszystko' : locale === 'en' ? 'All' : locale === 'uk' ? 'Усе' : 'Все'}</a>
          {categories.map((category) => (
            <a href={`#${category}`} key={category}>{categoryName(category, locale)}</a>
          ))}
        </nav>
      ) : null}

      {featured ? (
        <Link id="all" href={localPath(locale, `/sklep/${featured.slug}`)} className="shop-featured" data-ga-event="select_item" data-ga-item-id={featured.slug} data-ga-item-name={productName(featured, locale)} data-ga-item-category={categoryName(productCategory(featured), locale)}>
          <div className="media media--product">
            {featured.image_urls[0] ? <img src={featured.image_urls[0]} alt={productName(featured, locale)} /> : <span>{categoryName(productCategory(featured), locale)}</span>}
          </div>
          <div>
            <span className="eyebrow">{categoryName(productCategory(featured), locale)}</span>
            <h2>{productName(featured, locale)}</h2>
            <p>{productShortDescription(featured, locale)}</p>
            <strong>{productPrice(featured, locale, t.shop.priceOnRequest)}</strong>
          </div>
        </Link>
      ) : null}

      <div className="shop-grid shop-grid--storefront">
        {products.map((product) => {
          const name = productName(product, locale);
          const category = productCategory(product);
          const shouldAnchorCategory = category && !firstProductByCategory.has(category);
          if (category) firstProductByCategory.add(category);
          return (
            <Link id={shouldAnchorCategory ? category : undefined} href={localPath(locale, `/sklep/${product.slug}`)} className="shop-card" key={product.id} data-ga-event="select_item" data-ga-item-id={product.slug} data-ga-item-name={name} data-ga-item-category={categoryName(category, locale)}>
              <div className="media media--product">
                {product.image_urls[0] ? <img src={product.image_urls[0]} alt={name} /> : <span>{categoryName(category, locale)}</span>}
              </div>
              <div className="shop-card__top"><span>{categoryName(category, locale)}</span><strong>{productPrice(product, locale, t.shop.priceOnRequest)}</strong></div>
              <h2>{name}</h2>
              <p>{productShortDescription(product, locale)}</p>
              {product.stock_quantity > 0 ? <small className="shop-card__stock">{t.shop.inStock}</small> : null}
            </Link>
          );
        })}
        {products.length === 0 && <p className="empty">{t.shop.empty}</p>}
      </div>
    </section>
  );
}
