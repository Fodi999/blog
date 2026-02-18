'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { usePathname as useNextPathname } from 'next/navigation';
import { locales } from '@/i18n';
import { Globe, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

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

  const switchLocale = (newLocale: string) => {
    // pathname can be like "/uk" or "/uk/blog/post-1" or just "/"
    let newPath = '';
    const segments = pathname.split('/').filter(Boolean);
    
    // Check if the first segment is a locale
    if (segments[0] && locales.includes(segments[0] as any)) {
      segments[0] = newLocale;
      newPath = `/${segments.join('/')}`;
    } else {
      // If no locale in pathname, prepend it
      newPath = `/${newLocale}${pathname === '/' ? '' : pathname}`;
    }
    
    router.push(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 rounded-xl border-border/60 bg-background/50 backdrop-blur-sm hover:border-primary/30 hover:bg-muted/30 transition-all active:scale-95"
          aria-label="Change language"
        >
          <Globe className="h-4.5 w-4.5 text-foreground/80" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-1 rounded-2xl border-2 border-border shadow-2xl animate-in zoom-in-95 duration-200">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchLocale(loc)}
            className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors focus:bg-primary/5 focus:text-primary ${
              locale === loc ? 'bg-primary/5 font-bold text-primary' : 'font-medium text-foreground/70'
            }`}
          >
            <span>{localeNames[loc]}</span>
            {locale === loc && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
