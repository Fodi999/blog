'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function ChefHeroHeader({
  title,
  description,
  onDone,
}: {
  title: string;
  description: string;
  onDone?: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 2200);
    const t2 = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 sm:py-24 transition-all duration-700',
        fading
          ? 'opacity-0 scale-95 pointer-events-none'
          : 'opacity-100 scale-100',
      )}
    >
      <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-4 sm:mb-6 text-foreground tracking-tighter uppercase italic text-balance break-words">
        {title}<span className="text-primary">.</span>
      </h1>
      <p className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-xl font-medium tracking-tight text-balance leading-relaxed">
        {description}
      </p>
    </div>
  );
}
