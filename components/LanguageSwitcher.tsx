'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { locales, type Locale } from '@/lib/i18n';

export function LanguageSwitcher({ locale, size = 'sm' }: { locale: Locale; size?: 'sm' | 'lg' }) {
  const pathname = usePathname();
  const suffix = pathname.replace(/^\/(pl|en|ru|uk)(?=\/|$)/, '') || '';

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const large = size === 'lg';

  return (
    <nav
      className={`flex items-center font-bold uppercase ${large ? 'gap-1 text-sm tracking-[.06em]' : 'gap-1.5 text-[11px] tracking-[.08em]'}`}
      aria-label="Language"
    >
      {locales.map((item, index) => (
        <span key={item} className="flex items-center">
          {index > 0 && <span aria-hidden className={`text-on-ink-muted/35 ${large ? 'mx-0.5' : 'mx-0'}`}>/</span>}
          <Link
            className={`grid place-items-center transition-colors duration-hover ease-premium ${large ? 'min-h-11 min-w-11 px-1.5' : ''} ${
              item === locale ? 'text-gold' : 'text-on-ink-muted hover:text-on-ink'
            }`}
            href={`/${item}${suffix}`}
            hrefLang={item}
          >
            {item}
          </Link>
        </span>
      ))}
    </nav>
  );
}
