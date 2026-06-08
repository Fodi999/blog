import { notFound } from 'next/navigation';
import { getIngredient, ingredientCategory, ingredientDescription, ingredientName } from '@/lib/cms';
import { getCopy, isLocale, seasonName } from '@/lib/i18n';

export const revalidate = 300;

export default async function IngredientPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const ingredient = await getIngredient(slug);
  if (!ingredient) notFound();
  const t = getCopy(locale);
  const name = ingredientName(ingredient, locale);
  const macros = [
    [t.ingredients.calories, ingredient.calories_per_100g, 'kcal'],
    [t.ingredients.protein, ingredient.protein_per_100g, 'g'],
    [t.ingredients.fat, ingredient.fat_per_100g, 'g'],
    [t.ingredients.carbs, ingredient.carbs_per_100g, 'g'],
  ];

  return (
    <article className="ingredient-page">
      <header>
        <p className="eyebrow">{ingredientCategory(ingredient, locale)}</p>
        <h1>{name}</h1>
        <p>{ingredientDescription(ingredient, locale)}</p>
      </header>
      {ingredient.image_url && <img className="ingredient-page__image" src={ingredient.image_url} alt={name} />}
      <section className="nutrition-grid">
        {macros.map(([label, value, unit]) => <div key={String(label)}><span>{label}</span><strong>{value ?? '—'}</strong><small>{unit} / 100 g</small></div>)}
      </section>
      {ingredient.seasons.length > 0 && <section className="ingredient-note"><p className="eyebrow">{t.ingredients.season}</p><h2>{ingredient.seasons.map((season) => seasonName(season, locale)).join(' · ')}</h2></section>}
    </article>
  );
}
