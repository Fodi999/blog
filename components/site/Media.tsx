import { mediaFrameClass, mediaImageClass, mediaOverlayClass } from '@/components/site/classes';
import { cn } from '@/lib/utils';

export function Media({ src, alt, fallback, className }: { src?: string | null; alt: string; fallback?: React.ReactNode; className?: string }) {
  return (
    <div className={cn(mediaFrameClass, className)}>
      <div aria-hidden className={mediaOverlayClass} />
      {src ? <img src={src} alt={alt} className={mediaImageClass} /> : fallback}
    </div>
  );
}
