'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';
import { siteButtonVariants } from '@/components/site/Button';
import { localeNames, locales, localPath, type Dict, type Locale } from '@/lib/i18n';

type Props = { locale: Locale; nav: Dict['nav'] };

function switchLocale(pathname: string, to: Locale): string {
  const parts = pathname.split('/');
  if (parts.length > 1 && (locales as readonly string[]).includes(parts[1])) parts[1] = to;
  else parts.splice(1, 0, to);
  return parts.join('/') || `/${to}`;
}

export function Header({ locale, nav }: Props) {
  const pathname = usePathname() || `/${locale}`;
  const [scrolled, setScrolled] = useState(false);
  // The menu belongs to the page it was opened on: navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean | ((v: boolean) => boolean)) =>
    setOpenOn((prev) => {
      const next = typeof value === 'function' ? value(prev === pathname) : value;
      return next ? pathname : null;
    });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenOn(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const home = localPath(locale);
  const links = [
    { href: `${home}#directions`, label: nav.directions },
    { href: localPath(locale, '/kernel'), label: nav.kernel },
    { href: `${home}#progress`, label: nav.progress },
    { href: localPath(locale, '/library'), label: nav.library },
    { href: localPath(locale, '/about'), label: nav.about },
    { href: localPath(locale, '/download'), label: nav.download },
  ];
  const isActive = (href: string) => !href.includes('#') && pathname.startsWith(href);
  const beta = `${home}#beta`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b pt-[env(safe-area-inset-top)] transition-[background-color,border-color] duration-ui ease-premium ${
        scrolled || open ? 'border-hairline-ink-strong bg-ink/95 backdrop-blur-md' : 'border-transparent'
      }`}
    >
      <div className="content-frame flex h-16 items-center justify-between gap-4">
        <Link href={home} aria-label="Monge" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={`rounded-md px-3 py-2 text-[15px] font-medium transition-colors duration-hover ${
                isActive(l.href) ? 'text-on-ink underline decoration-steel decoration-2 underline-offset-[10px]' : 'text-on-ink-muted hover:text-on-ink'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-0.5 sm:flex" aria-label={nav.language}>
            {locales.map((l) => (
              <Link
                key={l}
                href={switchLocale(pathname, l)}
                hrefLang={l}
                lang={l}
                title={localeNames[l]}
                aria-current={l === locale ? 'true' : undefined}
                className={`rounded-md px-2 py-1 font-mono text-[12px] uppercase transition-colors ${l === locale ? 'text-on-ink' : 'text-on-ink-muted hover:text-on-ink'}`}
              >
                {l}
              </Link>
            ))}
          </div>
          <Link href={beta} className={`${siteButtonVariants({ variant: 'primary', size: 'sm' })} max-sm:hidden!`} data-ga-event="cta_header">
            {nav.cta}
          </Link>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-md border border-hairline-ink-strong text-on-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? nav.close : nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-3 w-4">
              <span className={`absolute left-0 h-[1.5px] w-4 bg-current transition-transform duration-ui ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
              <span className={`absolute top-1.5 left-0 h-[1.5px] w-4 bg-current transition-opacity ${open ? 'opacity-0' : ''}`} />
              <span className={`absolute left-0 h-[1.5px] w-4 bg-current transition-transform duration-ui ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`overflow-hidden border-t border-hairline-ink-strong bg-ink transition-[max-height,opacity] duration-ui ease-premium lg:hidden ${
          open ? 'max-h-[85dvh] opacity-100' : 'pointer-events-none max-h-0 border-transparent opacity-0'
        }`}
        hidden={!open}
      >
        <nav aria-label="Mobile" className="content-frame flex flex-col py-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="border-b border-hairline-ink py-3.5 text-[18px] font-medium text-on-ink">
              {l.label}
            </Link>
          ))}
          <div className="flex items-center justify-between gap-3 pt-4">
            <div className="flex gap-1">
              {locales.map((l) => (
                <Link
                  key={l}
                  href={switchLocale(pathname, l)}
                  hrefLang={l}
                  className={`rounded-md px-3 py-1.5 font-mono text-[13px] uppercase ${l === locale ? 'bg-on-ink text-ink' : 'text-on-ink-muted'}`}
                >
                  {l}
                </Link>
              ))}
            </div>
            <Link href={beta} className={siteButtonVariants({ variant: 'primary', size: 'sm' })}>
              {nav.cta}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
