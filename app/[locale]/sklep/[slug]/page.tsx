import { notFound } from 'next/navigation';
import { ViewItemTracker } from '@/components/AnalyticsEvents';
import { ProductPhotoGallery } from '@/components/ProductPhotoGallery';
import { getProduct, productCategory, productDescription, productName, productPrice, productSeoDescription, productSeoTitle, productShortDescription } from '@/lib/cms';
import { categoryName, getCopy, isLocale } from '@/lib/i18n';

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
  const t = getCopy(locale);
  const name = productName(product, locale);
  const category = productCategory(product);
  const categoryLabel = categoryName(category, locale);
  const description = productDescription(product, locale);
  const shortDescription = productShortDescription(product, locale);
  const price = productPrice(product, locale, t.shop.priceOnRequest);
  const isAvailable = product.stock_quantity > 0;
  const mailHref = `mailto:kontakt@dima-fomin.pl?subject=${encodeURIComponent(name)}`;
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
    <article className="product-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <ViewItemTracker item={{
        item_id: product.slug,
        item_name: name,
        item_category: categoryLabel,
        item_type: 'shop_product',
        currency: product.currency,
        value: product.price_cents ? product.price_cents / 100 : undefined
      }} />
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
    </article>
  );
}
