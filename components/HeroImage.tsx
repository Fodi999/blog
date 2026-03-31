import Image from 'next/image';

interface HeroImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

export function HeroImage({ src, alt, priority = false, className }: HeroImageProps) {
  return (
    <div className={`relative w-full aspect-[21/10] lg:aspect-[21/8] rounded-[3rem] lg:rounded-[4rem] overflow-hidden border-2 border-border/50 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] group grain-overlay hover-glow ${className || ''}`}>
      {/* Animated glow ring */}
      <div className="absolute -inset-1 rounded-[3.5rem] lg:rounded-[4.5rem] bg-gradient-to-r from-primary/20 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10 blur-xl" />
      
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover ken-burns group-hover:brightness-105 transition-[filter] duration-1000"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1400px"
      />
      
      {/* Cinematic gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent opacity-40" />
      
      {/* Floating glass card */}
      <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between">
        <div className="glass-card p-6 rounded-[2rem] max-w-sm hidden md:block group/card">
          <p className="text-white text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-60 italic">Exclusive Entry</p>
          <h4 className="text-white text-xl font-black uppercase tracking-tight italic group-hover/card:text-primary transition-colors duration-300">Fine Dining Philosophy</h4>
        </div>
      </div>
    </div>
  );
}
