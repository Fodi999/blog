import Link from 'next/link';
import { CookieSettingsLink } from '@/components/CookieSettingsLink';
import { Logo } from '@/components/Logo';
import { getDict, localPath, type Locale } from '@/lib/i18n';

export function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const year = new Date().getFullYear();
  const product = [
    { href: localPath(locale, '/#product'), label: t.nav.product },
    { href: localPath(locale, '/library'), label: t.nav.library },
    { href: localPath(locale, '/pricing'), label: t.nav.pricing },
    { href: localPath(locale, '/download'), label: t.nav.download },
  ];
  const company = [
    { href: localPath(locale, '/contact'), label: t.nav.contact },
    { href: localPath(locale, '/privacy'), label: t.footer.privacy },
  ];

  return (
    <footer className="relative mt-24 border-t border-hairline-ink">
      <div className="content-frame grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-5 text-[14px] leading-relaxed text-on-ink-muted">{t.footer.tagline}</p>
        </div>
        <div>
          <h2 className="font-mono text-[11px] tracking-[.16em] text-on-ink-muted uppercase">{t.footer.product}</h2>
          <ul className="mt-4 space-y-2.5">
            {product.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[14px] text-on-ink transition-colors hover:text-signal">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-mono text-[11px] tracking-[.16em] text-on-ink-muted uppercase">{t.footer.company}</h2>
          <ul className="mt-4 space-y-2.5">
            {company.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[14px] text-on-ink transition-colors hover:text-signal">
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="text-[14px] text-on-ink">
              <CookieSettingsLink locale={locale} />
            </li>
          </ul>
        </div>
      </div>
      <div className="content-frame flex flex-wrap items-center justify-between gap-3 border-t border-hairline-ink py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] font-mono text-[11px] text-on-ink-muted">
        <span>
          © {year} Monge. {t.footer.rights}
        </span>
        <span>Euclid → Descartes → Monge → AI</span>
      </div>
    </footer>
  );
}
