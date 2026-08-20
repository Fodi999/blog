import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleBody } from '@/components/ArticleBody';
import { ArticleCard } from '@/components/site/ArticleCard';
import { siteButtonVariants } from '@/components/site/Button';
import { eyebrowClass, sectionClass } from '@/components/site/classes';
import { IngredientCard } from '@/components/site/IngredientCard';
import { ProductCard } from '@/components/site/ProductCard';
import { SectionHeading } from '@/components/site/SectionHeading';
import {
  aboutContent,
  aboutTitle,
  articleContent,
  articleDescription,
  articleTitle,
  getAboutPage,
  getBlogArticles,
  getIngredients,
  getProducts,
  getSiteArticle,
  ingredientCategory,
  ingredientDescription,
  ingredientName,
  productCategory,
  productName,
  productPrice,
  productShortDescription,
} from '@/lib/cms';
import { categoryName, getCopy, isLocale, localPath } from '@/lib/i18n';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getCopy(locale);
  const page = await getSiteArticle('home');
  return {
    title: page ? articleTitle(page, locale) : t.home.title,
    description: page ? articleDescription(page, locale) : t.home.lead,
    alternates: { canonical: localPath(locale, '') },
  };
}

const chefStoryCopy = {
  pl: { eyebrow: 'Kim jestem', cta: 'Poznaj moją historię' },
  en: { eyebrow: 'Who I am', cta: 'Read my story' },
  ru: { eyebrow: 'Кто я', cta: 'Моя история' },
  uk: { eyebrow: 'Хто я', cta: 'Моя історія' },
} as const;

const ingredientsCopy = {
  pl: { cta: 'Cały katalog' },
  en: { cta: 'Full catalog' },
  ru: { cta: 'Весь каталог' },
  uk: { cta: 'Весь каталог' },
} as const;

const cateringCopy = {
  pl: { eyebrow: 'Catering w Trójmieście', line: 'Menu skrojone pod wydarzenie — od kolacji firmowej po prywatne przyjęcie.', cta: 'Zapytaj o catering' },
  en: { eyebrow: 'Catering in Tricity', line: 'A menu built around your event — from a company dinner to a private celebration.', cta: 'Ask about catering' },
  ru: { eyebrow: 'Кейтеринг в Труймясте', line: 'Меню под конкретное событие — от корпоративного ужина до частного праздника.', cta: 'Узнать про кейтеринг' },
  uk: { eyebrow: 'Кейтеринг у Труймісті', line: 'Меню під конкретну подію — від корпоративної вечері до приватного свята.', cta: 'Дізнатися про кейтеринг' },
} as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);
  const [page, articles, products, ingredients, about] = await Promise.all([
    getSiteArticle('home'),
    getBlogArticles(),
    getProducts(),
    getIngredients(),
    getAboutPage(),
  ]);
  const heroTitle = page ? articleTitle(page, locale) : t.home.title;
  const heroLead = page ? articleDescription(page, locale) : t.home.lead;
  const heroImage = page?.image_url || about?.image_url;
  const managedContent = page ? articleContent(page, locale) : '';
  const chefStory = chefStoryCopy[locale];
  const ingredientsUi = ingredientsCopy[locale];
  const catering = cateringCopy[locale];
  const aboutLead = about ? aboutContent(about, locale).split(/\n{2,}/)[0] : `${t.about.p1}`;

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden bg-ink text-on-ink">
        <div className="content-frame grid min-h-[calc(100dvh-80px)] grid-cols-1 items-center gap-12 py-20 md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:py-28">
          <div className="order-2 md:order-1">
            <p className={`${eyebrowClass} animate-reveal`}>{t.home.eyebrow}</p>
            <h1 className="animate-reveal mt-6 max-w-[16ch] text-balance font-display text-[clamp(40px,6.4vw,84px)] leading-[1.03] font-medium tracking-[-0.01em]">
              {heroTitle}
            </h1>
            <p className="animate-reveal mt-7 max-w-[46ch] text-[clamp(16px,1.3vw,19px)] leading-[1.65] text-on-ink-muted" style={{ animationDelay: '80ms' }}>
              {heroLead}
            </p>
            <div className="animate-reveal mt-10 flex flex-wrap gap-3" style={{ animationDelay: '140ms' }}>
              <Link className={siteButtonVariants({ variant: 'light' })} href={localPath(locale, '/catering-trojmiasto')}>
                {t.nav.catering}
              </Link>
              <Link className={siteButtonVariants({ variant: 'outline-light' })} href={localPath(locale, '/blog')}>
                {t.home.readBlog}
              </Link>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="relative aspect-[4/5] overflow-hidden bg-ink-2 md:aspect-[3/4]">
              {heroImage ? (
                <img src={heroImage} alt={heroTitle} className="size-full object-cover" />
              ) : (
                <div
                  aria-hidden
                  className="size-full [background:radial-gradient(circle_at_30%_25%,rgba(214,179,106,.28),transparent_45%),radial-gradient(circle_at_75%_70%,rgba(168,101,63,.22),transparent_50%),linear-gradient(160deg,#201a13,#0c0a08_72%)]"
                />
              )}
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-hairline-ink" />
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- Managed CMS intro */}
      {managedContent ? (
        <section className="bg-bone">
          <div className="content-frame-reading py-20 md:py-28">
            <ArticleBody content={managedContent} />
          </div>
        </section>
      ) : null}

      {/* -------------------------------------------------------- Chef / story */}
      <section className="border-t border-hairline-ink bg-ink text-on-ink">
        <div className={`${sectionClass} grid grid-cols-1 items-center gap-10 md:grid-cols-[0.62fr_1fr] md:gap-16`}>
          <div className="animate-reveal aspect-square overflow-hidden bg-ink-2 md:aspect-[4/5]">
            {about?.image_url ? (
              <img src={about.image_url} alt={aboutTitle(about, locale)} className="size-full object-cover" />
            ) : null}
          </div>
          <div className="animate-reveal" style={{ animationDelay: '80ms' }}>
            <p className={eyebrowClass}>{chefStory.eyebrow}</p>
            <h2 className="mt-4 max-w-[18ch] font-display text-[clamp(26px,3.2vw,42px)] leading-[1.1] font-medium">
              {about ? aboutTitle(about, locale) : t.about.title}
            </h2>
            <p className="mt-5 max-w-[54ch] text-[15.5px] leading-[1.7] text-on-ink-muted">{aboutLead}</p>
            <Link className={`${siteButtonVariants({ variant: 'quiet-light' })} mt-6`} href={localPath(locale, '/o-mnie')}>
              {chefStory.cta} →
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- Featured products */}
      {products.length > 0 ? (
        <section className="bg-ink text-on-ink">
          <div className={sectionClass}>
            <SectionHeading
              eyebrow={t.home.shop}
              title={t.home.products}
              cta={
                <Link className={siteButtonVariants({ variant: 'outline-light' })} href={localPath(locale, '/sklep')}>
                  {t.home.allShop}
                </Link>
              }
            />
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 3).map((product, index) => (
                <ProductCard
                  key={product.id}
                  href={localPath(locale, `/sklep/${product.slug}`)}
                  image={product.image_urls[0]}
                  category={categoryName(productCategory(product), locale)}
                  name={productName(product, locale)}
                  description={productShortDescription(product, locale)}
                  price={productPrice(product, locale, t.shop.priceOnRequest)}
                  delayMs={index * 90}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* -------------------------------------------------------- Ingredients */}
      {ingredients.length > 0 ? (
        <section className="border-t border-hairline-ink bg-ink text-on-ink">
          <div className={sectionClass}>
            <SectionHeading
              eyebrow={t.ingredients.eyebrow}
              title={t.ingredients.title}
              lead={t.ingredients.lead}
              cta={
                <Link className={siteButtonVariants({ variant: 'outline-light' })} href={localPath(locale, '/skladniki')}>
                  {ingredientsUi.cta}
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {ingredients.slice(0, 4).map((ingredient, index) => (
                <IngredientCard
                  key={ingredient.slug}
                  href={localPath(locale, `/skladniki/${ingredient.slug}`)}
                  image={ingredient.image_url}
                  category={ingredientCategory(ingredient, locale)}
                  name={ingredientName(ingredient, locale)}
                  description={ingredientDescription(ingredient, locale)}
                  delayMs={index * 80}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------------ Catering */}
      <section className="relative overflow-hidden bg-ink-2 text-on-ink">
        <div className="content-frame flex animate-reveal flex-col items-start gap-8 py-20 md:py-28">
          <p className={eyebrowClass}>{catering.eyebrow}</p>
          <h2 className="max-w-[20ch] font-display text-[clamp(28px,4vw,52px)] leading-[1.08] font-medium">{catering.line}</h2>
          <Link className={siteButtonVariants({ variant: 'light' })} href={localPath(locale, '/catering-trojmiasto')}>
            {catering.cta}
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------------- Trójmiasto */}
      <section className="bg-ink text-on-ink">
        <div className={sectionClass}>
          <div className="mb-12 max-w-[64ch] animate-reveal md:mb-16">
            <p className={eyebrowClass}>Trójmiasto</p>
            <h2 className="mt-3 font-display text-[clamp(28px,3.6vw,48px)] leading-[1.05] font-medium">{t.home.localTitle}</h2>
            <p className="mt-4 text-[15.5px] leading-[1.65] text-on-ink-muted">{t.home.localLead}</p>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden bg-hairline-ink sm:grid-cols-3">
            {t.home.localPlaces.map((place, index) => (
              <article
                key={place.title}
                className="animate-reveal bg-ink p-8"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <span className="font-display text-sm italic text-gold">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-4 font-display text-2xl leading-[1.1] font-medium">{place.title}</h3>
                <p className="mt-3 text-sm leading-[1.6] text-on-ink-muted">{place.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- Blog */}
      {articles.length > 0 ? (
        <section className="border-t border-hairline-ink bg-ink text-on-ink">
          <div className={sectionClass}>
            <SectionHeading
              eyebrow={t.home.latest}
              title={t.home.stories}
              cta={
                <Link className={siteButtonVariants({ variant: 'outline-light' })} href={localPath(locale, '/blog')}>
                  {t.home.allArticles}
                </Link>
              }
            />
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {articles.slice(0, 3).map((article, index) => (
                <ArticleCard
                  key={article.slug}
                  href={localPath(locale, `/blog/${article.slug}`)}
                  image={article.image_url}
                  category={categoryName(article.category, locale)}
                  title={articleTitle(article, locale)}
                  description={articleDescription(article, locale)}
                  delayMs={index * 90}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
