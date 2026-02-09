'use client';

import { PostCard } from '@/components/PostCard';
import { useTranslations } from 'next-intl';

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
      <div className="text-center py-12">
        <p className="text-lg text-muted mb-4">
          {searchQuery 
            ? t('noResultsSearch', { query: searchQuery })
            : t('noResultsCategory')
          }
        </p>
        <button
          onClick={onClearFilters}
          className="text-primary hover:underline"
        >
          {t('clearFilters')}
        </button>
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
