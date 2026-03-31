'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Direction elements slide in from. Default: 'up' */
  direction?: RevealDirection;
  /** Delay in ms before the animation starts */
  delay?: number;
  /** Duration in ms. Default: 700 */
  duration?: number;
  /** How much of the element must be visible (0-1). Default: 0.15 */
  threshold?: number;
  /** Only animate once? Default: true */
  once?: boolean;
  /** Additional distance for the slide. Default: 40px */
  distance?: number;
  /** Scale starting value. Default: 1 (no scale) */
  scale?: number;
  /** Blur starting value in px. Default: 0 */
  blur?: number;
}

const directionMap: Record<RevealDirection, (d: number) => string> = {
  up:    (d) => `translateY(${d}px)`,
  down:  (d) => `translateY(-${d}px)`,
  left:  (d) => `translateX(${d}px)`,
  right: (d) => `translateX(-${d}px)`,
  none:  ()  => 'translate(0, 0)',
};

export function ScrollReveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 700,
  threshold = 0.15,
  once = true,
  distance = 40,
  scale = 1,
  blur = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const hiddenTransform = `${directionMap[direction](distance)} scale(${scale})`;
  const hiddenFilter = blur > 0 ? `blur(${blur}px)` : undefined;

  return (
    <div
      ref={ref}
      className={cn('transition-all will-change-[transform,opacity]', className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0, 0) scale(1)' : hiddenTransform,
        filter: isVisible ? 'blur(0px)' : hiddenFilter,
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  );
}

/** Convenience wrapper that staggers children automatically */
export function StaggerReveal({
  children,
  className,
  staggerMs = 100,
  direction = 'up',
  ...rest
}: ScrollRevealProps & { staggerMs?: number }) {
  const items = Array.isArray(children) ? children : [children];

  return (
    <div className={className}>
      {items.map((child, i) => (
        <ScrollReveal
          key={i}
          direction={direction}
          delay={i * staggerMs}
          {...rest}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}
