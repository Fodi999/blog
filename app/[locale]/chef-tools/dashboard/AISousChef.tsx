'use client';

/**
 * AISousChef — one input, one AI, every scenario.
 *
 * Input → POST /public/chat → cards[] + text
 *
 * No tabs. No mode selection. No front-end logic.
 * The Rust backend decides what to return.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { postChat, type ChatApiResponse, type SessionContext } from '@/lib/chef-chat-api';
import { ChatCardsGrid } from '@/components/chat/ChatCards';

// ── Locale data ────────────────────────────────────────────────────────────────

const COPY: Record<string, {
  headline: string;
  sub: string;
  placeholder: string;
  chips: { emoji: string; label: string; query: string }[];
  generate: string;
  reset: string;
  errorFallback: string;
}> = {
  ru: {
    headline: 'Твой AI Sous-Chef',
    sub: 'Напиши цель — получи продукты, рецепты, калории. Всё через один AI.',
    placeholder: 'Хочу похудеть / что из курицы / 200г в ложках…',
    chips: [
      { emoji: '🟢', label: 'Хочу похудеть',     query: 'хочу похудеть' },
      { emoji: '💪', label: 'Много белка',        query: 'что съесть для набора мышц' },
      { emoji: '⚡', label: 'Быстрый ужин',       query: 'быстрый ужин' },
      { emoji: '🥗', label: 'Полезные продукты',  query: 'что полезного поесть' },
    ],
    generate: 'Спросить',
    reset: 'Сначала',
    errorFallback: 'Ошибка соединения. Попробуй ещё раз.',
  },
  en: {
    headline: 'Your AI Sous-Chef',
    sub: 'Describe your goal — get products, recipes, nutrition. One AI, every scenario.',
    placeholder: 'I want to lose weight / chicken ideas / convert 200g…',
    chips: [
      { emoji: '🟢', label: 'Lose weight',    query: 'I want to lose weight' },
      { emoji: '💪', label: 'High protein',   query: 'high protein meal ideas' },
      { emoji: '⚡', label: 'Quick dinner',   query: 'quick dinner idea' },
      { emoji: '🥗', label: 'Healthy picks',  query: 'healthy food ideas' },
    ],
    generate: 'Ask',
    reset: 'Start over',
    errorFallback: 'Connection error. Please try again.',
  },
  pl: {
    headline: 'Twój AI Sous-Chef',
    sub: 'Opisz cel — otrzymaj produkty, przepisy, makroskładniki. Jeden AI, każdy scenariusz.',
    placeholder: 'Chcę schudnąć / co z kurczaka / przelicz 200g…',
    chips: [
      { emoji: '🟢', label: 'Chcę schudnąć',      query: 'chcę schudnąć' },
      { emoji: '💪', label: 'Dużo białka',         query: 'dużo białka co jeść' },
      { emoji: '⚡', label: 'Szybkie danie',       query: 'szybkie danie na obiad' },
      { emoji: '🥗', label: 'Zdrowe produkty',     query: 'zdrowe produkty' },
    ],
    generate: 'Zapytaj',
    reset: 'Od nowa',
    errorFallback: 'Błąd połączenia. Spróbuj jeszcze raz.',
  },
  uk: {
    headline: 'Твій AI Sous-Chef',
    sub: 'Опиши мету — отримай продукти, рецепти, калорії. Один AI, будь-який сценарій.',
    placeholder: 'Хочу схуднути / що з курки / 200г в ложках…',
    chips: [
      { emoji: '🟢', label: 'Хочу схуднути',     query: 'хочу схуднути' },
      { emoji: '💪', label: 'Багато білка',       query: 'що їсти для набору м\'язів' },
      { emoji: '⚡', label: 'Швидка вечеря',     query: 'швидка вечеря' },
      { emoji: '🥗', label: 'Корисні продукти',  query: 'що корисного з\'їсти' },
    ],
    generate: 'Запитати',
    reset: 'Спочатку',
    errorFallback: 'Помилка з\'єднання. Спробуй ще раз.',
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Turn {
  id: number;
  query: string;
  response?: ChatApiResponse;
  error?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AISousChef() {
  const locale = useLocale();
  const copy = COPY[locale] ?? COPY.en;

  const [query, setQuery] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<SessionContext>({});
  const idRef = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [query]);

  // Focus on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Scroll to result
  useEffect(() => {
    if (turns.length > 0) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [turns.length]);

  const submit = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;

    const id = ++idRef.current;
    setTurns(prev => [...prev, { id, query: q }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await postChat(q, context);
      setTurns(prev => prev.map(t => t.id === id ? { ...t, response: res } : t));
      setContext(res.context ?? {});
    } catch {
      setTurns(prev => prev.map(t => t.id === id ? { ...t, error: copy.errorFallback } : t));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, context, copy.errorFallback]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(query);
    }
  };

  const reset = () => {
    setTurns([]);
    setContext({});
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const isIdle = turns.length === 0 && !loading;

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[50vh]">
      {/* ── Content Area (Headline + Results + Loading) ── */}
      <div className="flex-grow">
        {/* ── Hero headline (idle only) ── */}
        {isIdle && (
          <div className="text-center mb-10 py-12 animate-in fade-in duration-700">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none italic mb-3">
              {copy.headline}<span className="text-primary not-italic">.</span>
            </h2>
            <p className="text-sm text-muted-foreground/60 max-w-md mx-auto font-medium leading-relaxed">
              {copy.sub}
            </p>
          </div>
        )}

        {/* ── Results ── */}
        {turns.length > 0 && (
          <div ref={resultRef} className="space-y-6 pb-12">
            {turns.map(turn => (
              <TurnView key={turn.id} turn={turn} onSuggestion={submit} />
            ))}
          </div>
        )}

        {/* ── Loading indicator ── */}
        {loading && (
          <div className="flex items-center justify-center gap-2 mb-12 animate-in fade-in duration-300">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Fixed Bottom Bar Area ── */}
      <div className="sticky bottom-0 z-20 pt-12 pb-8 bg-gradient-to-t from-background via-background/95 to-transparent">
        
        {/* ── Chips (idle only, now at bottom) ── */}
        {isIdle && (
          <div className="flex flex-wrap justify-center gap-2 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {copy.chips.map(chip => (
              <button
                key={chip.query}
                onClick={() => submit(chip.query)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/30 bg-muted/10 text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all hover:scale-[1.03] active:scale-95"
              >
                <span>{chip.emoji}</span>
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Input pod ── */}
        <div className={cn(
          'relative group rounded-[2.5rem] border bg-card/60 dark:bg-card/40 backdrop-blur-3xl',
          'border-border/40 shadow-2xl transition-all duration-500',
          'focus-within:border-primary/50 focus-within:shadow-primary/10',
          'hover:border-primary/20',
        )}>
          <textarea
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={copy.placeholder}
            rows={1}
            disabled={loading}
            className={cn(
              'w-full resize-none bg-transparent px-6 pt-5 pb-16',
              'text-base font-medium placeholder:text-muted-foreground/30',
              'focus:outline-none overflow-hidden',
              loading && 'opacity-50 pointer-events-none',
            )}
          />

          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
            {/* Reset */}
            {turns.length > 0 && !loading && (
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-all text-[11px] font-black uppercase tracking-widest"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {copy.reset}
              </button>
            )}
            {turns.length === 0 && <span />}

            {/* Send */}
            <button
              onClick={() => submit(query)}
              disabled={loading || query.trim().length < 2}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-2xl transition-all duration-300',
                'bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-[0.2em]',
                'hover:opacity-90 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-95',
                'disabled:opacity-10 disabled:pointer-events-none',
              )}
            >
              {copy.generate}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TurnView ──────────────────────────────────────────────────────────────────

function TurnView({ turn, onSuggestion }: { turn: Turn; onSuggestion: (q: string) => void }) {
  const res = turn.response;
  const cards = res?.cards ?? [];
  const suggestions = res?.suggestions ?? [];

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* User query bubble */}
      <div className="flex justify-end">
        <div className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-primary text-primary-foreground text-sm font-medium">
          {turn.query}
        </div>
      </div>

      {/* Error */}
      {turn.error && (
        <p className="text-sm text-rose-500 font-semibold px-1">{turn.error}</p>
      )}

      {/* Loading skeleton for this turn */}
      {!res && !turn.error && (
        <div className="space-y-2 animate-pulse px-1">
          <div className="h-4 bg-muted/30 rounded-xl w-3/4" />
          <div className="h-4 bg-muted/20 rounded-xl w-1/2" />
        </div>
      )}

      {/* Response text */}
      {res?.text && (
        <div className="px-1">
          <div className="rounded-2xl rounded-tl-sm bg-muted/30 px-4 py-3 text-sm leading-relaxed">
            <FormattedText text={res.text} />
          </div>
        </div>
      )}

      {/* Cards */}
      {cards.length > 0 && (
        <div className="px-1">
          <ChatCardsGrid cards={cards} />
        </div>
      )}

      {/* Chef tip callout */}
      {res?.chef_tip && (
        <div className="px-1">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 px-4 py-2.5 text-sm text-amber-900 dark:text-amber-200/90 font-medium leading-relaxed">
            {res.chef_tip}
          </div>
        </div>
      )}

      {/* Suggestion buttons */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestion(s.query)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary/20 bg-primary/5 text-xs font-semibold text-primary hover:bg-primary/10 hover:border-primary/40 transition-all hover:scale-[1.03] active:scale-95"
            >
              {s.emoji && <span>{s.emoji}</span>}
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Reason (explainability) */}
      {res?.reason && (
        <p className="text-[10px] text-muted-foreground/40 px-2">↳ {res.reason}</p>
      )}
    </div>
  );
}

// ── FormattedText ─────────────────────────────────────────────────────────────

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part.split('\n').map((line, j) => (
          <span key={`${i}-${j}`}>
            {j > 0 && <br />}
            {line}
          </span>
        ));
      })}
    </>
  );
}
