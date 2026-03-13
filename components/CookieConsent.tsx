'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Cookie, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cookie-consent';

type ConsentStatus = 'accepted' | 'rejected' | null;

function loadAnalytics() {
  // ConditionalAnalytics listens for this event to mount <Analytics />
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cookie-consent-accepted'));
  }
}

function disableAnalytics() {
  // ConditionalAnalytics listens for this event via storage sync
  // The component re-evaluates on reload; this is a signal for same-tab
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cookie-consent-rejected'));
  }
}

export function CookieConsent() {
  const t = useTranslations('cookieConsent');
  const [status, setStatus] = useState<ConsentStatus>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  // Check stored consent & conditionally load analytics
  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentStatus;
    if (stored === 'accepted') {
      loadAnalytics();
      setStatus('accepted');
      setMounted(true);
      return;
    }
    if (stored === 'rejected') {
      setStatus('rejected');
      setMounted(true);
      return;
    }
    // No decision yet — show banner with entrance animation
    setMounted(true);
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleConsent = (choice: 'accepted' | 'rejected') => {
    setClosing(true);
    setTimeout(() => {
      localStorage.setItem(COOKIE_CONSENT_KEY, choice);
      setStatus(choice);
      setVisible(false);
      setClosing(false);
      if (choice === 'accepted') {
        loadAnalytics();
      }
    }, 300);
  };

  // Don't render until client-side hydration is complete
  if (!mounted) return null;

  // Don't render if already decided
  if (status !== null) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 sm:pb-6 transition-all duration-500 ease-out ${
        visible && !closing
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={t('ariaLabel')}
    >
      <div
        className={[
          'w-full max-w-[900px]',
          'rounded-[14px]',
          'px-5 py-4 sm:px-6 sm:py-5',
          // Glass effect — dark translucent
          'bg-black/80 dark:bg-white/10',
          'backdrop-blur-xl',
          'border border-white/10 dark:border-white/15',
          // Shadow
          'shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
        ].join(' ')}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon + Text */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="shrink-0 mt-0.5">
              <Cookie className="h-5 w-5 text-white/70" strokeWidth={1.5} />
            </div>
            <p className="text-[13px] sm:text-sm leading-relaxed text-white/90">
              {t('message')}{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-2 decoration-white/30 hover:decoration-white/70 text-white transition-colors duration-200"
              >
                {t('privacyLink')}
              </Link>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => handleConsent('rejected')}
              className={[
                'flex-1 sm:flex-none',
                'px-4 py-2 sm:px-5 sm:py-2.5',
                'rounded-[10px]',
                'text-[13px] font-medium',
                'text-white/80 hover:text-white',
                'border border-white/20 hover:border-white/40',
                'bg-transparent hover:bg-white/5',
                'hover:scale-[1.02] active:scale-[0.98]',
                'transition-all duration-200',
                'cursor-pointer',
              ].join(' ')}
            >
              {t('reject')}
            </button>
            <button
              onClick={() => handleConsent('accepted')}
              className={[
                'flex-1 sm:flex-none',
                'px-4 py-2 sm:px-5 sm:py-2.5',
                'rounded-[10px]',
                'text-[13px] font-medium',
                'text-black',
                'bg-white hover:bg-white/90',
                'hover:scale-[1.02] active:scale-[0.98]',
                'shadow-[0_1px_2px_rgba(0,0,0,0.1)]',
                'transition-all duration-200',
                'cursor-pointer',
              ].join(' ')}
            >
              {t('accept')}
            </button>
          </div>

          {/* Close button — mobile only extra option */}
          <button
            onClick={() => handleConsent('rejected')}
            className="absolute top-3 right-3 sm:hidden p-1 text-white/40 hover:text-white/70 transition-colors"
            aria-label={t('close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
