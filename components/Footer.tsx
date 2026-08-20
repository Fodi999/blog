import Link from 'next/link';
import { CookieSettingsLink } from '@/components/CookieSettingsLink';
import { getCopy, localPath, type Locale } from '@/lib/i18n';

export function Footer({ locale }: { locale: Locale }) {
  const t = getCopy(locale);
  const links = [
    [localPath(locale, '/catering-trojmiasto'), t.nav.catering],
    [localPath(locale, '/blog'), t.nav.blog],
    [localPath(locale, '/sklep'), t.nav.shop],
    [localPath(locale, '/skladniki'), t.nav.ingredients],
    [localPath(locale, '/o-mnie'), t.nav.about],
    [localPath(locale, '/kontakt'), t.nav.contact],
  ] as const;

  return (
    <footer className="border-t border-hairline-ink bg-ink text-on-ink">
      <div className="content-frame flex flex-col gap-12 py-16 md:flex-row md:items-start md:justify-between md:py-20">
        <div className="max-w-[32ch]">
          <span className="font-display text-2xl italic">Fomin Chef</span>
          <p className="mt-3 text-sm leading-[1.6] text-on-ink-muted">{t.footer}</p>
        </div>
        <nav
          className="grid grid-cols-2 gap-x-10 gap-y-3 font-sans text-[13px] font-bold tracking-[.04em] text-on-ink-muted uppercase sm:flex sm:flex-wrap sm:gap-x-8"
          aria-label="Footer"
        >
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="transition-colors duration-hover ease-premium hover:text-gold">
              {label}
            </Link>
          ))}
          <CookieSettingsLink locale={locale} />
        </nav>
      </div>
    </footer>
  );
}
