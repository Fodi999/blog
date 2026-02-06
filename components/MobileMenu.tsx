'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('nav');
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-foreground" />
        ) : (
          <Menu className="h-6 w-6 text-foreground" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={closeMenu}
            style={{ top: 0 }}
          />

          {/* Menu Panel */}
          <div 
            className="fixed top-0 right-0 bottom-0 w-72 border-l border-border z-[101] shadow-2xl animate-in slide-in-from-right duration-300"
            style={{ backgroundColor: 'rgb(var(--background))' }}
          >
            {/* Close button inside menu */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-lg font-bold text-foreground">Menu</span>
              <button
                onClick={closeMenu}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>
            
            <nav className="flex flex-col p-6 space-y-1">
              <Link
                href="/"
                className={`group text-foreground hover:text-primary hover:bg-primary/5 transition-all py-3 px-4 text-base font-medium rounded-lg ${
                  pathname === '/' || pathname?.match(/^\/[a-z]{2}\/?$/) ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{t('home')}</span>
                  <span className="text-xs text-muted mt-0.5">{t('homeDesc')}</span>
                </div>
              </Link>
              <Link
                href="/blog"
                className={`group text-foreground hover:text-primary hover:bg-primary/5 transition-all py-3 px-4 text-base font-medium rounded-lg ${
                  pathname?.includes('/blog') ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{t('blog')}</span>
                  <span className="text-xs text-muted mt-0.5">{t('blogDesc')}</span>
                </div>
              </Link>
              <Link
                href="/restaurants"
                className={`group text-foreground hover:text-primary hover:bg-primary/5 transition-all py-3 px-4 text-base font-medium rounded-lg ${
                  pathname?.includes('/restaurants') ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{t('restaurants')}</span>
                  <span className="text-xs text-muted mt-0.5">{t('restaurantsDesc')}</span>
                </div>
              </Link>
              <Link
                href="/about"
                className={`group text-foreground hover:text-primary hover:bg-primary/5 transition-all py-3 px-4 text-base font-medium rounded-lg ${
                  pathname?.includes('/about') ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{t('about')}</span>
                  <span className="text-xs text-muted mt-0.5">{t('aboutDesc')}</span>
                </div>
              </Link>
              <Link
                href="/contact"
                className={`group text-foreground hover:text-primary hover:bg-primary/5 transition-all py-3 px-4 text-base font-medium rounded-lg ${
                  pathname?.includes('/contact') ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{t('contact')}</span>
                  <span className="text-xs text-muted mt-0.5">{t('contactDesc')}</span>
                </div>
              </Link>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
