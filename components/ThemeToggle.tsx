'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    console.log('🎨 ThemeToggle mounted');
  }, []);

  React.useEffect(() => {
    console.log('🎨 Theme changed:', { 
      theme, 
      systemTheme,
      resolvedTheme,
      currentTheme: theme === 'system' ? systemTheme : theme,
      localStorage: typeof window !== 'undefined' ? localStorage.getItem('theme') : 'N/A'
    });
  }, [theme, systemTheme, resolvedTheme]);

  React.useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  if (!mounted) {
    return (
      <button className="w-9 h-9 rounded-md border border-border bg-background" />
    );
  }

  // Определяем текущую тему для отображения правильной иконки
  const displayTheme = resolvedTheme || (theme === 'system' ? systemTheme : theme);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('🎨 Theme toggle clicked, current isOpen:', isOpen);
          setIsOpen(!isOpen);
        }}
        className="w-9 h-9 rounded-md border border-border bg-background flex items-center justify-center hover:bg-card transition-all duration-200 hover:scale-105"
        aria-label="Toggle theme"
      >
        {displayTheme === 'dark' ? (
          <Moon className="h-4 w-4 text-foreground animate-in spin-in-180 duration-300" />
        ) : (
          <Sun className="h-4 w-4 text-foreground animate-in spin-in-180 duration-300" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-md shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => {
              console.log('☀️ Light theme selected');
              setTheme('light');
              setIsOpen(false);
            }}
            className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-background transition-colors ${
              theme === 'light' ? 'bg-background font-semibold' : ''
            }`}
          >
            <Sun className={`h-4 w-4 ${theme === 'light' ? 'text-primary' : 'text-foreground'}`} />
            <span className={theme === 'light' ? 'text-primary' : 'text-foreground'}>Светлая</span>
          </button>
          
          <button
            onClick={() => {
              console.log('🌙 Dark theme selected');
              setTheme('dark');
              setIsOpen(false);
            }}
            className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-background transition-colors ${
              theme === 'dark' ? 'bg-background font-semibold' : ''
            }`}
          >
            <Moon className={`h-4 w-4 ${theme === 'dark' ? 'text-primary' : 'text-foreground'}`} />
            <span className={theme === 'dark' ? 'text-primary' : 'text-foreground'}>Тёмная</span>
          </button>
          
          <button
            onClick={() => {
              console.log('💻 System theme selected');
              setTheme('system');
              setIsOpen(false);
            }}
            className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-background transition-colors ${
              theme === 'system' ? 'bg-background font-semibold' : ''
            }`}
          >
            <Monitor className={`h-4 w-4 ${theme === 'system' ? 'text-primary' : 'text-foreground'}`} />
            <span className={theme === 'system' ? 'text-primary' : 'text-foreground'}>
              Системная
              {theme === 'system' && (
                <span className="ml-1 text-xs text-muted">
                  ({displayTheme === 'dark' ? '🌙' : '☀️'})
                </span>
              )}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
