'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Coins, Check, Loader2, Sparkles } from 'lucide-react';
import {
  listBundles,
  createCheckout,
  formatPrice,
  pricePerAction,
  type BillingBundle,
} from '@/lib/billing';
import { isAuthenticated } from '@/lib/auth-client';

/**
 * PricingClient — renders the action-bundle catalog and drives the
 * checkout redirect.
 *
 * Anonymous users get a "Sign in to buy" CTA that preserves return URL.
 * Authenticated users go straight to Stripe Hosted Checkout.
 */
export function PricingClient({ locale }: { locale: string }) {
  const t = useTranslations('pricing');
  const [bundles, setBundles] = useState<BillingBundle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
    setAuthReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    listBundles()
      .then((b) => {
        if (!cancelled) setBundles(b);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cheapest per-action ratio is the baseline for "save X%" badges.
  const cheapestPerAction = bundles
    ? Math.min(...bundles.map(pricePerAction))
    : 0;
  const mostExpensivePerAction = bundles
    ? Math.max(...bundles.map(pricePerAction))
    : 0;

  async function handleBuy(bundle: BillingBundle) {
    if (!authed) {
      const returnTo = encodeURIComponent(`/${locale}/pricing`);
      window.location.assign(`/${locale}/login?returnTo=${returnTo}`);
      return;
    }
    setPendingKey(bundle.key);
    setError(null);
    try {
      const url = await createCheckout(bundle.key);
      window.location.assign(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setPendingKey(null);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {t('badge')}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Bundles */}
        {!bundles && !error && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        )}

        {bundles && (
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {bundles.map((b, idx) => {
              const perAction = pricePerAction(b);
              const savingsPct =
                mostExpensivePerAction > 0
                  ? Math.round(
                      (1 - perAction / mostExpensivePerAction) * 100,
                    )
                  : 0;
              const isBest = perAction === cheapestPerAction && bundles.length > 1;
              const isMid = idx === 1;
              return (
                <div
                  key={b.key}
                  className={`relative rounded-2xl p-6 border-2 bg-white shadow-sm transition hover:shadow-lg ${
                    isBest
                      ? 'border-amber-500 shadow-amber-100'
                      : isMid
                      ? 'border-amber-200'
                      : 'border-gray-200'
                  }`}
                >
                  {isBest && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold uppercase tracking-wide">
                      {t('bestValue')}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      {t('bundleTitle', { count: b.actions })}
                    </span>
                  </div>
                  <div className="mb-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(b.price_eur_cents)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    {t('perAction', {
                      price: `€${perAction.toFixed(3)}`,
                    })}
                    {savingsPct > 0 && (
                      <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        {t('save', { pct: savingsPct })}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2 mb-6 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{t('feature.noExpiry')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{t('feature.allModes')}</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => handleBuy(b)}
                    disabled={!authReady || pendingKey === b.key}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      isBest
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {pendingKey === b.key ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('redirecting')}
                      </span>
                    ) : authed ? (
                      t('buy')
                    ) : (
                      t('signInToBuy')
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* What is an AI action? — explainer block */}
        {bundles && (
          <div className="max-w-2xl mx-auto mb-12 rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              {t('faq.title')}
            </h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>{t('faq.item1')}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>{t('faq.item2')}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>{t('faq.item3')}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>{t('faq.item4')}</span>
              </li>
            </ul>
          </div>
        )}

        {/* Footnote */}
        <div className="max-w-2xl mx-auto text-center text-sm text-gray-500 space-y-2">
          <p>
            {process.env.NEXT_PUBLIC_STRIPE_TEST_MODE === 'true'
              ? t('paymentSecureTest')
              : t('paymentSecure')}
          </p>
          <p>
            <Link href={`/${locale}/app/dashboard`} className="underline hover:text-amber-700">
              {t('backToApp')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
