import { setRequestLocale } from 'next-intl/server';
import { WalletHistoryClient } from './_components/WalletHistoryClient';

/**
 * /app/settings/wallet-history — full credit + debit ledger.
 *
 * Server component just resolves the locale; live data fetch
 * runs client-side because the JWT lives in localStorage.
 */
export default async function WalletHistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WalletHistoryClient locale={locale} />;
}
