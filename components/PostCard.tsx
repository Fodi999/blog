import { Link } from '@/i18n/routing';
import { Calendar, Clock, BookOpen, Award } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    <Link href={href} className="block h-full group">
      <Card className="h-full overflow-hidden border-border transition-all duration-300 hover:shadow-lg hover:border-primary/20 dark:bg-card/50">
        {/* Cover Image */}
        {coverImage && (
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/20">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {level === 'pro' && (
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-amber-500 text-white border-none shadow-sm hover:bg-amber-600">
                  <Award className="mr-1 h-3 w-3" />
                  PRO
                </Badge>
              </div>
            )}
          </div>
        )}
        
        <CardContent className="flex flex-col flex-1 p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-muted/5 text-foreground/70 font-medium">
              {category}
            </Badge>
            
            {series && (
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary font-medium">
                <BookOpen className="mr-1 h-3 w-3" />
                {series}
              </Badge>
            )}
          </div>
          
          <h3 className="mb-3 text-xl font-black tracking-tighter text-foreground transition-colors group-hover:text-primary line-clamp-2 uppercase italic leading-none">
            {title}
          </h3>
          
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground line-clamp-3 font-medium tracking-tight">
            {excerpt}
          </p>
          
          <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-4">
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <time dateTime={displayDate}>{displayDate}</time>
              </div>
              {readTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>{readTime}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
