import { notFound } from 'next/navigation';
import { getProduct, productDescription, productName, productPrice, productShortDescription } from '@/lib/cms';

export const revalidate = 300;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <article className="product-page">
      <div className="product-page__gallery">
        {product.image_urls.length ? product.image_urls.map((url) => <img src={url} alt={productName(product)} key={url} />) : <div className="media"><span>{product.category}</span></div>}
      </div>
      <div className="product-page__info">
        <p className="eyebrow">{product.category}</p>
        <h1>{productName(product)}</h1>
        <p className="product-page__lead">{productShortDescription(product)}</p>
        <strong className="price">{productPrice(product)}</strong>
        <p>{productDescription(product)}</p>
        <ul>{product.selling_points.map((point) => <li key={point}>{point}</li>)}</ul>
        <a className="button button--dark" href={`mailto:kontakt@dima-fomin.pl?subject=${encodeURIComponent(productName(product))}`}>Zapytaj o produkt</a>
      </div>
    </article>
  );
}
