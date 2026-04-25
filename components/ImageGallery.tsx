"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Expand, Instagram, Globe, Facebook, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    title?: string;
    description?: string;
    category?: string;
    slug?: string;
    instagram_url?: string;
    pinterest_url?: string;
    facebook_url?: string;
    tiktok_url?: string;
    website_url?: string;
    colSpan?: string;
    aspectRatio?: string;
  }>;
  categoryLabels?: Record<string, string>;
}

export function ImageGallery({ images, categoryLabels = {} }: ImageGalleryProps) {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  useEffect(() => setMounted(true), []);

  // Build unique sorted category list
  const categories = useMemo(
    () => ['all', ...Array.from(new Set(images.map(i => i.category).filter(Boolean) as string[])).sort()],
    [images]
  );
  const filtered = useMemo(
    () => activeCategory === 'all' ? images : images.filter(i => i.category === activeCategory),
    [images, activeCategory]
  );

  const label = (cat: string) => categoryLabels[cat] ?? cat;

  const openDialog = useCallback((index: number) => setSelectedIndex(index), []);
  const closeDialog = useCallback(() => setSelectedIndex(null), []);
  const goPrev = useCallback(() => {
    setSelectedIndex(i => i !== null ? (i - 1 + filtered.length) % filtered.length : null);
  }, [filtered.length]);
  const goNext = useCallback(() => {
    setSelectedIndex(i => i !== null ? (i + 1) % filtered.length : null);
  }, [filtered.length]);

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIndex, goPrev, goNext]);

  // Touch swipe navigation
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    // Only swipe if horizontal distance > 50px and dominant direction is horizontal
    if (absDx > 50 && absDx > absDy * 1.5) {
      if (dx > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [goPrev, goNext]);

  const image = selectedIndex !== null ? filtered[selectedIndex] : null;
  const dialogDescId = selectedIndex !== null
    ? `gallery-desc-${selectedIndex}-${filtered[selectedIndex]?.src.split('/').pop()?.split('.')[0]}`
    : 'gallery-desc';

  return (
    <div>
      {/* ── Category filter tabs ── */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-8 sm:mb-10">
          {categories.map(cat => {
            const count = cat === 'all' ? images.length : images.filter(i => i.category === cat).length;
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`group/tab inline-flex items-center gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] border transition-all duration-300 ${
                  active
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                    : 'bg-card text-foreground/60 border-border/40 hover:border-primary/30 hover:text-foreground'
                }`}
              >
                <span>{label(cat)}</span>
                <span
                  className={`tabular-nums text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full transition-colors ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-foreground/5 text-foreground/40 group-hover/tab:bg-primary/10 group-hover/tab:text-primary'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Single Dialog for navigation ── */}
      {mounted && image && (
        <Dialog open={selectedIndex !== null} onOpenChange={open => !open && closeDialog()}>
          <DialogContent
            aria-describedby={dialogDescId}
            className="max-w-[100vw] sm:max-w-[95vw] md:max-w-4xl border-none bg-zinc-950 p-0 shadow-2xl ring-0 focus:outline-none overflow-hidden rounded-none sm:rounded-2xl backdrop-blur-2xl [&>button]:!hidden h-[100dvh] sm:h-auto block gap-0"
          >
            <DialogTitle className="sr-only">{image.title || image.alt}</DialogTitle>
            <DialogDescription id={dialogDescId} className="sr-only">
              {image.description || image.title || image.alt}
            </DialogDescription>

            <div
              className="flex flex-col md:flex-row h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] md:max-h-[85vh]"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >

              {/* ── Left: Photo ── */}
              <div className="relative md:w-[55%] shrink-0 bg-zinc-900 flex items-center justify-center min-h-[200px] sm:min-h-[280px] md:min-h-0 overflow-hidden">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={900}
                  height={900}
                  className="w-full h-full object-contain max-h-[40vh] sm:max-h-[50vh] md:max-h-[85vh]"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 95vw, 55vw"
                  priority
                />
                {/* Category badge */}
                {image.category && (
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                    <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-black/60 backdrop-blur-sm text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-primary border border-primary/30">
                      {categoryLabels[image.category] ?? image.category}
                    </span>
                  </div>
                )}

                {/* ── Mobile: overlay prev/next arrows on photo ── */}
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none md:hidden">
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous photo"
                    className="pointer-events-auto w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/80 active:text-white flex items-center justify-center active:scale-90"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next photo"
                    className="pointer-events-auto w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/80 active:text-white flex items-center justify-center active:scale-90"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* ── Mobile: close button on photo ── */}
                <button
                  type="button"
                  onClick={closeDialog}
                  aria-label="Close"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/80 active:text-white flex items-center justify-center active:scale-90 md:hidden"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* ── Right: Info ── */}
              <div className="flex-1 flex flex-col overflow-y-auto min-h-0">

                {/* Header */}
                <div className="px-4 py-3 sm:p-6 sm:pb-4 border-b border-white/8">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-1 sm:mb-2">Detail View</p>
                      <h3 className="text-base sm:text-xl font-black text-white uppercase italic tracking-tighter leading-tight truncate sm:whitespace-normal">
                        {image.title || image.alt}
                      </h3>
                    </div>
                    {/* Mobile: counter badge */}
                    <span className="text-[10px] font-black text-zinc-500 tabular-nums whitespace-nowrap shrink-0 md:hidden">
                      {(selectedIndex ?? 0) + 1}/{filtered.length}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {image.description && (
                  <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-white/8">
                    <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed line-clamp-3 sm:line-clamp-none">
                      {image.description}
                    </p>
                  </div>
                )}

                {/* Social links */}
                {(image.instagram_url || image.pinterest_url || image.facebook_url || image.tiktok_url || image.website_url) && (
                  <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-white/8">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 sm:mb-3">Links</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {image.instagram_url && (
                        <a href={image.instagram_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 text-zinc-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider">
                          <Instagram className="w-3 h-3" />Instagram
                        </a>
                      )}
                      {image.pinterest_url && (
                        <a href={image.pinterest_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 text-zinc-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
                          Pinterest
                        </a>
                      )}
                      {image.facebook_url && (
                        <a href={image.facebook_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 text-zinc-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider">
                          <Facebook className="w-3 h-3" />Facebook
                        </a>
                      )}
                      {image.tiktok_url && (
                        <a href={image.tiktok_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 text-zinc-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>
                          TikTok
                        </a>
                      )}
                      {image.website_url && (
                        <a href={image.website_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 text-zinc-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider">
                          <Globe className="w-3 h-3" />Website
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer: alt text (SEO info) + prev/next + close */}
                <div className="mt-auto px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-2 sm:gap-3">
                  <p className="text-[8px] sm:text-[9px] text-zinc-600 uppercase tracking-widest font-bold truncate flex-1 hidden sm:block">
                    {image.alt}
                  </p>
                  {/* Mobile: swipe hint */}
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold sm:hidden">
                    Swipe to navigate
                  </p>
                  <div className="hidden md:flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={goPrev}
                      aria-label="Previous photo"
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 text-zinc-400 hover:text-white transition-all flex items-center justify-center active:scale-90"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-black text-zinc-500 tabular-nums min-w-[36px] text-center">
                      {(selectedIndex ?? 0) + 1} / {filtered.length}
                    </span>
                    <button
                      type="button"
                      onClick={goNext}
                      aria-label="Next photo"
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 text-zinc-400 hover:text-white transition-all flex items-center justify-center active:scale-90"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={closeDialog}
                      className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95"
                    >
                      Close
                    </button>
                  </div>
                  {/* Mobile: close button in footer */}
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="md:hidden px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shrink-0"
                  >
                    Close
                  </button>
                </div>

              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Fluid responsive grid ── */}
      {/*
        Simple auto-fill grid — cards naturally fill width regardless of count.
        No fixed heights, no row-spans that leave empty slots when filtered.
        Each card has its own aspect ratio; grid just flows left-to-right.
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {filtered.map((img, index) => {
          // Rotating aspect ratios create visual rhythm without breaking flow
          const r = index % 6;
          const aspect = r === 0 || r === 3
            ? 'aspect-[4/5]'       // portrait
            : r === 1 || r === 4
              ? 'aspect-[4/3]'     // landscape
              : 'aspect-square';   // square

          // First card in each row of 3 gets slight emphasis on large screens
          const isFeatured = index % 6 === 0;

          // Staggered entry delay — cap at 800ms
          const animDelay = `${Math.min(index * 60, 800)}ms`;

          const sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

          return (
            <article
              key={img.src || index}
              className={`gallery-item ${aspect} group relative rounded-2xl sm:rounded-3xl overflow-hidden transition-transform duration-500 hover:-translate-y-1`}
              style={{ animationDelay: animDelay }}
            >
              {mounted ? (
                <figure
                  className="relative w-full h-full cursor-pointer focus:outline-none m-0 group/photo"
                  role="button"
                  tabIndex={0}
                  aria-label={img.alt}
                  onClick={() => openDialog(index)}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && openDialog(index)}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes={sizes}
                    className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/photo:scale-[1.08]"
                    priority={index < 4}
                    loading={index < 4 ? 'eager' : 'lazy'}
                  />

                  {/* Persistent soft gradient at bottom — readable title always */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  {/* Category chip — top-left */}
                  {img.category && categoryLabels[img.category] && (
                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3">
                      <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-black/55 backdrop-blur-md text-[8px] sm:text-[9px] font-black uppercase tracking-[0.25em] text-white border border-white/15">
                        {categoryLabels[img.category]}
                      </span>
                    </div>
                  )}

                  {/* Expand icon — top-right, appears on hover */}
                  <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 translate-y-[-4px] group-hover/photo:translate-y-0 transition-all duration-500">
                    <Expand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>

                  {/* Title — bottom, always visible but fades up on hover */}
                  <figcaption className="absolute inset-x-0 bottom-0 p-3 sm:p-4 md:p-5">
                    <h3 className={`font-black text-white uppercase italic tracking-tighter leading-[1.05] drop-shadow-lg transition-all duration-500 line-clamp-2 ${
                      isFeatured ? 'text-lg sm:text-xl md:text-2xl' : 'text-base sm:text-lg'
                    }`}>
                      {img.title || img.alt}
                    </h3>
                  </figcaption>
                </figure>
              ) : (
                /* SSR fallback — same layout, no interaction */
                <figure className="relative w-full h-full overflow-hidden bg-muted/20 m-0">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes={sizes}
                    className="object-cover"
                    priority={index === 0}
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-3 sm:p-4 md:p-5">
                    <h3 className={`font-black text-white uppercase italic tracking-tighter leading-[1.05] drop-shadow-lg line-clamp-2 ${
                      isFeatured ? 'text-lg sm:text-xl md:text-2xl' : 'text-base sm:text-lg'
                    }`}>
                      {img.title || img.alt}
                    </h3>
                  </figcaption>
                </figure>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
