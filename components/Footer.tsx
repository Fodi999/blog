import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ManageCookiesButton } from '@/components/ManageCookiesButton';

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'footer' });

  return (
    <footer className="relative mt-auto">
      {/* Animated gradient divider */}
      <div className="gradient-line" />
      
      <div className="container mx-auto px-4 py-10">
        {/* Content links */}
        <div className="flex justify-center flex-wrap gap-x-8 gap-y-3 mb-4">
          {[
            { href: `/${locale}/blog`, label: t('blog') },
            { href: `/${locale}/recipes`, label: t('recipes') },
            { href: `/${locale}/chef-tools`, label: t('chefTools') },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-foreground/70 hover:text-primary transition-colors duration-300 font-bold uppercase tracking-wider link-underline"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Legal links */}
        <div className="flex justify-center flex-wrap gap-x-8 gap-y-3 mb-6">
          {[
            { href: `/${locale}/privacy`, label: t('privacy') },
            { href: `/${locale}/terms`, label: t('terms') },
            { href: `/${locale}/cookies`, label: t('cookies') },
            { href: `/${locale}/contact`, label: t('contact') },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-muted-foreground hover:text-primary transition-colors duration-300 font-medium link-underline"
            >
              {link.label}
            </Link>
          ))}
          <ManageCookiesButton label={t('manageCookies')} />
        </div>
        
        {/* Copyright with subtle styling */}
        <div className="text-center text-sm text-muted-foreground/50 font-medium">
          {t('rights')}
        </div>
      </div>
    </footer>
  );
}
