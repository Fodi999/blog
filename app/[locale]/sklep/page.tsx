import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/site/ProductCard';
import { eyebrowClass } from '@/components/site/classes';
import { getProducts, productCategory, productName, productPrice, productShortDescription } from '@/lib/cms';
import { categoryName, getCopy, isLocale, localPath } from '@/lib/i18n';
import { languageAlternates, ogLocale, SITE_URL } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getCopy(locale);
  const path = '/sklep';
  return {
    title: t.shop.title,
    description: t.shop.lead,
    alternates: {
      canonical: localPath(locale, path),
      languages: languageAlternates(path),
    },
    openGraph: {
      type: 'website',
      locale: ogLocale[locale],
      url: `${SITE_URL}/${locale}${path}`,
      title: t.shop.title,
      description: t.shop.lead,
    },
  };
}

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);
  const products = await getProducts();
  const categories = Array.from(new Set(products.map((product) => productCategory(product)).filter(Boolean)));
  const featured = products[0];
  const firstProductByCategory = new Set<string>();

  return (
    <section className="bg-ink text-on-ink">
      <div className="content-frame py-24 md:py-32">
        <header className="mb-14 flex animate-reveal flex-wrap items-end justify-between gap-8 md:mb-16">
          <div className="max-w-[64ch]">
            <p className={eyebrowClass}>{t.shop.eyebrow}</p>
            <h1 className="mt-5 font-display text-[clamp(38px,5.6vw,64px)] leading-[1.05] font-medium">{t.shop.title}</h1>
            <p className="mt-5 text-[16.5px] leading-[1.65] text-on-ink-muted">{t.shop.lead}</p>
          </div>
          {products.length > 0 ? (
            <div className="border border-hairline-ink p-5">
              <strong className="block font-display text-5xl leading-none font-medium">{products.length}</strong>
              <span className="mt-2 block text-xs font-bold text-on-ink-muted uppercase">{categories.length || 1} {t.shop.categories}</span>
            </div>
          ) : null}
        </header>

        {categories.length > 0 ? (
          <nav className="mb-14 flex animate-reveal flex-wrap gap-2 md:mb-16" aria-label="Shop categories" style={{ animationDelay: '80ms' }}>
            <a
              className="border border-hairline-ink px-3.5 py-3 text-xs font-bold tracking-[.04em] text-on-ink-muted uppercase transition-colors duration-hover ease-premium hover:border-gold hover:text-gold"
              href="#all"
            >
              {locale === 'pl' ? 'Wszystko' : locale === 'en' ? 'All' : locale === 'uk' ? 'Усе' : 'Все'}
            </a>
            {categories.map((category) => (
              <a
                key={category}
                className="border border-hairline-ink px-3.5 py-3 text-xs font-bold tracking-[.04em] text-on-ink-muted uppercase transition-colors duration-hover ease-premium hover:border-gold hover:text-gold"
                href={`#${category}`}
              >
                {categoryName(category, locale)}
              </a>
            ))}
          </nav>
        ) : null}

        {featured ? (
          <Link
            id="all"
            href={localPath(locale, `/sklep/${featured.slug}`)}
            className="group mb-16 grid animate-reveal grid-cols-1 items-center gap-10 border-y border-hairline-ink py-10 md:mb-20 md:grid-cols-[0.9fr_1fr] md:gap-16"
            data-ga-event="select_item"
            data-ga-item-id={featured.slug}
            data-ga-item-name={productName(featured, locale)}
            data-ga-item-category={categoryName(productCategory(featured), locale)}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-ink-2">
              {featured.image_urls[0] ? (
                <img
                  src={featured.image_urls[0]}
                  alt={productName(featured, locale)}
                  className="size-full object-cover transition-transform duration-reveal ease-premium group-hover:scale-[1.03]"
                />
              ) : (
                <div className="grid size-full place-items-center text-xs font-bold tracking-[.14em] text-on-ink-muted uppercase">
                  {categoryName(productCategory(featured), locale)}
                </div>
              )}
            </div>
            <div>
              <span className={eyebrowClass}>{categoryName(productCategory(featured), locale)}</span>
              <h2 className="mt-4 font-display text-[clamp(30px,3.6vw,48px)] leading-[1.05] font-medium">{productName(featured, locale)}</h2>
              <p className="mt-4 max-w-[54ch] text-[16.5px] leading-[1.55] text-on-ink-muted">{productShortDescription(featured, locale)}</p>
              <strong className="mt-6 inline-block border border-hairline-ink px-4 py-3 font-display text-lg font-medium italic">
                {productPrice(featured, locale, t.shop.priceOnRequest)}
              </strong>
            </div>
          </Link>
        ) : null}

        <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => {
            const name = productName(product, locale);
            const category = productCategory(product);
            const shouldAnchorCategory = category && !firstProductByCategory.has(category);
            if (category) firstProductByCategory.add(category);
            return (
              <ProductCard
                key={product.id}
                id={shouldAnchorCategory ? category : undefined}
                href={localPath(locale, `/sklep/${product.slug}`)}
                image={product.image_urls[0]}
                category={categoryName(category, locale)}
                name={name}
                description={productShortDescription(product, locale)}
                price={productPrice(product, locale, t.shop.priceOnRequest)}
                stock={product.stock_quantity > 0 ? t.shop.inStock : undefined}
                delayMs={(index % 6) * 70}
                gaItemId={product.slug}
              />
            );
          })}
        </div>
        {products.length === 0 && <p className="py-16 text-lg text-on-ink-muted">{t.shop.empty}</p>}
      </div>
    </section>
  );
}
