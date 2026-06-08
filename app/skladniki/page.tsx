import Link from 'next/link';
import { getIngredients, ingredientDescription, ingredientName } from '@/lib/cms';

export const revalidate = 300;
export const metadata = { title: 'Składniki', description: 'Katalog opublikowanych składników.' };

export default async function IngredientsPage() {
  const ingredients = await getIngredients();

  return (
    <section className="page">
      <header className="page-heading">
        <p className="eyebrow">Katalog wiedzy</p>
        <h1>Składniki</h1>
        <p>Produkty opisane przez wartości odżywcze, charakter i zastosowanie w kuchni.</p>
      </header>
      <div className="ingredient-grid">
        {ingredients.map((ingredient) => (
          <Link className="ingredient-card" href={`/skladniki/${ingredient.slug}`} key={ingredient.slug}>
            <div className="media">
              {ingredient.image_url ? <img src={ingredient.image_url} alt={ingredientName(ingredient)} /> : <span>{ingredient.category_name_pl || ingredient.category_name_en}</span>}
            </div>
            <p className="meta">{ingredient.category_name_pl || ingredient.category_name_en}</p>
            <h2>{ingredientName(ingredient)}</h2>
            <p>{ingredientDescription(ingredient)}</p>
            <div className="macro-line"><span>{ingredient.calories_per_100g ?? '—'} kcal</span><span>B {ingredient.protein_per_100g ?? '—'}</span><span>T {ingredient.fat_per_100g ?? '—'}</span><span>W {ingredient.carbs_per_100g ?? '—'}</span></div>
          </Link>
        ))}
        {ingredients.length === 0 && <p className="empty">Opublikowane składniki z panelu administracyjnego pojawią się tutaj.</p>}
      </div>
    </section>
  );
}
