'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';

/**
 * SuccessClient — landing page after Stripe Hosted Checkout completes.
 *
 * Stripe redirects here with `?session_id=cs_test_…` in the URL. We
 * intentionally do NOT trust the URL to credit the balance — that
 * happens server-side via `checkout.session.completed` webhook. The
 * webhook is the source of truth; this page just confirms.
 *
 * However the webhook can lag a few seconds, so we just show a friendly
 * message and let the user continue.
 */
export function SuccessClient({ locale }: { locale: string }) {
  const t = useTranslations('billing.success');

  // Bust any cached "me" / usage state so the new balance shows up.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chefos:invalidate', { detail: 'me' }));
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 via-background to-background px-4 py-16 dark:from-green-950/20">
      <div className="max-w-md w-full bg-card text-card-foreground rounded-2xl shadow-lg border border-green-200 dark:border-green-900/40 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{t('title')}</h1>
        <p className="text-muted-foreground mb-6">{t('subtitle')}</p>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg p-4 mb-6 text-left">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-900 dark:text-amber-200">{t('note')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href={`/${locale}/app/chat`}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition"
          >
            <MessageSquare className="w-4 h-4" />
            {t('cta.chat')}
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
