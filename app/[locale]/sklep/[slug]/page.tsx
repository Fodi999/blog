import { notFound } from 'next/navigation';
import { ViewItemTracker } from '@/components/AnalyticsEvents';
import { getProduct, productDescription, productName, productPrice, productSeoDescription, productSeoTitle, productShortDescription } from '@/lib/cms';
import { categoryName, getCopy, isLocale } from '@/lib/i18n';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = await getProduct(slug);
  return product ? { title: productSeoTitle(product, locale) || productName(product, locale), description: productSeoDescription(product, locale) } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const product = await getProduct(slug);
  if (!product) notFound();
  const t = getCopy(locale);
  const name = productName(product, locale);

  return (
    <article className="product-page">
      <ViewItemTracker item={{
        item_id: product.slug,
        item_name: name,
        item_category: categoryName(product.category, locale),
        item_type: 'shop_product',
        currency: product.currency,
        value: product.price_cents ? product.price_cents / 100 : undefined
      }} />
      <div className="product-page__gallery">
        {product.image_urls.length ? product.image_urls.map((url) => <img src={url} alt={name} key={url} />) : <div className="media"><span>{categoryName(product.category, locale)}</span></div>}
      </div>
      <div className="product-page__info">
        <p className="eyebrow">{categoryName(product.category, locale)}</p>
        <h1>{name}</h1>
        <p className="product-page__lead">{productShortDescription(product, locale)}</p>
        <strong className="price">{productPrice(product, locale, t.shop.priceOnRequest)}</strong>
        <p>{productDescription(product, locale)}</p>
        {locale === 'en' && <ul>{product.selling_points.map((point) => <li key={point}>{point}</li>)}</ul>}
        <a className="button button--dark" href={`mailto:kontakt@dima-fomin.pl?subject=${encodeURIComponent(name)}`} data-ga-event="lead_form_submit" data-ga-label="shop_product_email" data-ga-item-id={product.slug} data-ga-item-name={name} data-ga-item-category={categoryName(product.category, locale)} data-ga-currency={product.currency} data-ga-value={product.price_cents ? product.price_cents / 100 : undefined}>{t.shop.ask}</a>
      </div>
    </article>
  );
}
