import Link from 'next/link';
import { CookieSettingsLink } from '@/components/CookieSettingsLink';
import { Logo } from '@/components/Logo';
import { fill, getDict, localPath, type Locale } from '@/lib/i18n';
import { INSTAGRAM_URL, TELEGRAM_URL, YOUTUBE_URL } from '@/lib/seo';
import { statusValues } from '@/lib/statusText';

export function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const v = statusValues(locale, t);
  const home = localPath(locale);
  const program = [
    { href: `${home}#directions`, label: t.nav.directions },
    { href: localPath(locale, '/kernel'), label: t.nav.kernel },
    { href: `${home}#progress`, label: t.nav.progress },
    { href: localPath(locale, '/library'), label: t.nav.library },
    { href: localPath(locale, '/download'), label: t.nav.download },
  ];
  const site = [
    { href: localPath(locale, '/about'), label: t.nav.about },
    { href: localPath(locale, '/contact'), label: t.nav.contact },
    { href: localPath(locale, '/privacy'), label: t.footer.privacy },
  ];
  const link = 'text-[15px] text-on-ink transition-colors hover:text-steel';

  return (
    <footer className="mt-28 border-t-2 border-on-ink/45">
      <div className="content-frame grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-5 text-[15px] leading-relaxed text-on-ink-muted">{t.footer.tagline}</p>
        </div>
        <div>
          <h2 className="text-[14px] font-medium text-on-ink-muted">{t.footer.program}</h2>
          <ul className="mt-4 space-y-2.5">
            {program.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={link}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-[14px] font-medium text-on-ink-muted">{t.footer.site}</h2>
          <ul className="mt-4 space-y-2.5">
            {site.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={link}>
                  {l.label}
                </Link>
              </li>
            ))}
            {[
              { href: YOUTUBE_URL, label: 'YouTube' },
              { href: INSTAGRAM_URL, label: 'Instagram' },
              { href: TELEGRAM_URL, label: 'Telegram' },
            ].map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className={link}>
                  {l.label}
                </a>
              </li>
            ))}
            <li className="text-[15px] text-on-ink">
              <CookieSettingsLink locale={locale} />
            </li>
          </ul>
        </div>
      </div>
      <div className="content-frame flex flex-wrap items-center justify-between gap-3 border-t border-hairline-ink-strong py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-[13px] text-on-ink-muted">
        <span>
          © 2026 Dmytro Fomin. {t.footer.rights}
        </span>
        <span className="font-mono text-[12px]">{fill(t.footer.status, v)}</span>
      </div>
    </footer>
  );
}
