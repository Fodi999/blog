import Link from 'next/link';
import { getProducts, productName, productPrice, productShortDescription } from '@/lib/cms';

export const revalidate = 300;
export const metadata = { title: 'Sklep', description: 'Produkty wybrane przez szefa.' };

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <section className="page">
      <header className="page-heading">
        <p className="eyebrow">Wybrane przez szefa</p>
        <h1>Sklep</h1>
        <p>Przedmioty i produkty, które mają swoje konkretne miejsce w dobrej kuchni.</p>
      </header>
      <div className="shop-grid">
        {products.map((product) => (
          <Link href={`/sklep/${product.slug}`} className="shop-card" key={product.id}>
            <div className="media media--product">
              {product.image_urls[0] ? <img src={product.image_urls[0]} alt={productName(product)} /> : <span>{product.category}</span>}
            </div>
            <div className="shop-card__top"><span>{product.category}</span><strong>{productPrice(product)}</strong></div>
            <h2>{productName(product)}</h2>
            <p>{productShortDescription(product)}</p>
          </Link>
        ))}
        {products.length === 0 && <p className="empty">Sklep jest przygotowywany. Aktywne produkty z panelu administracyjnego pojawią się tutaj automatycznie.</p>}
      </div>
    </section>
  );
}
