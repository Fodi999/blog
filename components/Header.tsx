import Link from 'next/link';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { MobileNav } from '@/components/MobileNav';
import { getCopy, localPath, type Locale } from '@/lib/i18n';

const menuLabel: Record<Locale, string> = {
  pl: 'Menu',
  en: 'Menu',
  ru: 'Меню',
  uk: 'Меню',
};

export function Header({ locale }: { locale: Locale }) {
  const labels = getCopy(locale).nav;
  const links = [
    ['', labels.home],
    ['/catering-trojmiasto', labels.catering],
    ['/blog', labels.blog],
    ['/sklep', labels.shop],
    ['/skladniki', labels.ingredients],
    ['/o-mnie', labels.about],
    ['/kontakt', labels.contact],
  ] as const;
  const resolvedLinks = links.map(([href, label]) => [localPath(locale, href), label] as const);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline-ink bg-ink pt-[env(safe-area-inset-top)] text-on-ink">
      <div className="content-frame flex h-20 items-center justify-between gap-8">
        <Link href={localPath(locale, '')} className="font-display text-[22px] italic tracking-[-0.01em]">
          Fomin Chef
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {resolvedLinks.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="group relative py-2 font-sans text-[12px] font-bold tracking-[.1em] whitespace-nowrap text-on-ink-muted uppercase transition-colors duration-hover ease-premium hover:text-on-ink"
            >
              {label}
              <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gold transition-transform duration-ui ease-premium group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <div className="hidden md:block">
            <LanguageSwitcher locale={locale} />
          </div>
          <MobileNav links={resolvedLinks} languageSwitcher={<LanguageSwitcher locale={locale} size="lg" />} menuLabel={menuLabel[locale]} />
        </div>
      </div>
    </header>
  );
}
