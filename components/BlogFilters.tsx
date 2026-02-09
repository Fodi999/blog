'use client';

import { useTranslations } from 'next-intl';
import { BLOG_CATEGORIES } from '@/lib/blog-categories';

interface BlogFiltersProps {
  categories: string[];
  selectedCategory: string;
  searchQuery: string;
  onCategoryChange: (category: string) => void;
  onSearchChange: (query: string) => void;
  totalPosts: number;
  filteredCount: number;
}

export function BlogFilters({
  categories,
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
  totalPosts,
  filteredCount,
}: BlogFiltersProps) {
  const t = useTranslations('blog');

  return (
    <div className="space-y-6">
      {/* Posts count */}
      <div>
        <p className="text-sm text-muted">
          {filteredCount === totalPosts 
            ? `${totalPosts} ${t('postsTotal')}`
            : `${filteredCount} ${t('of')} ${totalPosts} ${t('postsTotal')}`
          }
        </p>
      </div>

      {/* Category filters (chips) */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-primary text-white shadow-md'
              : 'bg-card border-2 border-border text-foreground hover:border-primary/30'
          }`}
        >
          {t('categories.all')}
        </button>
        {BLOG_CATEGORIES.map((cat) => {
          const isActive = categories.includes(cat.key);
          if (!isActive) return null;
          
          return (
            <button
              key={cat.key}
              onClick={() => onCategoryChange(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.key
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-card border-2 border-border text-foreground hover:border-primary/30'
              }`}
            >
              {cat.emoji} {t(`categories.${cat.i18nKey}`)}
            </button>
          );
        })}
      </div>

      {/* Active filters indicator */}
      {(selectedCategory !== 'all' || searchQuery) && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>{t('activeFilters')}:</span>
          {selectedCategory !== 'all' && (
            <span className="px-2 py-1 rounded bg-primary/10 text-primary">
              {t(`categories.${selectedCategory.toLowerCase().replace(/\s+/g, '')}`)}
            </span>
          )}
          {searchQuery && (
            <span className="px-2 py-1 rounded bg-primary/10 text-primary">
              &quot;{searchQuery}&quot;
            </span>
          )}
          <button
            onClick={() => {
              onCategoryChange('all');
              onSearchChange('');
            }}
            className="ml-2 text-primary hover:underline"
          >
            {t('clearFilters')}
          </button>
        </div>
      )}
    </div>
  );
}
