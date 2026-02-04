'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export function ComponentStyleLogger() {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    const logStyles = () => {
      const header = document.querySelector('header');
      const body = document.body;
      const html = document.documentElement;
      
      console.log('📊 Component Styles:', {
        theme,
        resolvedTheme,
        html: {
          classes: html.className,
          hasDark: html.classList.contains('dark'),
          hasLight: html.classList.contains('light'),
        },
        body: {
          backgroundColor: window.getComputedStyle(body).backgroundColor,
          color: window.getComputedStyle(body).color,
        },
        header: header ? {
          backgroundColor: window.getComputedStyle(header).backgroundColor,
          borderColor: window.getComputedStyle(header).borderBottomColor,
        } : 'not found'
      });
    };

    // Log on mount and theme change
    logStyles();

    // Log after a small delay to ensure styles are applied
    const timeout = setTimeout(logStyles, 100);

    return () => clearTimeout(timeout);
  }, [theme, resolvedTheme]);

  return null;
}
