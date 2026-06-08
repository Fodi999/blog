'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { locales, type Locale } from '@/lib/i18n';

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const suffix = pathname.replace(/^\/(pl|en|ru|uk)(?=\/|$)/, '') || '';

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <div className="language-switcher" aria-label="Language">
      {locales.map((item) => (
        <Link
          className={item === locale ? 'is-active' : undefined}
          href={`/${item}${suffix}`}
          hrefLang={item}
          key={item}
        >
          {item}
        </Link>
      ))}
    </div>
  );
}
