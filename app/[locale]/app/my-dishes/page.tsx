import { setRequestLocale } from 'next-intl/server';
import { MyDishesClient } from './_components/MyDishesClient';

/**
 * My Dishes — the user's saved recipes (RecipeV2).
 * Backend returns content already localized to the user's language
 * via `GET /api/recipes/v2`.
 */
export default async function MyDishesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MyDishesClient locale={locale} />;
}
