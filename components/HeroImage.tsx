import Image from 'next/image';

interface HeroImageProps {
  src: string;
  alt: string;
  priority?: boolean;
}

export function HeroImage({ src, alt, priority = false }: HeroImageProps) {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-2xl ring-1 ring-gray-200 dark:ring-gray-800">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent dark:from-black/40" />
    </div>
  );
}
