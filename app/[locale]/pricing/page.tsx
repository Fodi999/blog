import { setRequestLocale } from 'next-intl/server';
import { PricingClient } from './_components/PricingClient';

/**
 * Pricing — public page listing action bundles + Stripe Checkout entry.
 * Lives at `/[locale]/pricing` (intentionally outside `/app/*` so it's
 * SEO-indexable and reachable from marketing pages).
 *
 * The client component handles all dynamic logic:
 *   • Loads bundles via `GET /api/billing/bundles` (public).
 *   • If signed-in, "Buy" → `POST /api/billing/checkout` → Stripe.
 *   • If anonymous, "Buy" routes to `/login?returnTo=/pricing`.
 */
export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PricingClient locale={locale} />;
}
