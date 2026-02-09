'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BlogSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function BlogSearch({ value, onChange }: BlogSearchProps) {
  const t = useTranslations('blog');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleClearSearch = () => {
    onChange('');
    setShowSuggestions(false);
  };

  const handleSelectRecent = (search: string) => {
    onChange(search);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-12 pr-12 py-3.5 text-base rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted focus:border-primary focus:outline-none transition-colors shadow-sm"
        />
        {value && (
          <button
            onClick={handleClearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search suggestions */}
      {showSuggestions && recentSearches.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border-2 border-border rounded-lg shadow-lg z-10 overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold text-muted border-b border-border">
            {t('recentSearches')}
          </div>
          {recentSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => handleSelectRecent(search)}
              className="w-full text-left px-3 py-2 hover:bg-primary/5 transition-colors text-sm text-foreground"
            >
              {search}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
