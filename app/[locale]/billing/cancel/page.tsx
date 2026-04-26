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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted/30 via-background to-background px-4 py-16">
      <div className="max-w-md w-full bg-card text-card-foreground rounded-2xl shadow-lg border border-border p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <XCircle className="w-9 h-9 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{t('title')}</h1>
        <p className="text-muted-foreground mb-6">{t('subtitle')}</p>
        <div className="space-y-3">
          <Link
            href={`/${locale}/pricing`}
            className="w-full inline-flex items-center justify-center py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition"
          >
            {t('cta.retry')}
          </Link>
          <Link
            href={`/${locale}/app/dashboard`}
            className="block w-full text-center py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {t('cta.dashboard')}
          </Link>
        </div>
      </div>
    </main>
  );
}
