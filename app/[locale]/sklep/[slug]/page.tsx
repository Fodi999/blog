import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ViewItemTracker } from '@/components/AnalyticsEvents';
import { ProductPhotoGallery } from '@/components/ProductPhotoGallery';
import { ProductCard } from '@/components/site/ProductCard';
import { siteButtonVariants } from '@/components/site/Button';
import { eyebrowClass } from '@/components/site/classes';
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
    <article className="bg-bone">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <ViewItemTracker item={{
        item_id: product.slug,
        item_name: name,
        item_category: categoryLabel,
        item_type: 'shop_product',
        currency: product.currency,
        value: product.price_cents ? product.price_cents / 100 : undefined
      }} />
      <nav className="content-frame flex flex-wrap items-center gap-x-3.5 gap-y-2.5 pt-10 text-[11px] font-bold tracking-[.06em] uppercase" aria-label="Product navigation">
        <Link className="text-on-bone-muted transition-colors duration-hover ease-premium hover:text-on-bone after:ml-3.5 after:text-on-bone-muted/40 after:content-['/']" href={localPath(locale, '/sklep')}>{t.shop.title}</Link>
        <Link className="text-on-bone-muted transition-colors duration-hover ease-premium hover:text-on-bone after:ml-3.5 after:text-on-bone-muted/40 after:content-['/']" href={localPath(locale, `/sklep#${category}`)}>{categoryLabel}</Link>
        <span className="max-w-[58ch] overflow-hidden text-ellipsis whitespace-nowrap text-on-bone">{name}</span>
      </nav>
      <div className="content-frame grid grid-cols-1 gap-12 py-16 md:grid-cols-[1.1fr_0.9fr] md:gap-[7vw] md:py-24">
        <ProductPhotoGallery images={product.image_urls} name={name} fallbackLabel={categoryName(category, locale)} />
        <div className="md:sticky md:top-[110px] md:self-start">
          <div className="mb-6 inline-grid gap-1.5 border-b-2 border-on-bone pb-4">
            <span className="text-[11px] font-bold tracking-[.06em] text-on-bone-muted uppercase">{t.shop.brand}</span>
            <strong className="font-display text-[clamp(24px,2.6vw,34px)] font-medium">FOMIN CHEF</strong>
          </div>
          <p className={eyebrowClass}>{categoryLabel}</p>
          <h1 className="mt-4 font-display text-[clamp(34px,4.6vw,56px)] leading-[1.05] font-medium">{name}</h1>
          <p className="mt-4 text-lg leading-[1.6] text-on-bone-muted">{shortDescription}</p>

          <div className="my-8 grid grid-cols-3 gap-px border border-hairline-bone bg-hairline-bone max-[900px]:grid-cols-1">
            <span className="grid min-w-0 gap-2.5 bg-white p-[18px]">
              <small className="text-[11px] font-bold tracking-[.06em] text-on-bone-muted uppercase">{t.shop.availability}</small>
              <strong className="min-w-0 font-display text-lg font-medium [overflow-wrap:anywhere]">{isAvailable ? t.shop.inStock : t.shop.outOfStock}</strong>
            </span>
            <span className="grid min-w-0 gap-2.5 bg-white p-[18px]">
              <small className="text-[11px] font-bold tracking-[.06em] text-on-bone-muted uppercase">{t.shop.categoryLabel}</small>
              <strong className="min-w-0 font-display text-lg font-medium [overflow-wrap:anywhere]">{categoryLabel}</strong>
            </span>
            <span className="grid min-w-0 gap-2.5 bg-white p-[18px]">
              <small className="text-[11px] font-bold tracking-[.06em] text-on-bone-muted uppercase">{t.shop.sku}</small>
              <strong className="min-w-0 font-display text-lg font-medium [overflow-wrap:anywhere]">{product.sku || product.slug}</strong>
            </span>
          </div>

          <div className="mb-10 grid gap-5 border-t-2 border-on-bone border-b border-hairline-bone bg-white p-6">
            <div>
              <small className="text-[11px] font-bold tracking-[.06em] text-on-bone-muted uppercase">{t.shop.directContact}</small>
              <strong className="mt-2 block font-display text-3xl font-medium italic">{price}</strong>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <a
                className={`${siteButtonVariants({ variant: 'dark' })} max-[580px]:w-full`}
                href={mailHref}
                data-ga-event="lead_form_submit"
                data-ga-label="shop_product_email"
                data-ga-item-id={product.slug}
                data-ga-item-name={name}
                data-ga-item-category={categoryLabel}
                data-ga-currency={product.currency}
                data-ga-value={product.price_cents ? product.price_cents / 100 : undefined}
              >
                {t.shop.buy}
              </a>
              <a className={`${siteButtonVariants({ variant: 'outline-dark' })} max-[580px]:w-full`} href={mailHref}>
                {t.shop.ask}
              </a>
              <Link className={`${siteButtonVariants({ variant: 'outline-dark' })} max-[580px]:w-full`} href={localPath(locale, `/sklep#${category}`)}>
                {t.shop.backToCategory}
              </Link>
            </div>
            <p className="text-sm leading-[1.55] text-on-bone-muted">{t.shop.deliveryNote}</p>
          </div>

          <section className="mt-10 border-t border-hairline-bone pt-7">
            <span className={eyebrowClass}>{t.shop.storyTitle}</span>
            <p className="mt-3 leading-[1.8]">{description}</p>
          </section>

          {product.selling_points.length ? (
            <section className="mt-10 border-t border-hairline-bone pt-7">
              <span className={eyebrowClass}>{t.shop.why}</span>
              <ul className="mt-3 grid gap-3.5 p-0">
                {product.selling_points.map((point) => (
                  <li key={point} className="grid grid-cols-[auto_1fr] gap-3 leading-[1.55] before:mt-[0.58em] before:size-1.5 before:bg-gold before:content-['']">
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-10 grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-1" aria-label={t.shop.trustTitle}>
            <div className="grid min-w-0 gap-3.5 border-t-2 border-on-bone pt-[18px]">
              <small className="text-[11px] font-bold tracking-[.06em] text-on-bone-muted uppercase">01</small>
              <strong className="font-display text-xl font-medium">{t.shop.chefRecipe}</strong>
              <span className="text-sm leading-[1.55] text-on-bone-muted">{t.shop.chefRecipeText}</span>
            </div>
            <div className="grid min-w-0 gap-3.5 border-t-2 border-on-bone pt-[18px]">
              <small className="text-[11px] font-bold tracking-[.06em] text-on-bone-muted uppercase">02</small>
              <strong className="font-display text-xl font-medium">{t.shop.smallBatch}</strong>
              <span className="text-sm leading-[1.55] text-on-bone-muted">{t.shop.smallBatchText}</span>
            </div>
            <div className="grid min-w-0 gap-3.5 border-t-2 border-on-bone pt-[18px]">
              <small className="text-[11px] font-bold tracking-[.06em] text-on-bone-muted uppercase">03</small>
              <strong className="font-display text-xl font-medium">{t.shop.brandReady}</strong>
              <span className="text-sm leading-[1.55] text-on-bone-muted">{t.shop.brandReadyText}</span>
            </div>
          </section>
        </div>
      </div>

      {fallbackRelatedProducts.length ? (
        <section className="border-t border-hairline-bone bg-ink text-on-ink">
          <div className="content-frame py-20 md:py-24">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className={eyebrowClass}>{t.shop.sameCategory}</p>
                <h2 className="mt-3 font-display text-[clamp(28px,3.6vw,44px)] leading-[1.05] font-medium">{relatedHeading}</h2>
              </div>
              <Link className={siteButtonVariants({ variant: 'outline-light' })} href={localPath(locale, '/sklep')}>
                {t.shop.backToShop}
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {fallbackRelatedProducts.map((item, index) => (
                <ProductCard
                  key={item.id}
                  href={localPath(locale, `/sklep/${item.slug}`)}
                  image={item.image_urls[0]}
                  category={categoryName(productCategory(item), locale)}
                  name={productName(item, locale)}
                  description={productShortDescription(item, locale)}
                  price={productPrice(item, locale, t.shop.priceOnRequest)}
                  delayMs={index * 80}
                  gaItemId={item.slug}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
