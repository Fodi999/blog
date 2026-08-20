import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { IngredientCard } from '@/components/site/IngredientCard';
import { eyebrowClass } from '@/components/site/classes';
import { getIngredients, ingredientCategory, ingredientDescription, ingredientName } from '@/lib/cms';
import { getCopy, isLocale, localPath } from '@/lib/i18n';
import { languageAlternates, ogLocale, SITE_URL } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getCopy(locale);
  const path = '/skladniki';
  return {
    title: t.ingredients.title,
    description: t.ingredients.lead,
    alternates: {
      canonical: localPath(locale, path),
      languages: languageAlternates(path),
    },
    openGraph: {
      type: 'website',
      locale: ogLocale[locale],
      url: `${SITE_URL}/${locale}${path}`,
      title: t.ingredients.title,
      description: t.ingredients.lead,
    },
  };
}

export default async function IngredientsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getCopy(locale);
  const macroShort = {
    pl: ['B', 'T', 'W'],
    en: ['P', 'F', 'C'],
    ru: ['Б', 'Ж', 'У'],
    uk: ['Б', 'Ж', 'В'],
  }[locale];
  const ingredients = await getIngredients();

  return (
    <section className="bg-ink text-on-ink">
      <div className="content-frame py-24 md:py-32">
        <header className="mb-16 max-w-[64ch] md:mb-20">
          <p className={`${eyebrowClass} animate-reveal`}>{t.ingredients.eyebrow}</p>
          <h1 className="animate-reveal mt-5 font-display text-[clamp(38px,5.6vw,64px)] leading-[1.05] font-medium" style={{ animationDelay: '60ms' }}>
            {t.ingredients.title}
          </h1>
          <p className="animate-reveal mt-5 text-[16.5px] leading-[1.65] text-on-ink-muted" style={{ animationDelay: '120ms' }}>
            {t.ingredients.lead}
          </p>
        </header>
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {ingredients.map((ingredient, index) => {
            const name = ingredientName(ingredient, locale);
            const category = ingredientCategory(ingredient, locale);
            return (
              <IngredientCard
                key={ingredient.slug}
                href={localPath(locale, `/skladniki/${ingredient.slug}`)}
                image={ingredient.image_url}
                category={category}
                name={name}
                description={ingredientDescription(ingredient, locale)}
                delayMs={(index % 8) * 60}
                meta={
                  <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold tracking-[.04em] text-on-ink-muted uppercase">
                    <span>{ingredient.calories_per_100g ?? '—'} kcal</span>
                    <span>{macroShort[0]} {ingredient.protein_per_100g ?? '—'}</span>
                    <span>{macroShort[1]} {ingredient.fat_per_100g ?? '—'}</span>
                    <span>{macroShort[2]} {ingredient.carbs_per_100g ?? '—'}</span>
                  </div>
                }
              />
            );
          })}
        </div>
        {ingredients.length === 0 && <p className="py-16 text-lg text-on-ink-muted">{t.ingredients.empty}</p>}
      </div>
    </section>
  );
}
