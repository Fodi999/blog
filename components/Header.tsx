import Link from 'next/link';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getCopy, localPath, type Locale } from '@/lib/i18n';

export function Header({ locale }: { locale: Locale }) {
  const labels = getCopy(locale).nav;
  const links = [
    ['', labels.home],
    ['/blog', labels.blog],
    ['/o-mnie', labels.about],
    ['/kontakt', labels.contact],
  ] as const;
  return (
    <header className="site-header">
      <div className="site-nav">
        <nav className="site-nav__links" aria-label="Main navigation">
          {links.map(([href, label]) => (
            <Link key={href} href={localPath(locale, href)} className="site-nav__link">
              {label}
            </Link>
          ))}
        </nav>
        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
}
