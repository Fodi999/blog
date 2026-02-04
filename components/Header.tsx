import { Link } from '@/i18n/routing';
import { getTranslations, getLocale } from 'next-intl/server';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import Image from 'next/image';

export async function Header() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'nav' });

  return (
    <header className="border-b border-border sticky top-0 bg-background-blur backdrop-blur-md z-50 shadow-sm">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-xl font-bold text-foreground link-hover">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-red-500">
            <Image
              src="https://i.postimg.cc/fWKbJXrD/Snimok-ekrana-2026-02-04-v-20-56-27.png"
              alt="Chef Dima Fomin"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          Dima Fomin
        </Link>
        
        <div className="flex items-center gap-6">
          <Link href="/" className="text-foreground link-hover relative group">
            {t('home')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200" style={{ backgroundColor: 'rgb(var(--primary))' }} />
          </Link>
          <Link href="/blog" className="text-foreground link-hover relative group">
            {t('blog')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-200" style={{ backgroundColor: 'rgb(var(--primary))' }} />
          </Link>
          <Link href="/restaurants" className="text-foreground link-hover relative group">
            {t('restaurants')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-200" style={{ backgroundColor: 'rgb(var(--primary))' }} />
          </Link>
          <Link href="/about" className="text-foreground link-hover relative group">
            {t('about')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-200" style={{ backgroundColor: 'rgb(var(--primary))' }} />
          </Link>
          <Link href="/contact" className="text-foreground link-hover relative group">
            {t('contact')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-200" style={{ backgroundColor: 'rgb(var(--primary))' }} />
          </Link>
          
          <div className="flex items-center gap-2 ml-4 border-l border-border pl-4">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
    </header>
  );
}
