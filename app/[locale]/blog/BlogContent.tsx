'use client';

import { useState, useMemo, useEffect } from 'react';
import { BlogFilters } from '@/components/BlogFilters';
import { BlogSearch } from '@/components/BlogSearch';
import { BlogList } from '@/components/BlogList';

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

interface BlogContentProps {
  posts: Post[];
  categories: string[];
}

export function BlogContent({ posts, categories }: BlogContentProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter posts based on category and search
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [posts, selectedCategory, searchQuery]);

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
  };

  if (!mounted) {
    return <BlogList posts={posts} searchQuery="" onClearFilters={() => {}} />;
  }

  return (
    <div className="space-y-8">
      {/* Search */}
      <BlogSearch value={searchQuery} onChange={setSearchQuery} />

      {/* Filters */}
      <BlogFilters
        categories={categories}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        onCategoryChange={setSelectedCategory}
        onSearchChange={setSearchQuery}
        totalPosts={posts.length}
        filteredCount={filteredPosts.length}
      />

      {/* List */}
      <BlogList 
        posts={filteredPosts}
        searchQuery={searchQuery}
        onClearFilters={handleClearFilters}
      />
    </div>
  );
}
