'use client';

import * as React from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { locales } from '@/i18n';
import { Globe, Check } from 'lucide-react';
import { useLocale } from 'next-intl';
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

function LanguageSwitcherInner() {
  const locale = useLocale();
  const pathname = usePathname();

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
            asChild
            className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors focus:bg-primary/5 focus:text-primary ${locale === loc ? 'bg-primary/5 font-bold text-primary' : 'font-medium text-foreground/70'
              }`}
          >
            <Link href={pathname} locale={loc}>
              <span>{localeNames[loc]}</span>
              {locale === loc && <Check className="h-4 w-4" />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LanguageSwitcher() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-xl border-border/60 bg-background/50 backdrop-blur-sm"
        aria-label="Change language"
        disabled
      >
        <Globe className="h-4.5 w-4.5 text-foreground/80" />
      </Button>
    );
  }

  return <LanguageSwitcherInner />;
}
