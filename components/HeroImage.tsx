import Image from 'next/image';

interface HeroImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

export function HeroImage({ src, alt, priority = false, className }: HeroImageProps) {
  return (
    <div className={`relative w-full aspect-[21/10] lg:aspect-[21/8] rounded-[3rem] lg:rounded-[4rem] overflow-hidden border-2 border-border/50 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] group ${className || ''}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover transition-transform duration-[2s] group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1400px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />
      
      <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] max-w-sm hidden md:block">
           <p className="text-white text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-70 italic">Exclusive Entry</p>
           <h4 className="text-white text-xl font-black uppercase tracking-tight italic">Fine Dining Philosophy</h4>
        </div>
      </div>
    </div>
  );
}
