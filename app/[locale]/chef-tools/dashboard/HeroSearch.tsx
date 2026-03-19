'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Search, Loader2, X, ArrowRight, Apple } from 'lucide-react';
import { searchProducts, type SearchResult } from '@/lib/tools';
import { cn } from '@/lib/utils';

/* ── Debounce hook ──────────────────────────────────────────── */

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/* ── Types ──────────────────────────────────────────────────── */

export type HeroSearchProps = {
  onSelect: (slug: string, name: string, image?: string | null) => void;
  onClear: () => void;
  selectedName?: string;
};

/* ── Component ──────────────────────────────────────────────── */

export function HeroSearch({ onSelect, onClear, selectedName }: HeroSearchProps) {
  const locale = useLocale();
  const t = useTranslations('chefTools.dashboard');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounce(query, 300);

  /* Fetch results on debounced input */
  useEffect(() => {
    if (debounced.length < 2) { setResults([]); setOpen(false); return; }
    let cancelled = false;
    setLoading(true);
    searchProducts(debounced, locale, 8).then((r) => {
      if (!cancelled) { setResults(r); setOpen(true); }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debounced, locale]);

  /* Close dropdown on click-away */
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setOpen(false);
    onClear();
    inputRef.current?.focus();
  }, [onClear]);

  const handleSelect = useCallback((r: SearchResult) => {
    setQuery(r.name);
    setOpen(false);
    onSelect(r.slug, r.name, r.image_url);
  }, [onSelect]);

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={wrapperRef}>
      {/* Search bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (e.target.value.length < 2) onClear(); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={t('searchPlaceholder')}
          className={cn("w-full pl-12 pr-12 py-4 rounded-2xl border border-border/60 bg-background text-foreground text-lg font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-200")}
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
        )}
        {!loading && query.length > 0 && (
          <button onClick={clear} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Active selection indicator */}
      {selectedName && !open && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-primary font-bold uppercase tracking-wider animate-in fade-in duration-300">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {t('showingResultsFor')} {selectedName}
        </div>
      )}

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-2 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-lg shadow-xl overflow-hidden">
          {results.map((r) => (
            <button
              key={r.slug}
              onClick={() => handleSelect(r)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group w-full text-left"
            >
              {r.image_url ? (
                <img src={r.image_url} alt={r.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Apple className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {r.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{r.product_type}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && results.length === 0 && !loading && debounced.length >= 2 && (
        <div className="absolute z-50 left-0 right-0 mt-2 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-lg shadow-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">{t('noResults')}</p>
        </div>
      )}
    </div>
  );
}
