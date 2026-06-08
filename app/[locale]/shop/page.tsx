import Image from 'next/image';
import type { Metadata } from 'next';
import { Link } from '@/i18n/routing';
import { ArrowUpRight, PackageOpen, ShoppingBag } from 'lucide-react';
import { formatProductPrice, getShopProducts, localizeProduct } from '@/lib/shop';

export const revalidate = 300;

const copy = {
  en: { badge: 'Chef Store', title: 'Shop', subtitle: 'Products selected and described with professional kitchen experience.', empty: 'Products are being prepared. Come back soon.', stock: 'in stock' },
  pl: { badge: 'Sklep szefa', title: 'Sklep', subtitle: 'Produkty wybrane i opisane z doświadczeniem profesjonalnej kuchni.', empty: 'Produkty są w przygotowaniu. Wróć wkrótce.', stock: 'w magazynie' },
  ru: { badge: 'Магазин шефа', title: 'Магазин', subtitle: 'Товары, выбранные и описанные с опытом профессиональной кухни.', empty: 'Товары готовятся к публикации. Загляните позже.', stock: 'в наличии' },
  uk: { badge: 'Магазин шефа', title: 'Магазин', subtitle: 'Товари, вибрані й описані з досвідом професійної кухні.', empty: 'Товари готуються до публікації. Завітайте пізніше.', stock: 'в наявності' },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const text = copy[locale as keyof typeof copy] || copy.en;
  return { title: `${text.title} | Dima Fomin`, description: text.subtitle };
}

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const text = copy[locale as keyof typeof copy] || copy.en;
  const products = await getShopProducts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
      <header className="mb-14 max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
          <ShoppingBag className="h-4 w-4" />
          {text.badge}
        </div>
        <h1 className="text-6xl font-black uppercase italic leading-none tracking-tighter md:text-8xl">
          {text.title}<span className="text-primary">.</span>
        </h1>
        <p className="mt-7 text-xl font-medium leading-relaxed text-muted-foreground md:text-2xl">{text.subtitle}</p>
      </header>

      {products.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-border bg-muted/20 text-center">
          <PackageOpen className="mb-5 h-12 w-12 text-primary/60" />
          <p className="max-w-md text-lg font-bold text-muted-foreground">{text.empty}</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/shop/${product.slug}` as never} className="group">
              <article className="h-full overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
                  {product.image_urls[0] ? (
                    <Image src={product.image_urls[0]} alt={localizeProduct(product, 'name', locale)} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                  ) : <PackageOpen className="absolute inset-0 m-auto h-12 w-12 text-muted-foreground/30" />}
                </div>
                <div className="p-7">
                  <div className="mb-4 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                    <span>{product.category}</span>
                    <span>{product.stock_quantity} {text.stock}</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">{localizeProduct(product, 'name', locale)}</h2>
                  <p className="mt-3 line-clamp-3 text-sm font-medium leading-relaxed text-muted-foreground">{localizeProduct(product, 'short_description', locale)}</p>
                  <div className="mt-7 flex items-center justify-between border-t border-border/50 pt-5">
                    <strong className="text-xl text-primary">{formatProductPrice(product, locale)}</strong>
                    <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
