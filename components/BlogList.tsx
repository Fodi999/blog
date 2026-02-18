import { PostCard } from '@/components/PostCard';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime?: string;
  category: string;
  coverImage?: string;
  series?: string;
  seriesOrder?: number;
  level?: 'base' | 'pro';
  publishedAt?: string;
}

interface BlogListProps {
  posts: Post[];
  searchQuery: string;
  onClearFilters: () => void;
}

export function BlogList({ posts, searchQuery, onClearFilters }: BlogListProps) {
  const t = useTranslations('blog');

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 bg-muted/20 rounded-3xl border border-dashed border-border/60">
        <p className="text-xl font-medium text-foreground/60 mb-6">
          {searchQuery 
            ? t('noResultsSearch', { query: searchQuery })
            : t('noResultsCategory')
          }
        </p>
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="rounded-xl border-2 px-8 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
        >
          {t('clearFilters')}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {posts.map((post) => (
        <PostCard key={post.slug} {...post} />
      ))}
    </div>
  );
}
