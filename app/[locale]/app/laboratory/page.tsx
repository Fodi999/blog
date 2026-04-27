import { setRequestLocale } from 'next-intl/server';
import { LaboratoryClient } from './_components/LaboratoryClient';

/**
 * Laboratory — food-tech analysis workbench.
 *
 * Three zones:
 *   1. Copilot (top)      — input для идеи продукта (Step 8 backend)
 *   2. Constructor (mid)  — ingredients + process steps (CRUD)
 *   3. Analysis (bottom)  — process effects, flavor, shelf life, pairings, warnings
 *
 * Backend contract: see `assistant/FRONTEND_LABORATORY_INTEGRATION.md`.
 */
export default async function LaboratoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LaboratoryClient locale={locale} />;
}
