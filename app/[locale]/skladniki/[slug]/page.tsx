import { notFound } from 'next/navigation';
import { getRichIngredient, ingredientDescription, ingredientName, localizedName, localizedText } from '@/lib/cms';
import { getCopy, isLocale } from '@/lib/i18n';

export const revalidate = 300;

const nutrientLabels: Record<string, string> = {
  vitamin_a: 'A', vitamin_c: 'C', vitamin_d: 'D', vitamin_e: 'E', vitamin_k: 'K',
  vitamin_b1: 'B1', vitamin_b2: 'B2', vitamin_b3: 'B3', vitamin_b5: 'B5',
  vitamin_b6: 'B6', vitamin_b7: 'B7', vitamin_b9: 'B9', vitamin_b12: 'B12',
  calcium: 'Calcium', iron: 'Iron', magnesium: 'Magnesium', phosphorus: 'Phosphorus',
  potassium: 'Potassium', sodium: 'Sodium', zinc: 'Zinc', copper: 'Copper',
  manganese: 'Manganese', selenium: 'Selenium',
};

function dataEntries(data?: Record<string, number | string | boolean | null> | null) {
  return Object.entries(data ?? {}).filter(([, value]) => value !== null && value !== false && value !== '');
}

function prettyKey(value: string) {
  return nutrientLabels[value] || value.replaceAll('_', ' ');
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const ingredient = await getRichIngredient(slug, locale);
  if (!ingredient) return {};
  return {
    title: ingredient.reference.seo_title || ingredientName(ingredient.reference, locale),
    description: ingredient.reference.seo_description || ingredientDescription(ingredient.reference, locale),
    robots: { index: false, follow: true },
  };
}

export default async function IngredientPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const ingredient = await getRichIngredient(slug, locale);
  if (!ingredient) notFound();

  const t = getCopy(locale);
  const { reference, catalog, states } = ingredient;
  const name = ingredientName(reference, locale);
  const description = reference.description || ingredientDescription(reference, locale);
  const macros = catalog?.macros;
  const facts = [
    [t.ingredients.calories, macros?.calories_kcal ?? reference.nutrition?.calories_per_100g, 'kcal'],
    [t.ingredients.protein, macros?.protein_g ?? reference.nutrition?.protein_per_100g, 'g'],
    [t.ingredients.fat, macros?.fat_g ?? reference.nutrition?.fat_per_100g, 'g'],
    [t.ingredients.carbs, macros?.carbs_g ?? reference.nutrition?.carbs_per_100g, 'g'],
    [t.ingredients.fiber, macros?.fiber_g, 'g'],
    [t.ingredients.sugar, macros?.sugar_g, 'g'],
    [t.ingredients.density, reference.density_g_per_ml, 'g/ml'],
    [t.ingredients.portion, catalog?.typical_portion_g, 'g'],
    [t.ingredients.shelfLife, catalog?.shelf_life_days, t.ingredients.days],
  ].filter(([, value]) => value !== null && value !== undefined);

  return (
    <article className="ingredient-page">
      <header>
        <p className="eyebrow">{catalog?.product_type || t.ingredients.eyebrow}</p>
        <h1>{locale === 'en' && reference.seo_h1 ? reference.seo_h1 : name}</h1>
        <p>{description}</p>
      </header>

      {reference.image_url && <img className="ingredient-page__image" src={reference.image_url} alt={name} />}

      <section className="ingredient-facts">
        {facts.map(([label, value, unit]) => <div key={String(label)}><span>{label}</span><strong>{String(value)}</strong><small>{unit}</small></div>)}
      </section>

      {dataEntries(catalog?.vitamins).length > 0 && <DataSection title={t.ingredients.vitamins} data={catalog?.vitamins} unit="mg" />}
      {dataEntries(catalog?.minerals).length > 0 && <DataSection title={t.ingredients.minerals} data={catalog?.minerals} unit="mg" />}
      {dataEntries(catalog?.culinary).length > 0 && <DataSection title={t.ingredients.culinary} data={catalog?.culinary} />}
      {dataEntries(catalog?.food_properties).length > 0 && <DataSection title={t.ingredients.properties} data={catalog?.food_properties} />}

      {dataEntries(catalog?.diet_flags).length > 0 && (
        <section className="ingredient-section">
          <p className="eyebrow">{t.ingredients.diets}</p>
          <div className="ingredient-tags">
            {dataEntries(catalog?.diet_flags).map(([key]) => <span key={key}>✓ {prettyKey(key)}</span>)}
          </div>
        </section>
      )}

      {states.length > 0 && (
        <section className="ingredient-section">
          <p className="eyebrow">{t.ingredients.states}</p>
          <div className="state-grid">
            {states.map((state) => (
              <div className="state-card" key={state.state}>
                {state.image_url && (
                  <img
                    className="state-card__image"
                    src={state.image_url}
                    alt={localizedName({
                      name_en: state.name_suffix_en,
                      name_pl: state.name_suffix_pl,
                      name_ru: state.name_suffix_ru,
                      name_uk: state.name_suffix_uk,
                    }, locale) || state.state}
                  />
                )}
                <h3>{localizedName({
                  name_en: state.name_suffix_en,
                  name_pl: state.name_suffix_pl,
                  name_ru: state.name_suffix_ru,
                  name_uk: state.name_suffix_uk,
                }, locale) || state.state}</h3>
                <p>{localizedText(state, locale)}</p>
                <div><span>{state.calories_per_100g ?? '—'} kcal</span><span>{state.storage_temp_c ?? '—'}°C</span><span>{state.shelf_life_hours ?? '—'} {t.ingredients.hours}</span></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(catalog?.pairings?.length ?? 0) > 0 && (
        <section className="ingredient-section">
          <p className="eyebrow">{t.ingredients.pairings}</p>
          <div className="pairing-grid">
            {catalog?.pairings?.map((pairing) => (
              <div className="pairing-card" key={pairing.slug}>
                {pairing.image_url && <img src={pairing.image_url} alt="" />}
                <strong>{localizedName(pairing, locale)}</strong>
                <span>{pairing.pair_score?.toFixed(1) ?? '—'} / 10</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function DataSection({ title, data, unit }: { title: string; data?: Record<string, number | string | boolean | null> | null; unit?: string }) {
  return (
    <section className="ingredient-section">
      <p className="eyebrow">{title}</p>
      <div className="data-grid">
        {dataEntries(data).map(([key, value]) => <div key={key}><span>{prettyKey(key)}</span><strong>{String(value)}</strong><small>{typeof value === 'number' ? unit : ''}</small></div>)}
      </div>
    </section>
  );
}
