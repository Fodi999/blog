'use client';

/**
 * AISousChef — the HERO product.
 *
 * 2 states:
 *   1. Empty (ChatGPT-style) — centered headline + chips + input
 *   2. Active — chat thread + sticky input at bottom
 *
 * Input → POST /public/chat → cards[] + text
 * The Rust backend decides what to return.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { Send, RotateCcw, Sparkles, Bot, User, Target, Dumbbell, Zap, Leaf, BookOpen, ClipboardList, RefreshCcw } from 'lucide-react';
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
  features: string[];
}> = {
  ru: {
    headline: 'AI Sous-Chef',
    sub: 'Напиши цель — получи продукты, рецепты, калории. Всё через один AI.',
    placeholder: 'Хочу похудеть / что из курицы / 200г в ложках…',
    chips: [
      { emoji: '🟢', label: 'Хочу похудеть',     query: 'хочу похудеть' },
      { emoji: '💪', label: 'Много белка',        query: 'что съесть для набора мышц' },
      { emoji: '⚡', label: 'Быстрый ужин',       query: 'быстрый ужин' },
      { emoji: '🥗', label: 'Полезные продукты',  query: 'что полезного поесть' },
    ],
    generate: 'Спросить',
    reset: 'Новый запрос',
    errorFallback: 'Ошибка соединения. Попробуй ещё раз.',
    features: [
      'Подбор рецептов по цели',
      'Расчёт калорий и БЖУ',
      'Конвертация граммов и ложек',
      'Анализ ингредиентов',
    ],
  },
  en: {
    headline: 'AI Sous-Chef',
    sub: 'Describe your goal — get products, recipes, nutrition. One AI, every scenario.',
    placeholder: 'I want to lose weight / chicken ideas / convert 200g…',
    chips: [
      { emoji: '🟢', label: 'Lose weight',    query: 'I want to lose weight' },
      { emoji: '💪', label: 'High protein',   query: 'high protein meal ideas' },
      { emoji: '⚡', label: 'Quick dinner',   query: 'quick dinner idea' },
      { emoji: '🥗', label: 'Healthy picks',  query: 'healthy food ideas' },
    ],
    generate: 'Ask',
    reset: 'New chat',
    errorFallback: 'Connection error. Please try again.',
    features: [
      'Recipe suggestions by goal',
      'Calorie & macro calculation',
      'Unit conversion (g ↔ spoons)',
      'Ingredient deep analysis',
    ],
  },
  pl: {
    headline: 'AI Sous-Chef',
    sub: 'Opisz cel — otrzymaj produkty, przepisy, makroskładniki. Jeden AI, każdy scenariusz.',
    placeholder: 'Chcę schudnąć / co z kurczaka / przelicz 200g…',
    chips: [
      { emoji: '🟢', label: 'Chcę schudnąć',      query: 'chcę schudnąć' },
      { emoji: '💪', label: 'Dużo białka',         query: 'dużo białka co jeść' },
      { emoji: '⚡', label: 'Szybkie danie',       query: 'szybkie danie na obiad' },
      { emoji: '🥗', label: 'Zdrowe produkty',     query: 'zdrowe produkty' },
    ],
    generate: 'Zapytaj',
    reset: 'Nowe pytanie',
    errorFallback: 'Błąd połączenia. Spróbuj jeszcze raz.',
    features: [
      'Dobór przepisów pod cel',
      'Obliczanie kalorii i makro',
      'Przeliczanie gramów i łyżek',
      'Analiza składników',
    ],
  },
  uk: {
    headline: 'AI Sous-Chef',
    sub: 'Опиши мету — отримай продукти, рецепти, калорії. Один AI, будь-який сценарій.',
    placeholder: 'Хочу схуднути / що з курки / 200г в ложках…',
    chips: [
      { emoji: '🟢', label: 'Хочу схуднути',     query: 'хочу схуднути' },
      { emoji: '💪', label: 'Багато білка',       query: 'що їсти для набору м\'язів' },
      { emoji: '⚡', label: 'Швидка вечеря',     query: 'швидка вечеря' },
      { emoji: '🥗', label: 'Корисні продукти',  query: 'що корисного з\'їсти' },
    ],
    generate: 'Запитати',
    reset: 'Новий запит',
    errorFallback: 'Помилка з\'єднання. Спробуй ще раз.',
    features: [
      'Підбір рецептів за метою',
      'Розрахунок калорій та БЖВ',
      'Конвертація грамів та ложок',
      'Аналіз інгредієнтів',
    ],
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
  const bottomRef = useRef<HTMLDivElement>(null);

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

  // Scroll to bottom on new turn
  useEffect(() => {
    if (turns.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
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
  const canSend = !loading && query.trim().length >= 2;

  return (
    <div className="flex flex-col min-h-[60vh] max-w-4xl mx-auto relative px-4">
      
      {/* ── Background Decorative Glows ── */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[30%] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[40%] bg-primary/10 blur-[100px] rounded-full" />
      </div>

      {/* ═══════════════════════════════════════════════════════
          STATE 1: EMPTY — ChatGPT-style centered welcome
          ═══════════════════════════════════════════════════════ */}
      {isIdle && (
        <div className="flex-1 flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in-95 duration-1000">
          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter leading-none italic mb-4 text-center">
            {copy.headline}<span className="text-primary not-italic">.</span>
          </h2>
          <p className="text-base text-muted-foreground/60 max-w-lg mx-auto font-medium leading-relaxed text-center mb-10">
            {copy.sub}
          </p>

          {/* Chips */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {copy.chips.map(chip => (
              <button
                key={chip.query}
                onClick={() => submit(chip.query)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all",
                  "border-border/30 bg-card/40 backdrop-blur-sm text-muted-foreground",
                  "hover:text-primary hover:border-primary/40 hover:bg-primary/5 hover:shadow-xl hover:shadow-primary/5",
                  "hover:scale-[1.03] active:scale-95",
                )}
              >
                <div className="shrink-0">
                  {chip.emoji === '🟢' && <Target className="h-4 w-4 text-emerald-500" />}
                  {chip.emoji === '💪' && <Dumbbell className="h-4 w-4 text-sky-500" />}
                  {chip.emoji === '⚡' && <Zap className="h-4 w-4 text-amber-400" />}
                  {chip.emoji === '🥗' && <Leaf className="h-4 w-4 text-lime-500" />}
                </div>
                {chip.label}
              </button>
            ))}
          </div>

          {/* SEO features */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[10px] text-muted-foreground/30 font-bold uppercase tracking-widest">
            {copy.features.map((feat, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary/20" />
                {feat}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          STATE 2: ACTIVE — chat thread
          ═══════════════════════════════════════════════════════ */}
      {!isIdle && (
        <div className="flex-1 pb-4 space-y-6 pt-8">
          {turns.map(turn => (
            <TurnView key={turn.id} turn={turn} onSuggestion={submit} />
          ))}

          {/* Loading dots */}
          {loading && (
            <div className="flex items-center gap-4 px-2 animate-in fade-in duration-300">
              <div className="w-8 h-8 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-muted/10">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          INPUT BAR — always at bottom, always prominent
          ═══════════════════════════════════════════════════════ */}
      <div className={cn(
        "sticky bottom-0 z-20 pt-8 pb-4 bg-gradient-to-t from-background via-background/95 to-transparent transition-all duration-500",
        isIdle ? "mt-4" : "mt-8"
      )}>
        <div className={cn(
          'relative rounded-[2rem] border-2 transition-all duration-500 ease-out',
          'bg-white/80 dark:bg-card/80 backdrop-blur-3xl',
          canSend ? 'border-primary/30 shadow-[0_20px_50px_-12px_rgba(239,68,68,0.15)]' : 'border-border/40 shadow-xl',
          'focus-within:border-primary/50 focus-within:shadow-[0_25px_60px_-12px_rgba(239,68,68,0.2)]',
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
              'w-full resize-none bg-transparent px-8 pt-6 pb-20 sm:pb-16 sm:pr-48',
              'text-lg font-medium placeholder:text-muted-foreground/30',
              'focus:outline-none overflow-hidden transition-all',
              loading && 'opacity-50 pointer-events-none',
            )}
          />

          {/* Action Row */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
            {/* Reset button or branding */}
            <div className="flex items-center gap-2 pl-4">
              {turns.length > 0 && !loading ? (
                <button
                  onClick={reset}
                  className="flex items-center gap-2 pr-4 py-2 rounded-xl text-muted-foreground/40 hover:text-primary transition-all text-xs font-bold uppercase tracking-widest"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {copy.reset}
                </button>
              ) : null}
            </div>

            {/* Send button */}
            <button
              onClick={() => submit(query)}
              disabled={!canSend}
              className={cn(
                'group flex items-center gap-3 px-8 py-3.5 rounded-2xl transition-all duration-500',
                'font-black text-xs uppercase tracking-[0.14em]',
                canSend
                  ? 'bg-primary text-primary-foreground shadow-[0_10px_20px_-5px_rgba(239,68,68,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(239,68,68,0.4)] hover:-translate-y-1 active:scale-95'
                  : 'bg-muted/40 text-muted-foreground/20 cursor-not-allowed',
              )}
            >
              <span className="relative z-10 transition-transform group-hover:translate-x-0.5">{copy.generate}</span>
              <Send className={cn(
                "w-4 h-4 relative z-10 transition-transform",
                canSend && "group-hover:translate-x-1 group-hover:-translate-y-0.5"
              )} />
              {/* Optional glow effect on button hover */}
              {canSend && <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </button>
          </div>
        </div>
        
        {/* Footer info (mobile friendly) */}
        <div className="mt-4 text-center">
            <p className="text-[10px] text-muted-foreground/20 font-medium uppercase tracking-widest sm:hidden">
                AI Sous-Chef v2.6.4
            </p>
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700 ease-out fill-mode-both">
      {/* ── User message ── */}
      <div className="flex items-start gap-4 justify-end">
        <div className="max-w-[85%] sm:max-w-[75%] px-6 py-4 rounded-3xl rounded-br-lg bg-[#ef4444] text-white text-sm sm:text-base font-semibold leading-relaxed shadow-lg shadow-primary/5">
          {turn.query}
        </div>
        <div className="w-9 h-9 rounded-xl bg-card border border-border/40 flex items-center justify-center shrink-0 mt-1 shadow-sm">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {/* ── Error ── */}
      {turn.error && (
        <div className="flex items-center gap-3 px-2 text-rose-500">
           <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
           <p className="text-sm font-bold uppercase tracking-wide">{turn.error}</p>
        </div>
      )}

      {/* ── Loading skeleton handled by state ── */}

      {/* ── AI Response ── */}
      {(res?.text || (!res && !turn.error)) && (
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1 shadow-sm">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 space-y-4">
            {res?.text ? (
              <div className="max-w-[90%] rounded-3xl rounded-tl-lg bg-card/60 backdrop-blur-md border border-border/30 px-6 py-4 text-sm sm:text-base leading-relaxed text-foreground shadow-sm">
                <FormattedText text={res.text} />
              </div>
            ) : (
                <div className="space-y-3 pt-3">
                    <div className="h-4 bg-muted/20 rounded-full w-3/4 animate-pulse" />
                    <div className="h-4 bg-muted/10 rounded-full w-1/2 animate-pulse" />
                </div>
            )}

            {/* ── Cards ── */}
            {cards.length > 0 && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500 delay-150 fill-mode-both">
                <ChatCardsGrid cards={cards} />
              </div>
            )}

            {/* ── Chef tip ── */}
            {res?.chef_tip && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-500 delay-300 fill-mode-both">
                <div className="group relative rounded-2xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 px-6 py-4 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/40" />
                    <p className="text-sm text-amber-900/80 dark:text-amber-200/90 font-semibold leading-relaxed">
                        <span className="mr-2">💡</span>
                        {res.chef_tip}
                    </p>
                </div>
              </div>
            )}

            {/* ── Suggestions ── */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in duration-500 delay-500 fill-mode-both">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSuggestion(s.query)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all",
                        "border-primary/10 bg-primary/5 text-xs font-bold text-primary",
                        "hover:bg-primary/10 hover:border-primary/30 hover:scale-[1.03] active:scale-95"
                    )}
                  >
                    {s.emoji && (
                      <div className="shrink-0">
                        {s.emoji === '📖' && <BookOpen className="h-3.5 w-3.5" />}
                        {s.emoji === '📋' && <ClipboardList className="h-3.5 w-3.5" />}
                        {s.emoji === '🔄' && <RefreshCcw className="h-3.5 w-3.5" />}
                        {!['📖', '📋', '🔄'].includes(s.emoji) && <span className="text-sm">{s.emoji}</span>}
                      </div>
                    )}
                    <span className="uppercase tracking-wide">{s.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Reason ── */}
            {res?.reason && (
              <p className="text-[10px] text-muted-foreground/20 font-black uppercase tracking-[0.2em] pl-2 pt-2">
                ↳ Processing: {res.reason}
              </p>
            )}
          </div>
        </div>
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
