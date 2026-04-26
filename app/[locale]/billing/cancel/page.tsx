import { setRequestLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default async function BillingCancelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'billing.cancel' });

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 via-white to-white px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <XCircle className="w-9 h-9 text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600 mb-6">{t('subtitle')}</p>
        <div className="space-y-3">
          <Link
            href={`/${locale}/pricing`}
            className="w-full inline-flex items-center justify-center py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition"
          >
            {t('cta.retry')}
          </Link>
          <Link
            href={`/${locale}/app/dashboard`}
            className="block w-full text-center py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {t('cta.dashboard')}
          </Link>
        </div>
      </div>
    </main>
  );
}
