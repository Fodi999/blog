import { Link } from '@/i18n/routing';
import { Calendar, Clock, BookOpen } from 'lucide-react';
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
}

export function PostCard({ slug, title, excerpt, date, category, series, seriesOrder, readTime, coverImage }: PostCardProps) {
  const href = `/blog/${slug}` as const;
  
  return (
    <Link href={href}>
      <article className="group border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 bg-card cursor-pointer" style={{
        boxShadow: 'var(--card-shadow, 0 0 0 rgba(0,0,0,0))'
      }}>
        {/* Cover Image */}
        {coverImage && (
          <div className="relative w-full h-40 sm:h-48 overflow-hidden">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        
        <div className="p-4 sm:p-5 md:p-6">
          {/* Category Badge and Series Badge */}
          <div className="mb-3 md:mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-block px-2.5 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold tracking-wide" style={{
              backgroundColor: 'rgb(var(--primary) / 0.1)',
              color: 'rgb(var(--primary))'
            }}>
              {category}
            </span>
            
            {/* Series Badge */}
            {series && (
              <span className="inline-flex items-center gap-1 px-2.5 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold tracking-wide bg-foreground/10 text-foreground">
                <BookOpen className="h-2.5 w-2.5 md:h-3 md:w-3" />
                {series} {seriesOrder && `#${seriesOrder}`}
              </span>
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-lg sm:text-xl font-bold mb-2 md:mb-3 text-foreground group-hover:text-primary transition-colors leading-tight">
            {title}
          </h3>
          
          {/* Excerpt */}
          <p className="text-muted line-clamp-2 mb-3 md:mb-4 text-sm leading-relaxed">
            {excerpt}
          </p>
          
          {/* Meta Info */}
          <div className="flex items-center gap-3 md:gap-4 text-xs text-muted pt-2 md:pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5" />
              <time dateTime={date}>{date}</time>
            </div>
            {readTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
                <span>{readTime}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
