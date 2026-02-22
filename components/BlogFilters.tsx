'use client';

import { useTranslations } from 'next-intl';
import { BLOG_CATEGORIES } from '@/lib/blog-categories';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, LayoutGrid, ChefHat, Fish, Brain, Store, Package, Bot, LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'chef-hat': ChefHat,
  'fish': Fish,
  'brain': Brain,
  'store': Store,
  'package': Package,
  'bot': Bot,
};

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
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest italic">
          {filteredCount === totalPosts 
            ? `${totalPosts} ${t('postsTotal')}`
            : `${filteredCount} ${t('of')} ${totalPosts} ${t('postsTotal')}`
          }
        </p>
      </div>

      {/* Category filters (chips) */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange('all')}
          className={`rounded-full px-5 py-5 text-sm font-bold transition-all ${
            selectedCategory === 'all' ? 'shadow-lg shadow-primary/20' : 'hover:border-primary/50'
          }`}
        >
          <LayoutGrid className="mr-2 h-4 w-4" /> {t('categories.all')}
        </Button>
        {BLOG_CATEGORIES.map((cat) => {
          const isActive = categories.includes(cat.key);
          if (!isActive) return null;
          
          const Icon = ICON_MAP[cat.iconName];
          
          return (
            <Button
              key={cat.key}
              variant={selectedCategory === cat.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(cat.key)}
              className={`rounded-full px-5 py-5 text-sm font-bold transition-all ${
                selectedCategory === cat.key ? 'shadow-lg shadow-primary/20' : 'hover:border-primary/50'
              }`}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />} {t(`categories.${cat.i18nKey}`)}
            </Button>
          );
        })}
      </div>

      {/* Active filters indicator */}
      {(selectedCategory !== 'all' || searchQuery) && (
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/50">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-1">
            {t('activeFilters')}:
          </span>
          {selectedCategory !== 'all' && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-bold px-3 py-1 rounded-lg">
              {t(`categories.${selectedCategory.toLowerCase().replace(/\s+/g, '')}`)}
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-bold px-3 py-1 rounded-lg">
              &quot;{searchQuery}&quot;
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onCategoryChange('all');
              onSearchChange('');
            }}
            className="text-muted-foreground hover:text-primary font-bold h-8 px-2 hover:bg-transparent"
          >
            <X className="mr-1 h-3 w-3" />
            {t('clearFilters')}
          </Button>
        </div>
      )}
    </div>
  );
}
