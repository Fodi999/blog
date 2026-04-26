import { setRequestLocale } from 'next-intl/server';
import { CookNowClient } from './_components/CookNowClient';

/**
 * Cook Now — AI-generated dish suggestions from the user's current inventory.
 *
 * Backend: `POST /api/cook/suggestions` (see
 * `assistant/src/application/cook_suggestions.rs`).
 *
 * Three buckets:
 *   • can_cook  — ready to cook now (0 missing)
 *   • almost    — 1-2 missing
 *   • strategic — anti-waste / smart picks (3-4 missing)
 */
export default async function CookNowPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CookNowClient locale={locale} />;
}
