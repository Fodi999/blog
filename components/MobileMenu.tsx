'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('nav');

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={closeMenu}
          />

          {/* Menu Panel */}
          <div className="fixed top-[57px] right-0 bottom-0 w-64 bg-background border-l border-border z-50 shadow-2xl">
            <nav className="flex flex-col p-6 space-y-4">
              <Link
                href="/"
                onClick={closeMenu}
                className="text-foreground hover:text-primary transition-colors py-2 text-lg font-medium"
              >
                {t('home')}
              </Link>
              <Link
                href="/blog"
                onClick={closeMenu}
                className="text-foreground hover:text-primary transition-colors py-2 text-lg font-medium"
              >
                {t('blog')}
              </Link>
              <Link
                href="/restaurants"
                onClick={closeMenu}
                className="text-foreground hover:text-primary transition-colors py-2 text-lg font-medium"
              >
                {t('restaurants')}
              </Link>
              <Link
                href="/about"
                onClick={closeMenu}
                className="text-foreground hover:text-primary transition-colors py-2 text-lg font-medium"
              >
                {t('about')}
              </Link>
              <Link
                href="/contact"
                onClick={closeMenu}
                className="text-foreground hover:text-primary transition-colors py-2 text-lg font-medium"
              >
                {t('contact')}
              </Link>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
