'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { ThemeLogger } from './ThemeLogger';
import { ComponentStyleLogger } from './ComponentStyleLogger';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      disableTransitionOnChange
    >
      <ThemeLogger />
      <ComponentStyleLogger />
      {children}
    </ThemeProvider>
  );
}
