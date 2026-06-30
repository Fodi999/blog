import Link from 'next/link';
import { CookieSettingsLink } from '@/components/CookieSettingsLink';
import { getCopy, localPath, type Locale } from '@/lib/i18n';

export function Footer({ locale }: { locale: Locale }) {
  const t = getCopy(locale);
  return (
    <footer className="site-footer">
      <div>
        <strong>Dima Fomin</strong>
        <p>{t.footer}</p>
      </div>
      <div className="site-footer__links">
        <Link href={localPath(locale, '/blog')}>{t.nav.blog}</Link>
        <Link href={localPath(locale, '/sklep')}>{t.nav.shop}</Link>
        <Link href={localPath(locale, '/skladniki')}>{t.nav.ingredients}</Link>
        <Link href={localPath(locale, '/kontakt')}>{t.nav.contact}</Link>
        <CookieSettingsLink />
      </div>
    </footer>
  );
}
