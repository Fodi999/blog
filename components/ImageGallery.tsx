"use client"

import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { Expand } from 'lucide-react';

interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    colSpan?: string;
    aspectRatio?: string;
  }>;
}

export function ImageGallery({ images }: ImageGalleryProps) {

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {images.map((image, index) => (
        <Dialog key={index}>
          <DialogTrigger asChild>
            <div
              className="group relative cursor-pointer overflow-hidden rounded-3xl border border-border/40 bg-muted/20 transition-all duration-500 hover:border-primary/40 hover:shadow-2xl aspect-[4/5]"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />

              {/* Overlay with details */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100">
                <div className="rounded-full bg-white/10 p-3 backdrop-blur-md border border-white/20 transform scale-50 group-hover:scale-100 transition-transform duration-500">
                  <Expand className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-white text-sm font-black uppercase tracking-widest italic">
                  {image.alt}
                </p>
                <div className="mt-2 h-0.5 w-8 bg-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-100" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none ring-0 focus:outline-none overflow-hidden rounded-none sm:rounded-none">
            <DialogTitle className="sr-only">{image.alt}</DialogTitle>
            <div className="relative aspect-[4/5] md:aspect-auto md:h-[85vh] w-full overflow-hidden rounded-3xl">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-contain"
                priority
              />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full">
                <p className="text-white text-xs md:text-sm font-black uppercase tracking-[0.2em] italic">
                  {image.alt}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
