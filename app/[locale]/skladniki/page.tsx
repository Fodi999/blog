import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getIngredients, ingredientCategory, ingredientDescription, ingredientName } from '@/lib/cms';
import { getCopy, isLocale, localPath } from '@/lib/i18n';

export const revalidate = 300;

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

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
    <section className="page">
      <header className="page-heading">
        <p className="eyebrow">{t.ingredients.eyebrow}</p>
        <h1>{t.ingredients.title}</h1>
        <p>{t.ingredients.lead}</p>
      </header>
      <div className="ingredient-grid">
        {ingredients.map((ingredient) => {
          const name = ingredientName(ingredient, locale);
          const category = ingredientCategory(ingredient, locale);
          return (
            <Link className="ingredient-card" href={localPath(locale, `/skladniki/${ingredient.slug}`)} key={ingredient.slug}>
              <div className="media">
                {ingredient.image_url ? <img src={ingredient.image_url} alt={name} /> : <span>{category}</span>}
              </div>
              <p className="meta">{category}</p>
              <h2>{name}</h2>
              <p>{ingredientDescription(ingredient, locale)}</p>
              <div className="macro-line"><span>{ingredient.calories_per_100g ?? '—'} kcal</span><span>{macroShort[0]} {ingredient.protein_per_100g ?? '—'}</span><span>{macroShort[1]} {ingredient.fat_per_100g ?? '—'}</span><span>{macroShort[2]} {ingredient.carbs_per_100g ?? '—'}</span></div>
            </Link>
          );
        })}
        {ingredients.length === 0 && <p className="empty">{t.ingredients.empty}</p>}
      </div>
    </section>
  );
}
