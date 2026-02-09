'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { usePathname as useNextPathname } from 'next/navigation';
import { locales } from '@/i18n';
import { Globe, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

const localeNames: Record<string, string> = {
  pl: 'Polski',
  en: 'English',
  uk: 'Українська',
  ru: 'Русский',
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = useNextPathname();
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const switchLocale = (newLocale: string) => {
    // Get pathname without locale prefix
    // pathname is like "/uk" or "/uk/blog/post-1"
    const segments = pathname.split('/').filter(Boolean);
    
    // Remove first segment if it's a locale
    if (segments[0] && locales.includes(segments[0] as any)) {
      segments.shift();
    }
    
    // Build new path with new locale
    const pathWithoutLocale = segments.length > 0 ? `/${segments.join('/')}` : '';
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    
    router.push(newPath);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-9 h-9 rounded-md border border-border bg-background flex items-center justify-center hover:bg-card transition-all duration-200 hover:scale-105"
        aria-label="Change language"
      >
        <Globe className="h-4 w-4 text-foreground" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-md shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-2 hover:bg-background transition-colors ${
                locale === loc 
                  ? 'bg-background font-semibold' 
                  : ''
              }`}
            >
              <span className={locale === loc ? 'text-primary' : 'text-foreground'}>{localeNames[loc]}</span>
              {locale === loc && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
