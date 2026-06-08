import { notFound } from 'next/navigation';
import { getIngredient, ingredientDescription, ingredientName } from '@/lib/cms';

export const revalidate = 300;

export default async function IngredientPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ingredient = await getIngredient(slug);
  if (!ingredient) notFound();

  const macros = [
    ['Kalorie', ingredient.calories_per_100g, 'kcal'],
    ['Białko', ingredient.protein_per_100g, 'g'],
    ['Tłuszcz', ingredient.fat_per_100g, 'g'],
    ['Węglowodany', ingredient.carbs_per_100g, 'g'],
  ];

  return (
    <article className="ingredient-page">
      <header>
        <p className="eyebrow">{ingredient.category_name_pl || ingredient.category_name_en}</p>
        <h1>{ingredientName(ingredient)}</h1>
        <p>{ingredientDescription(ingredient)}</p>
      </header>
      {ingredient.image_url && <img className="ingredient-page__image" src={ingredient.image_url} alt={ingredientName(ingredient)} />}
      <section className="nutrition-grid">
        {macros.map(([label, value, unit]) => <div key={String(label)}><span>{label}</span><strong>{value ?? '—'}</strong><small>{unit} / 100 g</small></div>)}
      </section>
      {ingredient.seasons.length > 0 && <section className="ingredient-note"><p className="eyebrow">Sezon</p><h2>{ingredient.seasons.join(' · ')}</h2></section>}
    </article>
  );
}
