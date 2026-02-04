'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export function ThemeLogger() {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const htmlElement = document.documentElement;
          const hasLight = htmlElement.classList.contains('light');
          const hasDark = htmlElement.classList.contains('dark');
          
          console.log('🎨 DOM class changed:', {
            htmlClasses: htmlElement.className,
            hasLight,
            hasDark,
            theme,
            resolvedTheme,
            bodyBg: window.getComputedStyle(document.body).backgroundColor,
            bodyColor: window.getComputedStyle(document.body).color
          });
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Initial log
    console.log('🎨 Theme Logger initialized:', {
      htmlClasses: document.documentElement.className,
      theme,
      resolvedTheme,
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      bodyColor: window.getComputedStyle(document.body).color
    });

    return () => observer.disconnect();
  }, [theme, resolvedTheme]);

  return null;
}
