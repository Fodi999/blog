'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={t('searchPlaceholder')}
          className="h-14 w-full pl-12 pr-12 text-base rounded-2xl border-2 border-border bg-background focus-visible:ring-primary/20 focus-visible:border-primary transition-all shadow-sm"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Search suggestions */}
      {showSuggestions && recentSearches.length > 0 && (
        <Card className="absolute top-full mt-3 w-full border-2 border-border shadow-xl z-50 overflow-hidden p-0 animate-in fade-in slide-in-from-top-1">
          <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 bg-muted/5">
            {t('recentSearches')}
          </div>
          <div className="py-1">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleSelectRecent(search)}
                className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors text-sm font-medium text-foreground flex items-center gap-3"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                {search}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
