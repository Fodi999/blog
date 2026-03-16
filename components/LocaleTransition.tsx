'use client';

import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

/**
 * Wraps page content with a smooth fade transition when the locale changes.
 * Preserves scroll position — no jump to top.
 */
export function LocaleTransition({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const [visible, setVisible] = useState(true);
  const prevLocale = useRef(locale);

  useEffect(() => {
    if (prevLocale.current === locale) return;
    prevLocale.current = locale;
    // Fade out briefly then fade back in
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, [locale]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 150ms ease-in-out',
      }}
    >
      {children}
    </div>
  );
}
