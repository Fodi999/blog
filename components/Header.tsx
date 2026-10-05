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

  const links = [
    { href: localPath(locale, '/#product'), label: nav.product },
    { href: localPath(locale, '/library'), label: nav.library },
    { href: localPath(locale, '/pricing'), label: nav.pricing },
    { href: localPath(locale, '/download'), label: nav.download },
    { href: localPath(locale, '/contact'), label: nav.contact },
  ];
  const isActive = (href: string) => !href.includes('#') && pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div
        className={`content-frame mt-3 flex h-14 items-center justify-between gap-4 rounded-full border px-3 pl-4 transition-[background-color,border-color,box-shadow] duration-ui ease-premium ${
          scrolled || open ? 'glass backdrop-blur-xl border-hairline-ink shadow-[0_10px_40px_-12px_rgba(0,0,0,.6)]' : 'border-transparent'
        }`}
      >
        <Link href={localPath(locale)} aria-label="Monge" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors duration-hover ${
                isActive(l.href) ? 'bg-white/[.07] text-on-ink' : 'text-on-ink-muted hover:text-on-ink'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-full border border-hairline-ink p-0.5 sm:flex" aria-label={nav.language}>
            {locales.map((l) => (
              <Link
                key={l}
                href={switchLocale(pathname, l)}
                hrefLang={l}
                lang={l}
                title={localeNames[l]}
                className={`rounded-full px-2.5 py-1 font-mono text-[11px] uppercase transition-colors ${
                  l === locale ? 'bg-on-ink text-ink' : 'text-on-ink-muted hover:text-on-ink'
                }`}
              >
                {l}
              </Link>
            ))}
          </div>
          <Link
            href={localPath(locale, '/contact?kind=early_access')}
            className={`${siteButtonVariants({ variant: 'primary', size: 'sm' })} max-sm:hidden!`}
            data-ga-event="cta_header"
          >
            {nav.cta}
          </Link>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full border border-hairline-ink text-on-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? nav.close : nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-3 w-4">
              <span className={`absolute left-0 h-[1.5px] w-4 bg-current transition-transform duration-ui ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
              <span className={`absolute left-0 top-1.5 h-[1.5px] w-4 bg-current transition-opacity ${open ? 'opacity-0' : ''}`} />
              <span className={`absolute left-0 h-[1.5px] w-4 bg-current transition-transform duration-ui ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`content-frame glass backdrop-blur-xl mt-2 overflow-hidden rounded-3xl border border-hairline-ink transition-[max-height,opacity] duration-ui ease-premium lg:hidden ${
          open ? 'max-h-[80dvh] opacity-100' : 'pointer-events-none max-h-0 border-transparent opacity-0'
        }`}
        hidden={!open}
      >
        <nav aria-label="Mobile" className="flex flex-col p-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl px-4 py-3.5 text-[17px] font-medium text-on-ink hover:bg-white/[.05]">
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-hairline-ink px-2 pt-4">
            <div className="flex gap-1">
              {locales.map((l) => (
                <Link
                  key={l}
                  href={switchLocale(pathname, l)}
                  hrefLang={l}
                  className={`rounded-full px-3 py-1.5 font-mono text-[12px] uppercase ${l === locale ? 'bg-on-ink text-ink' : 'text-on-ink-muted'}`}
                >
                  {l}
                </Link>
              ))}
            </div>
            <Link href={localPath(locale, '/contact?kind=early_access')} className={siteButtonVariants({ variant: 'primary', size: 'sm' })}>
              {nav.cta}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
