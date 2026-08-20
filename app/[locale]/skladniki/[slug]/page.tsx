import { notFound } from 'next/navigation';
import { eyebrowClass } from '@/components/site/classes';
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
    <article className="bg-bone">
      <div className="content-frame py-20 md:py-28">
        <header className="animate-reveal max-w-[70ch]">
          <p className={eyebrowClass}>{catalog?.product_type || t.ingredients.eyebrow}</p>
          <h1 className="mt-5 font-display text-[clamp(36px,5.4vw,60px)] leading-[1.05] font-medium">
            {locale === 'en' && reference.seo_h1 ? reference.seo_h1 : name}
          </h1>
          <p className="mt-5 text-lg leading-[1.6] text-on-bone-muted">{description}</p>
        </header>

        {reference.image_url && (
          <div className="my-14 aspect-[16/7] overflow-hidden bg-white md:my-20">
            <img className="size-full object-contain" src={reference.image_url} alt={name} />
          </div>
        )}

        <section className={factGridClass}>
          {facts.map(([label, value, unit]) => (
            <div className={factCellClass} key={String(label)}>
              <span className="text-[11px] font-bold tracking-[.04em] text-on-bone-muted uppercase">{label}</span>
              <strong className="font-display text-[38px] font-medium">{String(value)}</strong>
              <small className="text-[11px] font-bold text-on-bone-muted uppercase">{unit}</small>
            </div>
          ))}
        </section>

        {dataEntries(catalog?.vitamins).length > 0 && <DataSection title={t.ingredients.vitamins} data={catalog?.vitamins} unit="mg" />}
        {dataEntries(catalog?.minerals).length > 0 && <DataSection title={t.ingredients.minerals} data={catalog?.minerals} unit="mg" />}
        {dataEntries(catalog?.culinary).length > 0 && <DataSection title={t.ingredients.culinary} data={catalog?.culinary} />}
        {dataEntries(catalog?.food_properties).length > 0 && <DataSection title={t.ingredients.properties} data={catalog?.food_properties} />}

        {dataEntries(catalog?.diet_flags).length > 0 && (
          <section className="mt-16">
            <p className={`${eyebrowClass} mb-5`}>{t.ingredients.diets}</p>
            <div className="flex flex-wrap gap-2">
              {dataEntries(catalog?.diet_flags).map(([key]) => (
                <span key={key} className="border border-hairline-bone px-3.5 py-2.5 text-xs font-bold text-on-bone-muted uppercase">
                  <span className="text-gold">✓</span> {prettyKey(key)}
                </span>
              ))}
            </div>
          </section>
        )}

        {states.length > 0 && (
          <section className="mt-16">
            <p className={`${eyebrowClass} mb-5`}>{t.ingredients.states}</p>
            <div className="grid grid-cols-3 gap-5 max-[900px]:grid-cols-2 max-[580px]:grid-cols-1">
              {states.map((state) => (
                <div
                  className="group overflow-hidden border border-hairline-bone bg-white transition-transform duration-ui ease-premium hover:-translate-y-1.5"
                  key={state.state}
                >
                  {state.image_url && (
                    <div className="aspect-[16/10] overflow-hidden bg-bone-2">
                      <img
                        className="size-full object-cover transition-transform duration-reveal ease-premium group-hover:scale-[1.03]"
                        src={state.image_url}
                        alt={localizedName({
                          name_en: state.name_suffix_en,
                          name_pl: state.name_suffix_pl,
                          name_ru: state.name_suffix_ru,
                          name_uk: state.name_suffix_uk,
                        }, locale) || state.state}
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-display text-xl font-medium">
                      {localizedName({
                        name_en: state.name_suffix_en,
                        name_pl: state.name_suffix_pl,
                        name_ru: state.name_suffix_ru,
                        name_uk: state.name_suffix_uk,
                      }, locale) || state.state}
                    </h3>
                    <p className="mt-2.5 min-h-[66px] text-sm leading-[1.55] text-on-bone-muted">{localizedText(state, locale)}</p>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold tracking-[.04em] text-on-bone-muted uppercase">
                      <span>{state.calories_per_100g ?? '—'} kcal</span>
                      <span>{state.storage_temp_c ?? '—'}°C</span>
                      <span>{state.shelf_life_hours ?? '—'} {t.ingredients.hours}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(catalog?.pairings?.length ?? 0) > 0 && (
          <section className="mt-16">
            <p className={`${eyebrowClass} mb-5`}>{t.ingredients.pairings}</p>
            <div className="grid grid-cols-4 gap-5 max-[900px]:grid-cols-2 max-[580px]:grid-cols-1">
              {catalog?.pairings?.map((pairing) => (
                <div className="border-b border-hairline-bone pb-4" key={pairing.slug}>
                  {pairing.image_url && (
                    <div className="mb-3 aspect-[4/3] overflow-hidden border border-hairline-bone bg-white p-4">
                      <img className="size-full object-contain" src={pairing.image_url} alt="" />
                    </div>
                  )}
                  <strong className="font-display text-lg font-medium">{localizedName(pairing, locale)}</strong>
                  <span className="mt-1 block text-xs font-bold text-on-bone-muted">{pairing.pair_score?.toFixed(1) ?? '—'} / 10</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

const factGridClass = 'grid grid-cols-4 border-y border-on-bone max-[900px]:grid-cols-2 max-[580px]:grid-cols-1';
const factCellClass = 'flex flex-col gap-2.5 border-r border-hairline-bone p-7 last:border-r-0 [&:nth-child(4n)]:border-r-0 max-[580px]:border-r-0';

function DataSection({ title, data, unit }: { title: string; data?: Record<string, number | string | boolean | null> | null; unit?: string }) {
  return (
    <section className="mt-16">
      <p className={`${eyebrowClass} mb-5`}>{title}</p>
      <div className="grid grid-cols-4 border-t border-hairline-bone max-[900px]:grid-cols-2 max-[580px]:grid-cols-1">
        {dataEntries(data).map(([key, value]) => (
          <div
            key={key}
            className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-hairline-bone py-4 [&:not(:nth-child(4n))]:pr-6"
          >
            <span className="capitalize text-on-bone-muted">{prettyKey(key)}</span>
            <strong>{String(value)}</strong>
            <small className="text-on-bone-muted">{typeof value === 'number' ? unit : ''}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
