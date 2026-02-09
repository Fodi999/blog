import { Link } from '@/i18n/routing';
import { Calendar, Clock, BookOpen, Award } from 'lucide-react';
import Image from 'next/image';

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
  publishedAt 
}: PostCardProps) {
  const href = `/blog/${slug}` as const;
  const displayDate = publishedAt || date;
  
  return (
    <Link href={href}>
      <article className="group h-full flex flex-col border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 bg-card cursor-pointer" style={{
        boxShadow: 'var(--card-shadow, 0 0 0 rgba(0,0,0,0))'
      }}>
        {/* Cover Image */}
        {coverImage && (
          <div className="relative w-full h-48 overflow-hidden flex-shrink-0">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        
        {/* Content - flex column with flex-1 */}
        <div className="p-4 sm:p-5 md:p-6 flex flex-col flex-1">
          {/* Category Badge, Series Badge, Level Badge */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide" style={{
              backgroundColor: 'rgb(var(--primary) / 0.1)',
              color: 'rgb(var(--primary))'
            }}>
              {category}
            </span>
            
            {/* Series Badge */}
            {series && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-foreground/10 text-foreground">
                <BookOpen className="h-3 w-3" />
                {series} {seriesOrder && `#${seriesOrder}`}
              </span>
            )}

            {/* Level Badge */}
            {level === 'pro' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                <Award className="h-3 w-3" />
                PRO
              </span>
            )}
          </div>
          
          {/* Title - строго 2 строки */}
          <h3 className="text-xl font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors mb-3">
            {title}
          </h3>
          
          {/* Excerpt - строго 3 строки */}
          <p className="text-sm text-muted leading-relaxed line-clamp-3 mb-4">
            {excerpt}
          </p>
          
          {/* Meta Info - mt-auto прижимает к низу */}
          <div className="flex items-center gap-3 text-xs text-muted pt-3 border-t border-border mt-auto">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <time dateTime={displayDate}>{displayDate}</time>
            </div>
            {readTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{readTime}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
