'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, X, ArrowRight, Apple, Sparkles, Zap } from 'lucide-react';
import { searchProducts, type SearchResult } from '@/lib/tools';
import { cn } from '@/lib/utils';

/* ── Debounce ───────────────────────────────────────────────── */
function useDebounce(value: string, delay: number) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setD(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return d;
}

/* ── Rotating overlay examples (per locale) ─────────────────── */
const EXAMPLES: Record<string, { lines: string[] }[]> = {
  ru: [
    { lines: ['Куриное филе 300 г', 'Масло сливочное 50 г', 'Яйцо 2 шт'] },
    { lines: ['лосось', 'рис', 'авокадо'] },
    { lines: ['Овсянка 100 г', 'Банан 1 шт', 'Мёд 20 г'] },
    { lines: ['паста', 'моцарелла', 'томат', 'базилик'] },
  ],
  en: [
    { lines: ['Chicken breast 300g', 'Butter 50g', 'Egg 2 pcs'] },
    { lines: ['salmon', 'rice', 'avocado'] },
    { lines: ['Oatmeal 100g', 'Banana 1 pc', 'Honey 20g'] },
    { lines: ['pasta', 'mozzarella', 'tomato', 'basil'] },
  ],
  pl: [
    { lines: ['Filet z kurczaka 300 g', 'Masło 50 g', 'Jajko 2 szt'] },
    { lines: ['łosoś', 'ryż', 'awokado'] },
    { lines: ['Owsianka 100 g', 'Banan 1 szt', 'Miód 20 g'] },
    { lines: ['makaron', 'mozzarella', 'pomidor', 'bazylia'] },
  ],
  uk: [
    { lines: ['Куряче філе 300 г', 'Масло вершкове 50 г', 'Яйце 2 шт'] },
    { lines: ['лосось', 'рис', 'авокадо'] },
    { lines: ['Вівсянка 100 г', 'Банан 1 шт', 'Мед 20 г'] },
    { lines: ['паста', 'моцарела', 'томат', 'базилік'] },
  ],
};

const LABELS: Record<string, string> = {
  ru: 'Что ты готовишь?',
  en: 'What are you cooking?',
  pl: 'Co gotujesz?',
  uk: 'Що ти готуєш?',
};

function useRotating(locale: string, active: boolean) {
  const list = EXAMPLES[locale] ?? EXAMPLES.en;
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(p => (p + 1) % list.length); setVisible(true); }, 280);
    }, 3200);
    return () => clearInterval(t);
  }, [active, list.length]);
  return { example: list[idx], visible };
}

/* ── Types ───────────────────────────────────────────────────── */
export type HeroSearchProps = {
  onSelect: (slug: string, name: string, image?: string | null) => void;
  onSubmitText: (text: string) => void;
  onClear: () => void;
  selectedName?: string;
  isResultMode?: boolean;
};

/* ── Component ───────────────────────────────────────────────── */
export function HeroSearch({
  onSelect, onSubmitText, onClear, selectedName, isResultMode,
}: HeroSearchProps) {
  const locale = useLocale();
  const t = useTranslations('chefTools.dashboard');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [parsedChips, setParsedChips] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const debounced = useDebounce(query, 300);

  /* Mode */
  const hasNewlines = query.includes('\n');
  const words = query.trim().split(/[\s,;\n]+/).filter(w => w.length >= 2);
  const isRecipeMode = words.length >= 2 || hasNewlines;

  /* Show rotating overlay only when: hero mode + empty + not focused */
  const showOverlay = !isResultMode && query.length === 0 && !isFocused;
  const { example, visible } = useRotating(locale, showOverlay);
  const label = LABELS[locale] ?? LABELS.en;

  /* Auto-grow */
  const autoGrow = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const min = isResultMode ? 44 : 88;
    el.style.height = `${Math.max(el.scrollHeight, min)}px`;
  }, [isResultMode]);
  useEffect(() => { autoGrow(); }, [query, autoGrow]);

  /* Chips */
  useEffect(() => {
    if (hasNewlines || words.length >= 2) {
      const lines = query.split(/[\n,;]+/).map(l => l.trim()).filter(l => l.length >= 2);
      const chips = lines
        .map(l => l.replace(/\d+\s*(г|g|мл|ml|шт|pcs|кг|kg|tbsp|tsp)\.?\s*$/i, '').trim())
        .filter(c => c.length >= 2);
      setParsedChips(chips);
    } else {
      setParsedChips([]);
    }
  }, [query, hasNewlines, words.length]);

  /* Autocomplete (single-word only) */
  useEffect(() => {
    if (isRecipeMode || debounced.length < 2) { setResults([]); setOpen(false); return; }
    let dead = false;
    setLoading(true);
    searchProducts(debounced, locale, 8)
      .then(r => { if (!dead) { setResults(r); setOpen(true); } })
      .finally(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, [debounced, locale, isRecipeMode]);

  /* Click-away */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const clear = useCallback(() => {
    setQuery(''); setResults([]); setOpen(false); setParsedChips([]);
    onClear();
    if (taRef.current) { taRef.current.style.height = 'auto'; taRef.current.focus(); }
  }, [onClear]);

  const handleSelectResult = useCallback((r: SearchResult) => {
    setQuery(r.name); setOpen(false);
    onSelect(r.slug, r.name, r.image_url);
  }, [onSelect]);

  const handleSubmit = useCallback(() => {
    const text = query.trim();
    if (text.length < 2) return;
    setOpen(false);
    if (isRecipeMode) onSubmitText(text);
    else if (results.length > 0) handleSelectResult(results[0]);
  }, [query, isRecipeMode, onSubmitText, results, handleSelectResult]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.metaKey || e.ctrlKey) { e.preventDefault(); handleSubmit(); }
      else if (!isRecipeMode && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    }
  }, [handleSubmit, isRecipeMode]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    if (e.target.value.length < 2) onClear();
  }, [onClear]);

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div
      ref={wrapperRef}
      className={cn(
        'relative w-full mx-auto transition-all duration-500',
        isResultMode ? 'max-w-xl' : 'max-w-3xl',
      )}
    >
      {/* Label above (hero mode only) */}
      {!isResultMode && (
        <p className={cn(
          'text-[11px] font-black uppercase tracking-widest mb-2 transition-colors duration-300',
          isFocused ? 'text-primary' : 'text-muted-foreground/50',
        )}>
          {label}
        </p>
      )}

      {/* EDITOR CONTAINER */}
      <div className={cn(
        'relative rounded-2xl border overflow-hidden transition-all duration-300 bg-background',
        isFocused
          ? 'border-primary/60 shadow-xl shadow-primary/10 ring-2 ring-primary/20'
          : 'border-border/50 shadow-sm hover:shadow-md hover:border-border/80',
      )}>

        {/* Animated placeholder overlay — z-0, pointer-events-none */}
        {showOverlay && (
          <div className={cn(
            'absolute inset-0 pointer-events-none z-0 overflow-hidden',
            'px-5 py-4 pl-14',
          )}>
            <div className={cn(
              'transition-all duration-300 ease-out',
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1',
            )}>
              {example.lines.map((line, i) => (
                <p key={i} className="text-muted-foreground/40 font-medium leading-relaxed text-base">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Sparkles icon */}
        <Sparkles className={cn(
          'absolute z-20 transition-colors duration-300',
          isFocused ? 'text-primary' : 'text-muted-foreground/40',
          isResultMode ? 'left-3 top-3 h-4 w-4' : 'left-4 top-4 h-5 w-5',
        )} />

        {/* Textarea — dumb, z-10 */}
        <textarea
          ref={taRef}
          value={query}
          onChange={handleChange}
          onFocus={() => { setIsFocused(true); if (results.length > 0 && !isRecipeMode) setOpen(true); }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          onPaste={() => setTimeout(autoGrow, 0)}
          placeholder={isFocused ? t('searchPlaceholder') : ''}
          rows={isResultMode ? 1 : 2}
          className={cn(
            'relative z-10 w-full bg-transparent text-foreground font-medium',
            'placeholder:text-muted-foreground/30 focus:outline-none',
            'resize-none overflow-y-auto',
            isResultMode
              ? 'text-base pl-10 pr-24 py-3 min-h-[44px]'
              : 'text-base pl-14 pr-6 pt-4 pb-14 min-h-[88px]',
          )}
          style={{ lineHeight: 1.6, maxHeight: 200 }}
        />

        {/* Bottom action bar (hero mode only) */}
        {!isResultMode && (
          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2.5 border-t border-border/30 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              {loading && <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />}
              {!loading && isRecipeMode && parsedChips.length >= 2 && (
                <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {parsedChips.length} ingredients
                </span>
              )}
              {!loading && query.length === 0 && (
                <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-wider">
                  cmd+Enter to analyze
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {query.length > 0 && (
                <button onClick={clear} className="p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={query.trim().length < 2}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all',
                  query.trim().length >= 2
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90 active:scale-95'
                    : 'bg-muted/50 text-muted-foreground/40 cursor-not-allowed',
                )}
              >
                <Sparkles className="h-3 w-3" />
                Analyze
              </button>
            </div>
          </div>
        )}

        {/* Result mode: inline controls */}
        {isResultMode && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5">
            {loading && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
            {!loading && query.length > 0 && (
              <button onClick={clear} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
            {query.trim().length >= 2 && (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all"
              >
                <Sparkles className="h-3 w-3" />
                Go
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chips (outside box, recipe mode) */}
      {parsedChips.length >= 2 && !open && !selectedName && !isResultMode && (
        <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-wrap justify-center gap-1.5">
            {parsedChips.slice(0, 8).map((chip, i) => (
              <span
                key={i}
                className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20 animate-in fade-in duration-300"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {chip}
              </span>
            ))}
            {parsedChips.length > 8 && (
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-muted text-muted-foreground">
                +{parsedChips.length - 8}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Single-word hint */}
      {query.trim().length >= 2 && !isRecipeMode && !open && !selectedName && !isResultMode && (
        <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40 animate-in fade-in duration-200">
          Add more words or paste a full recipe
        </p>
      )}

      {/* Selection indicator */}
      {selectedName && !open && !isRecipeMode && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-primary font-bold uppercase tracking-wider animate-in fade-in duration-300">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {t('showingResultsFor')} {selectedName}
        </div>
      )}

      {/* Autocomplete dropdown */}
      {open && results.length > 0 && !isRecipeMode && (
        <div className="absolute z-50 left-0 right-0 mt-2 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-lg shadow-xl overflow-hidden">
          {results.map((r) => (
            <button
              key={r.slug}
              onClick={() => handleSelectResult(r)}
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
      {open && results.length === 0 && !loading && debounced.length >= 2 && !isRecipeMode && (
        <div className="absolute z-50 left-0 right-0 mt-2 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-lg shadow-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">{t('noResults')}</p>
        </div>
      )}
    </div>
  );
}
