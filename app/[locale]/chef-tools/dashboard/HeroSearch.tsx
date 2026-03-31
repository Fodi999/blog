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
    
    el.style.height = '0px'; // Reset to get accurate scrollHeight
    const scrollHeight = el.scrollHeight;
    const min = isResultMode ? 44 : 88;
    const newHeight = Math.max(scrollHeight, min);
    
    el.style.height = `${newHeight}px`;
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
        'relative rounded-[2.5rem] border-2 transition-all duration-700 bg-card/60 backdrop-blur-3xl overflow-hidden',
        isFocused
          ? 'border-primary/50 shadow-[0_0_40px_rgba(var(--primary),0.1)] ring-4 ring-primary/5'
          : 'border-border/40 shadow-2xl shadow-black/5',
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
          isResultMode ? 'left-3 top-3 h-4 w-4' : 'left-3.5 top-3.5 h-4 w-4 sm:left-4 sm:top-4 sm:h-5 sm:w-5',
        )} />

        {/* Textarea — dumb, z-10 */}
        <textarea
          ref={taRef}
          value={query}
          onChange={handleChange}
          onFocus={() => { setIsFocused(true); if (results.length > 0 && !isRecipeMode) setOpen(true); }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text');
            if (text.includes('\n')) {
              e.preventDefault();
              setQuery(text);
              onSubmitText(text);
            } else {
              setTimeout(autoGrow, 0);
            }
          }}
          onInput={(e) => {
            e.currentTarget.style.height = 'auto';
            e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
          }}
          placeholder={isFocused ? "лосось, рис, авокадо или вставь список ингредиентов" : ''}
          rows={isResultMode ? 1 : 3}
          className={cn(
            'relative z-10 w-full bg-transparent text-foreground font-medium',
            'placeholder:text-muted-foreground/40 focus:outline-none',
            'resize-none overflow-y-auto',
            isResultMode
              ? 'text-sm sm:text-base pl-9 pr-20 py-2.5 sm:pl-10 sm:pr-24 sm:py-3 min-h-[40px] sm:min-h-[44px]'
              : 'text-sm sm:text-base pl-10 pr-5 pt-3.5 pb-12 sm:pl-14 sm:pr-6 sm:pt-4 sm:pb-14 min-h-[70px] sm:min-h-[100px]',
          )}
          style={{ lineHeight: 1.6, maxHeight: 200, height: 'auto' }}
        />

        {/* Bottom action bar (hero mode only) */}
        {!isResultMode && (
          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2.5 border-t border-border/20">
            <div className="flex items-center gap-2">
              {loading && <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />}
              {!loading && isRecipeMode && parsedChips.length >= 2 && (
                <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {t('ingredientsCount', { count: parsedChips.length })}
                </span>
              )}
              {!loading && query.length === 0 && (
                <span className="text-[10px] text-muted-foreground/25 font-medium pl-2 hidden sm:block">
                  {t('enterHint')}
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
                  'flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] transition-all italic',
                  query.trim().length >= 2
                    ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 hover:scale-[1.02]'
                    : 'opacity-20 pointer-events-none',
                )}
              >
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {t('analyzeRecipe')}
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
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] transition-all italic",
                  "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-xl shadow-rose-500/20 hover:shadow-rose-500/40 active:scale-95 hover:scale-[1.05]"
                )}
              >
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                {t('go')}
              </button>
            )}
          </div>
        )}
      </div>

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

      {/* Single-word hint & Example Chips */}
      {query.trim().length > 0 && query.trim().length < 5 && !isRecipeMode && !open && !selectedName && !isResultMode && (
        <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50 animate-in fade-in duration-200">
          {t('recipeModeHint')}
        </p>
      )}

      {/* Example chips below the hero input for mobile & desktop */}
      {!isResultMode && query.length === 0 && (
        <div className="mt-4 sm:mt-6 animate-in fade-in duration-500">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { label: t('exampleSalmon'), text: t('exampleSalmonFull') },
              { label: t('exampleChicken'), text: t('exampleChickenFull') },
              { label: t('exampleAvocado'), text: t('exampleAvocadoFull') }
            ].map((chip, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(chip.text);
                  setTimeout(autoGrow, 0);
                  onSubmitText(chip.text);
                }}
                className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full border border-border/40 bg-muted/20 text-[10px] sm:text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selection indicator — only shown when search not open */}
      {selectedName && !open && !isRecipeMode && (
        <div className="mt-20 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-primary/20" />
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50 animate-pulse" />
              <p className="text-[11px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-primary italic leading-none whitespace-nowrap">
                {t('showingResultsFor')} {selectedName}
              </p>
              <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50 animate-pulse" />
            </div>
            <div className="h-px w-8 bg-primary/20" />
          </div>
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
