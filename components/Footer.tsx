import { getTranslations, getLocale } from 'next-intl/server';
import Link from 'next/link';
import { ManageCookiesButton } from '@/components/ManageCookiesButton';

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'footer' });

  return (
    <footer className="border-t border-border mt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Legal links */}
        <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mb-4">
          <Link
            href={`/${locale}/privacy`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('privacy')}
          </Link>
          <Link
            href={`/${locale}/terms`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('terms')}
          </Link>
          <Link
            href={`/${locale}/cookies`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('cookies')}
          </Link>
          <Link
            href={`/${locale}/contact`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('contact')}
          </Link>
          <ManageCookiesButton label={t('manageCookies')} />
        </div>
        {/* Copyright */}
        <div className="text-center text-sm text-muted">
          {t('rights')}
        </div>
      </div>
    </footer>
  );
}
