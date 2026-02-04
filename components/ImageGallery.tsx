import Image from 'next/image';

interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
  }>;
}

export function ImageGallery({ images }: ImageGalleryProps) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {images.map((image, index) => (
        <div
          key={index}
          className="relative h-[300px] rounded-lg overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-800"
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </div>
      ))}
    </div>
  );
}
