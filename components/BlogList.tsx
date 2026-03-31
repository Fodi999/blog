import { PostCard } from '@/components/PostCard';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { StaggerReveal } from '@/components/ScrollReveal';

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

  const featuredPost = !searchQuery && posts.length > 0 ? posts[0] : null;
  const remainingPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <div className="space-y-12 md:space-y-16 lg:space-y-20">
      {/* Featured Header Card */}
      {featuredPost && (
        <PostCard {...featuredPost} variant="wide" />
      )}

      {/* Grid of Remaining Posts */}
      {remainingPosts.length > 0 && (
        <StaggerReveal 
          direction="up" 
          staggerMs={100} 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
        >
          {remainingPosts.map((post) => (
            <PostCard 
              key={post.slug} 
              {...post} 
              variant="grid"
            />
          ))}
        </StaggerReveal>
      )}
    </div>
  );
}
