import { setRequestLocale } from 'next-intl/server';
import { InventoryClient } from './_components/InventoryClient';

/**
 * Stock / Inventory page (`/[locale]/app/inventory`).
 * Mirrors iOS `RecipesView → stockView` and `StockViewModel`:
 *   • KPI strip (value / items / expiring / low)
 *   • Search + filter chips (all / expiring / low / category)
 *   • Grouped list by category with batch-aware product cards
 *   • Add product flow via public catalog search
 *
 * Backend endpoints used:
 *   GET    /api/inventory/products            (auth)
 *   POST   /api/inventory/products            (auth)
 *   DELETE /api/inventory/products/:id        (auth)
 *   GET    /public/catalog/categories         (anon)
 *   GET    /public/catalog/ingredients        (anon)
 */
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <InventoryClient locale={locale} />;
}
