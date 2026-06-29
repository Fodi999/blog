import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ViewItemTracker } from '@/components/AnalyticsEvents';
import { ProductPhotoGallery } from '@/components/ProductPhotoGallery';
import { getProduct, getProducts, productCategory, productDescription, productName, productPrice, productSeoDescription, productSeoTitle, productShortDescription } from '@/lib/cms';
import { categoryName, getCopy, isLocale, localPath } from '@/lib/i18n';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = await getProduct(slug);
  if (!product) return {};
  const title = productSeoTitle(product, locale) || productName(product, locale);
  const description = productSeoDescription(product, locale);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.image_urls?.[0] ? [{ url: product.image_urls[0] }] : undefined,
      type: 'website'
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const product = await getProduct(slug);
  if (!product) notFound();
  const products = await getProducts();
  const t = getCopy(locale);
  const name = productName(product, locale);
  const category = productCategory(product);
  const categoryLabel = categoryName(category, locale);
  const description = productDescription(product, locale);
  const shortDescription = productShortDescription(product, locale);
  const price = productPrice(product, locale, t.shop.priceOnRequest);
  const isAvailable = product.stock_quantity > 0;
  const mailHref = `mailto:kontakt@dima-fomin.pl?subject=${encodeURIComponent(name)}`;
  const relatedProducts = products
    .filter((item) => item.slug !== product.slug && productCategory(item) === category)
    .slice(0, 3);
  const fallbackRelatedProducts = relatedProducts.length ? relatedProducts : products
    .filter((item) => item.slug !== product.slug)
    .slice(0, 3);
  const relatedHeading = relatedProducts.length ? categoryLabel : t.shop.title;
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: productSeoDescription(product, locale) || shortDescription || description,
    image: product.image_urls,
    sku: product.sku || product.slug,
    category: categoryLabel,
    brand: { '@type': 'Brand', name: 'FOMIN CHEF' },
    offers: product.price_cents == null ? undefined : {
      '@type': 'Offer',
      price: (product.price_cents / 100).toFixed(2),
      priceCurrency: product.currency || 'PLN',
      availability: isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://dima-fomin.pl/${locale}/sklep/${product.slug}`
    }
  };

  return (
    <article className="product-page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <ViewItemTracker item={{
        item_id: product.slug,
        item_name: name,
        item_category: categoryLabel,
        item_type: 'shop_product',
        currency: product.currency,
        value: product.price_cents ? product.price_cents / 100 : undefined
      }} />
      <nav className="product-breadcrumb" aria-label="Product navigation">
        <Link href={localPath(locale, '/sklep')}>{t.shop.title}</Link>
        <Link href={localPath(locale, `/sklep#${category}`)}>{categoryLabel}</Link>
        <span>{name}</span>
      </nav>
      <div className="product-page">
        <ProductPhotoGallery images={product.image_urls} name={name} fallbackLabel={categoryName(category, locale)} />
        <div className="product-page__info">
          <div className="product-brand-lockup">
            <span>{t.shop.brand}</span>
            <strong>FOMIN CHEF</strong>
          </div>
          <p className="eyebrow">{categoryLabel}</p>
          <h1>{name}</h1>
          <p className="product-page__lead">{shortDescription}</p>
          <div className="product-spec-strip">
            <span><small>{t.shop.availability}</small><strong>{isAvailable ? t.shop.inStock : t.shop.outOfStock}</strong></span>
            <span><small>{t.shop.categoryLabel}</small><strong>{categoryLabel}</strong></span>
            <span><small>{t.shop.sku}</small><strong>{product.sku || product.slug}</strong></span>
          </div>
          <div className="product-buy-panel">
            <div>
              <small>{t.shop.directContact}</small>
              <strong className="price">{price}</strong>
            </div>
            <div className="product-buy-panel__actions">
              <a className="button button--dark" href={mailHref} data-ga-event="lead_form_submit" data-ga-label="shop_product_email" data-ga-item-id={product.slug} data-ga-item-name={name} data-ga-item-category={categoryLabel} data-ga-currency={product.currency} data-ga-value={product.price_cents ? product.price_cents / 100 : undefined}>{t.shop.buy}</a>
              <a className="button button--ghost" href={mailHref}>{t.shop.ask}</a>
              <Link className="button button--ghost" href={localPath(locale, `/sklep#${category}`)}>{t.shop.backToCategory}</Link>
            </div>
            <p>{t.shop.deliveryNote}</p>
          </div>
          <section className="product-copy-block">
            <span className="eyebrow">{t.shop.storyTitle}</span>
            <p>{description}</p>
          </section>
          {product.selling_points.length ? (
            <section className="product-copy-block">
              <span className="eyebrow">{t.shop.why}</span>
              <ul className="product-selling-points">{product.selling_points.map((point) => <li key={point}>{point}</li>)}</ul>
            </section>
          ) : null}
          <section className="product-trust-grid" aria-label={t.shop.trustTitle}>
            <div><small>01</small><strong>{t.shop.chefRecipe}</strong><span>{t.shop.chefRecipeText}</span></div>
            <div><small>02</small><strong>{t.shop.smallBatch}</strong><span>{t.shop.smallBatchText}</span></div>
            <div><small>03</small><strong>{t.shop.brandReady}</strong><span>{t.shop.brandReadyText}</span></div>
          </section>
        </div>
      </div>
      {fallbackRelatedProducts.length ? (
        <section className="product-related">
          <div className="section-heading">
            <p className="eyebrow">{t.shop.sameCategory}</p>
            <h2>{relatedHeading}</h2>
          </div>
          <div className="shop-grid shop-grid--storefront">
            {fallbackRelatedProducts.map((item) => {
              const itemName = productName(item, locale);
              const itemCategory = productCategory(item);
              return (
                <Link href={localPath(locale, `/sklep/${item.slug}`)} className="shop-card" key={item.id} data-ga-event="select_item" data-ga-item-id={item.slug} data-ga-item-name={itemName} data-ga-item-category={categoryName(itemCategory, locale)}>
                  <div className="media media--product">
                    {item.image_urls[0] ? <img src={item.image_urls[0]} alt={itemName} /> : <span>{categoryName(itemCategory, locale)}</span>}
                  </div>
                  <div className="shop-card__top"><span>{categoryName(itemCategory, locale)}</span><strong>{productPrice(item, locale, t.shop.priceOnRequest)}</strong></div>
                  <h2>{itemName}</h2>
                  <p>{productShortDescription(item, locale)}</p>
                </Link>
              );
            })}
          </div>
          <Link className="button button--ghost product-related__back" href={localPath(locale, '/sklep')}>{t.shop.backToShop}</Link>
        </section>
      ) : null}
    </article>
  );
}
