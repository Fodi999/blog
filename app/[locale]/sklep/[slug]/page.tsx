import { notFound } from 'next/navigation';
import { getProduct, productDescription, productName, productPrice, productSeoDescription, productSeoTitle, productShortDescription } from '@/lib/cms';
import { getCopy, isLocale } from '@/lib/i18n';

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
      <div className="product-page__gallery">
        {product.image_urls.length ? product.image_urls.map((url) => <img src={url} alt={name} key={url} />) : <div className="media"><span>{product.category}</span></div>}
      </div>
      <div className="product-page__info">
        <p className="eyebrow">{product.category}</p>
        <h1>{name}</h1>
        <p className="product-page__lead">{productShortDescription(product, locale)}</p>
        <strong className="price">{productPrice(product, locale, t.shop.priceOnRequest)}</strong>
        <p>{productDescription(product, locale)}</p>
        <ul>{product.selling_points.map((point) => <li key={point}>{point}</li>)}</ul>
        <a className="button button--dark" href={`mailto:kontakt@dima-fomin.pl?subject=${encodeURIComponent(name)}`}>{t.shop.ask}</a>
      </div>
    </article>
  );
}
