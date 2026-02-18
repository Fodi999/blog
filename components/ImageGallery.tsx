import Image from 'next/image';

interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
  }>;
}

export function ImageGallery({ images }: ImageGalleryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {images.map((image, index) => (
        <div
          key={index}
          className={`group relative overflow-hidden rounded-[2.5rem] border-2 border-border/60 transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:-translate-y-2 ${
            index === 1 ? 'lg:translate-y-12' : ''
          }`}
        >
          <div className="aspect-[4/5] relative overflow-hidden">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
               <p className="text-white text-sm font-black uppercase tracking-widest italic drop-shadow-md">
                 {image.alt}
               </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
