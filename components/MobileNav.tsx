'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function MobileNav({
  links,
  languageSwitcher,
  menuLabel,
}: {
  links: readonly (readonly [string, string])[];
  languageSwitcher: React.ReactNode;
  menuLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={menuLabel}
        className="grid size-11 place-items-center text-on-ink transition-colors duration-hover ease-premium hover:text-gold md:hidden"
      >
        <Menu className="size-5" strokeWidth={1.5} />
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full gap-0 border-l border-hairline-ink bg-ink p-0 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] text-on-ink sm:max-w-sm"
      >
        <SheetTitle className="sr-only">{menuLabel}</SheetTitle>
        <div className="flex items-center justify-between px-6 py-5">
          <span className="font-display text-xl italic">Fomin Chef</span>
          <SheetClose
            aria-label="Close"
            className="grid size-11 place-items-center text-on-ink-muted transition-colors duration-hover ease-premium hover:text-gold"
          >
            <X className="size-5" strokeWidth={1.5} />
          </SheetClose>
        </div>
        <nav className="flex flex-col px-6" aria-label="Mobile navigation">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="border-b border-hairline-ink py-4 font-display text-[26px] leading-none transition-colors duration-hover ease-premium hover:text-gold"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-6 py-6">{languageSwitcher}</div>
      </SheetContent>
    </Sheet>
  );
}
