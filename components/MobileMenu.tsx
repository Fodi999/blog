'use client';

import { useState, useEffect } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-xl border-border/60 bg-background/50 backdrop-blur-sm lg:hidden focus-visible:ring-primary"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-foreground/80" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] border-l-2 border-border p-0 dark:bg-zinc-950">
        <SheetHeader className="p-6 border-b border-border/50 bg-muted/5">
          <SheetTitle className="text-xl font-black tracking-tight uppercase italic text-primary">Menu</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <nav className="flex flex-col p-4 space-y-2">
            {[
              { href: '/', label: t('home'), desc: t('homeDesc') },
              { href: '/blog', label: t('blog'), desc: t('blogDesc'), active: pathname.startsWith('/blog') },
              { href: '/restaurants', label: t('restaurants'), desc: t('restaurantsDesc') },
              { href: '/about', label: t('about'), desc: t('aboutDesc') },
              { href: '/contact', label: t('contact'), desc: t('contactDesc') },
            ].map((item) => {
              const isActive = item.active ?? (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  locale={locale}
                  className={`flex flex-col py-4 px-5 rounded-2xl transition-all ${
                    isActive 
                      ? 'bg-primary/10 text-primary border-2 border-primary/20 shadow-sm' 
                      : 'hover:bg-muted/50 text-foreground/70 active:scale-[0.98]'
                  }`}
                >
                  <span className="font-bold text-lg leading-none">{item.label}</span>
                  <span className={`text-xs mt-1 font-medium ${isActive ? 'text-primary/70' : 'text-muted-foreground'}`}>
                    {item.desc}
                  </span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
