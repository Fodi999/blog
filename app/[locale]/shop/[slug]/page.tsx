import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Check, PackageCheck } from 'lucide-react';
import { formatProductPrice, getShopProduct, localizeProduct } from '@/lib/shop';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getShopProduct(slug);
  if (!product) return { title: 'Product not found', robots: { index: false } };
  return {
    title: localizeProduct(product, 'seo_title', locale) || localizeProduct(product, 'name', locale),
    description: localizeProduct(product, 'seo_description', locale) || localizeProduct(product, 'short_description', locale),
    openGraph: { images: product.image_urls[0] ? [product.image_urls[0]] : [] },
  };
}

export default async function ShopProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const product = await getShopProduct(slug);
  if (!product) notFound();

  const name = localizeProduct(product, 'name', locale);
  const contactLabel = locale === 'pl' ? 'Zapytaj o produkt' : locale === 'ru' ? 'Уточнить заказ' : locale === 'uk' ? 'Уточнити замовлення' : 'Ask about product';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-16">
      <Link href="/shop" className="mb-9 inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Shop
      </Link>

      <div className="grid gap-12 lg:grid-cols-[1.1fr_.9fr]">
        <section>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] border border-border/50 bg-muted/20 shadow-2xl">
            {product.image_urls[0] ? <Image src={product.image_urls[0]} alt={name} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" /> : <PackageCheck className="absolute inset-0 m-auto h-20 w-20 text-muted-foreground/20" />}
          </div>
          {product.image_urls.length > 1 && (
            <div className="mt-5 grid grid-cols-3 gap-4">
              {product.image_urls.slice(1).map((url, index) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-2xl border border-border/50 bg-muted/20">
                  <Image src={url} alt={`${name} ${index + 2}`} fill className="object-cover" sizes="25vw" />
                </div>
              ))}
            </div>
          )}
        </section>

        <article className="lg:py-4">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-primary">{product.category}</div>
          <h1 className="mt-5 text-5xl font-black leading-[.95] tracking-tighter md:text-7xl">{name}</h1>
          <p className="mt-7 text-xl font-medium leading-relaxed text-muted-foreground">{localizeProduct(product, 'short_description', locale)}</p>
          <div className="mt-9 flex items-end justify-between gap-6 border-y border-border/60 py-7">
            <strong className="text-3xl text-primary">{formatProductPrice(product, locale)}</strong>
            {product.sku && <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SKU {product.sku}</span>}
          </div>
          {product.selling_points.length > 0 && (
            <ul className="mt-8 grid gap-3">
              {product.selling_points.map((point) => <li key={point} className="flex gap-3 font-semibold"><Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />{point}</li>)}
            </ul>
          )}
          <div className="mt-9 whitespace-pre-line text-lg leading-relaxed text-foreground/80">{localizeProduct(product, 'description', locale)}</div>
          <Link href={`/contact?product=${encodeURIComponent(product.slug)}` as never} className="mt-10 inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-8 text-sm font-black uppercase tracking-wider text-white shadow-xl shadow-primary/20 transition-transform hover:scale-[1.02]">
            {contactLabel}
          </Link>
        </article>
      </div>
    </div>
  );
}
