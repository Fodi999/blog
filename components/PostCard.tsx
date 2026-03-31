import { Link } from '@/i18n/routing';
import { Calendar, Clock, BookOpen, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PostCardProps {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  series?: string;
  seriesOrder?: number;
  readTime?: string;
  coverImage?: string;
  level?: 'base' | 'pro';
  publishedAt?: string;
  variant?: 'grid' | 'wide';
}

export function PostCard({ 
  slug, 
  title, 
  excerpt, 
  date, 
  category, 
  series, 
  seriesOrder, 
  readTime, 
  coverImage,
  level,
  publishedAt,
  variant = 'grid'
}: PostCardProps) {
  const href = `/blog/${slug}` as const;
  const displayDate = publishedAt || date;
  
  return (
    <Link 
      href={href} 
      className={cn(
        "block group hover-lift active:scale-[0.98] transition-all duration-500 w-full rounded-[2.5rem]",
        variant === 'wide' ? "mb-8 md:mb-12" : ""
      )}
    >
      <article className={cn(
        "h-full overflow-hidden rounded-[2.5rem] border border-border/40 bg-card transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] hover:border-primary/40 dark:bg-card/50 hover-glow relative flex flex-col",
        variant === 'wide' ? "md:flex-row min-h-[400px] md:min-h-[450px]" : ""
      )}>
        {/* Cover Image */}
        {coverImage && (
          <div className={cn(
            "relative overflow-hidden bg-muted/20 border-white/5",
            variant === 'wide' ? "md:w-5/12 aspect-video md:aspect-auto" : "aspect-[16/10] w-full"
          )}>
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover transition-all duration-1000 will-change-transform group-hover:scale-110 group-hover:brightness-110 ken-burns"
              priority={variant === 'wide'}
              sizes={variant === 'wide' ? "(max-width: 1024px) 100vw, 40vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
            />
            {/* Cinematic overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
            
            {/* Category badge - glassy on the image */}
            <div className="absolute top-6 left-6 z-10 transition-transform duration-700 group-hover:scale-105">
              <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl">
                {category}
              </div>
            </div>

            {level === 'pro' && (
              <div className="absolute top-6 right-6 z-10">
                <Badge className="bg-amber-500 text-white border-none shadow-xl shadow-amber-500/30 hover:bg-amber-600 animate-pulse px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest">
                  PRO
                </Badge>
              </div>
            )}
          </div>
        )}
        
        <div className={cn(
          "flex flex-col flex-1 p-8 md:p-12",
          variant === 'wide' ? "md:justify-center lg:p-20" : ""
        )}>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              {series && (
                <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{series}</span>
                </div>
              )}
              {variant === 'wide' && (
                <div className="hidden items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-primary/60 sm:flex">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                  <span>Featured Post</span>
                </div>
              )}
            </div>
            
            <h3 className={cn(
              "font-black tracking-tighter text-foreground transition-all duration-500 group-hover:text-primary uppercase italic leading-[1.0]",
              variant === 'wide' ? "text-3xl sm:text-4xl md:text-5xl lg:text-6xl" : "text-xl sm:text-2xl"
            )}>
              {title}
            </h3>
            
            <p className={cn(
              "text-muted-foreground font-medium tracking-tight leading-relaxed line-clamp-3",
              variant === 'wide' ? "text-base md:text-lg lg:text-xl lg:max-w-2xl" : "text-sm md:text-base"
            )}>
              {excerpt}
            </p>
          </div>
          
          <div className={cn(
            "mt-8 md:mt-12 pt-8 border-t border-border/40 flex items-center justify-between",
            variant === 'wide' ? "lg:mt-16" : ""
          )}>
            <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 italic">
              <div className="flex items-center gap-2 group-hover:text-muted-foreground transition-colors duration-500">
                <Calendar className="w-3.5 h-3.5 text-primary/50 group-hover:text-primary transition-colors" />
                <time dateTime={displayDate}>{displayDate}</time>
              </div>
              {readTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary/50" />
                  <span>{readTime}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary transition-all duration-500 group-hover:gap-4">
              <span className="hidden sm:inline">Read Full</span>
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
