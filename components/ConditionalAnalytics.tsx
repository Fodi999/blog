'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';

const COOKIE_CONSENT_KEY = 'cookie-consent';

/**
 * Renders Vercel <Analytics /> ONLY when the user has accepted cookies.
 * Listens for consent changes via:
 *  - localStorage on mount
 *  - custom 'cookie-consent-accepted' event (fired by CookieConsent banner)
 *  - storage event (cross-tab sync)
 */
export function ConditionalAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Check on mount
    if (localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted') {
      setEnabled(true);
    }

    // Listen for consent acceptance from the banner
    const onAccepted = () => setEnabled(true);
    window.addEventListener('cookie-consent-accepted', onAccepted);

    // Listen for consent rejection (e.g. via "Manage cookies" → re-reject)
    const onRejected = () => setEnabled(false);
    window.addEventListener('cookie-consent-rejected', onRejected);

    // Cross-tab sync: if user changes consent in another tab
    const onStorage = (e: StorageEvent) => {
      if (e.key === COOKIE_CONSENT_KEY) {
        setEnabled(e.newValue === 'accepted');
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('cookie-consent-accepted', onAccepted);
      window.removeEventListener('cookie-consent-rejected', onRejected);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  if (!enabled) return null;

  return <Analytics />;
}
