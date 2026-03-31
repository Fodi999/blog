import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileMenuWrapper } from './MobileMenuWrapper';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export async function Header({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'nav' });

  return (
    <header className="glass-nav">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" locale={locale} className="flex items-center gap-3 text-xl font-black text-foreground transition-all hover:opacity-80 group">
          <div className="w-10 h-10 rounded-2xl overflow-hidden ring-2 ring-primary/20 bg-muted/10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:ring-primary/40 shadow-xl group-hover:shadow-primary/20 animate-pulse-glow">
            <Image
              src="https://i.postimg.cc/W1KV4b43/logo1.webp"
              alt="Chef Dima Fomin"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="hidden sm:inline tracking-tighter uppercase italic text-primary text-shimmer">{`Dima Fomin`}</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {[
            { href: '/', label: t('home') },
            { href: '/blog', label: t('blog') },
            { href: '/chef-tools', label: t('chefTools') },
            { href: '/about', label: t('about') },
            { href: '/contact', label: t('contact') },
          ].map((item) => (
            <Button key={item.href} variant="ghost" asChild className="text-sm font-black uppercase tracking-widest hover:text-primary transition-all hover:bg-primary/5 rounded-xl link-underline relative px-4">
              <Link href={item.href} locale={locale}>{item.label}</Link>
            </Button>
          ))}

          <div className="flex items-center gap-3 ml-6 border-l border-border/60 pl-6 h-8">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex lg:hidden items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
          <MobileMenuWrapper />
        </div>
      </nav>
    </header>
  );
}
