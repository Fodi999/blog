'use client';

import { useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';

type ProductPhotoGalleryProps = {
  images: string[];
  name: string;
  fallbackLabel: string;
};

export function ProductPhotoGallery({ images, name, fallbackLabel }: ProductPhotoGalleryProps) {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  function openImage(url: string) {
    setActiveImage(url);
    setZoom(1);
  }

  if (!images.length) {
    return (
      <div className="grid animate-reveal content-start gap-5">
        <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden border border-hairline-bone bg-white p-[clamp(14px,2.4vw,38px)] font-display uppercase text-on-bone-muted">
          <span>{fallbackLabel}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid animate-reveal content-start gap-5">
        {images.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            className="group relative block w-full cursor-zoom-in border-0 bg-transparent p-0 text-left"
            onClick={() => openImage(url)}
          >
            <img
              src={url}
              alt={name}
              className="h-auto w-full border border-hairline-bone bg-white object-contain object-center transition-[border-color,box-shadow,transform] duration-reveal ease-premium group-hover:-translate-y-1 group-hover:scale-[1.01] group-hover:border-gold/80 group-hover:shadow-[0_32px_80px_rgba(12,10,8,.14)]"
            />
            <span className="absolute right-[18px] bottom-[18px] translate-y-1.5 border border-white/45 bg-ink/72 px-3 py-2.5 text-[11px] font-bold text-white uppercase opacity-0 transition-[opacity,transform] duration-hover ease-premium group-hover:translate-y-0 group-hover:opacity-100">
              View high resolution
            </span>
          </button>
        ))}
      </div>

      <Dialog open={activeImage !== null} onOpenChange={(open) => !open && setActiveImage(null)}>
        <DialogContent
          showCloseButton={false}
          className="grid h-full max-h-none w-full max-w-none grid-rows-[auto_minmax(0,1fr)] gap-[18px] border-0 bg-ink/92 p-[clamp(14px,2vw,28px)] sm:max-w-none"
        >
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <strong className="mr-auto font-display text-2xl text-white">DIMA FOMIN</strong>
            <span className="flex min-h-[38px] items-center border border-white/22 bg-white/7 px-3 text-xs font-black uppercase text-white">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="min-h-[38px] cursor-pointer border border-white/22 bg-white/7 px-3 text-xs font-black uppercase text-white"
              onClick={() => setZoom((current) => Math.max(0.5, current - 0.25))}
            >
              -
            </button>
            <button
              type="button"
              className="min-h-[38px] cursor-pointer border border-white/22 bg-white/7 px-3 text-xs font-black uppercase text-white"
              onClick={() => setZoom(1)}
            >
              100%
            </button>
            <button
              type="button"
              className="min-h-[38px] cursor-pointer border border-white/22 bg-white/7 px-3 text-xs font-black uppercase text-white"
              onClick={() => setZoom((current) => Math.min(3, current + 0.25))}
            >
              +
            </button>
            <DialogClose asChild>
              <button type="button" className="min-h-[38px] cursor-pointer border border-white/22 bg-white/7 px-3 text-xs font-black uppercase text-white">
                Close
              </button>
            </DialogClose>
          </div>
          <div className="relative grid min-h-0 min-w-0 place-items-center overflow-auto">
            {activeImage ? (
              <img
                src={activeImage}
                alt={`${name} high resolution`}
                style={{ transform: `scale(${zoom})` }}
                className="max-h-[82vh] max-w-[94vw] origin-center object-contain transition-transform duration-[180ms] ease-out"
              />
            ) : null}
            <span className="pointer-events-none fixed right-[clamp(18px,3vw,42px)] bottom-[clamp(18px,3vw,42px)] font-display text-[clamp(22px,3vw,46px)] text-white/72">
              DIMA FOMIN
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
