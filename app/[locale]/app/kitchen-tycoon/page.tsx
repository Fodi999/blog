import { setRequestLocale } from 'next-intl/server';
import { KitchenTycoonClient } from './_components/KitchenTycoonClient';

/**
 * Kitchen Tycoon — /[locale]/app/kitchen-tycoon
 * Food-business simulation game (Stage 1: small kitchen).
 */
export default async function KitchenTycoonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <KitchenTycoonClient />;
}
