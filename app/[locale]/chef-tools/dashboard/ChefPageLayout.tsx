'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChefHeroHeader } from './ChefHeroHeader';

export function ChefPageLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);

  return (
    <>
      {!ready && (
        <ChefHeroHeader
          title={title}
          description={description}
          onDone={() => setReady(true)}
        />
      )}
      <div
        className={cn(
          'transition-opacity duration-700',
          ready
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none',
        )}
      >
        {children}
      </div>
    </>
  );
}
