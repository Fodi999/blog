'use client';

/**
 * ChefOSChat — ChatGPT-style chat UI for ChefOS.
 *
 * ✅ Typewriter text reveal (character-by-character)
 * ✅ Cards cascade-in after text finishes
 * ✅ Coach message with fade-in
 * ✅ Blinking cursor while typing
 * ✅ Smooth auto-scroll
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { Send, Bot, RotateCcw, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { postChat, type ChatApiResponse, type SessionContext } from '@/lib/chef-chat-api';
import { ChatCardsGrid } from './ChatCards';
import { useTypewriter } from '@/hooks/useTypewriter';

// ── Message shape ─────────────────────────────────────────────────────────────

type Role = 'user' | 'bot';

interface Message {
  id: number;
  role: Role;
  text?: string;
  response?: ChatApiResponse;
  /** Mark old messages so they skip animation */
  animated?: boolean;
}

// ── Locale → starter prompts ──────────────────────────────────────────────────

const STARTERS: Record<string, string[]> = {
  ru: ['что полезного поесть', 'сколько калорий в лососе', 'идея для ужина', '200 грамм в ложках'],
  en: ['healthy food ideas', 'calories in salmon', 'dinner idea', 'convert 200g to tablespoons'],
  pl: ['zdrowy produkt', 'kalorie łososia', 'pomysł na obiad', 'przelicz 200g na łyżki'],
  uk: ['що корисного з\'їсти', 'калорії лосося', 'ідея на вечерю', '200 грамів в ложках'],
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ChefOSChat() {
  const locale = useLocale();
  const starters = STARTERS[locale] ?? STARTERS.en;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<SessionContext>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const idRef = useRef(0);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // Mark all existing bot messages as already animated
    setMessages(prev => prev.map(m => ({ ...m, animated: true })));

    const userMsg: Message = { id: ++idRef.current, role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await postChat(trimmed, context);
      const botMsg: Message = { id: ++idRef.current, role: 'bot', response: res, animated: false };
      setMessages(prev => [...prev, botMsg]);
      setContext(res.context ?? {});
    } catch {
      const errMsg: Message = {
        id: ++idRef.current,
        role: 'bot',
        response: {
          text: locale === 'ru' ? 'Ошибка соединения. Попробуй ещё раз.' : 'Connection error. Please try again.',
          context: {},
        },
        animated: false,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, context, locale]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const reset = () => {
    setMessages([]);
    setContext({});
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex flex-col h-full min-h-[500px] max-h-[700px]">

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 scroll-smooth">
        {/* Empty state — starter chips */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-6 pt-8 text-center animate-in fade-in duration-500">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20">
              <Bot className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">ChefOS</p>
              <p className="text-xs text-muted-foreground mt-1">
                {locale === 'ru' ? 'Твой кулинарный ИИ-помощник' :
                 locale === 'pl' ? 'Twój kulinarny asystent AI' :
                 locale === 'uk' ? 'Твій кулінарний ШІ-помічник' :
                 'Your AI culinary assistant'}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {starters.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border/60 bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} onSuggestion={send} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2 items-center px-1 animate-in fade-in duration-300">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 shrink-0">
              <Bot className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="flex gap-1 items-center h-7 px-3 rounded-2xl bg-muted/40">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="border-t border-border/50 p-3">
        <div className="flex gap-2 items-end">
          {messages.length > 0 && (
            <button
              onClick={reset}
              className="shrink-0 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              title="Reset chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
            placeholder={
              locale === 'ru' ? 'Спроси меня что-нибудь…' :
              locale === 'pl' ? 'Zapytaj mnie coś…' :
              locale === 'uk' ? 'Запитай мене щось…' :
              'Ask me anything…'
            }
            className={cn(
              'flex-1 resize-none rounded-xl border border-border/60 bg-background/60 px-3 py-2',
              'text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40',
              'min-h-[38px] max-h-[120px] overflow-y-auto transition-colors',
              loading && 'opacity-50',
            )}
            style={{ height: 38 }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className={cn(
              'shrink-0 p-2 rounded-xl transition-all',
              input.trim() && !loading
                ? 'bg-primary text-primary-foreground shadow-md hover:opacity-90'
                : 'bg-muted/40 text-muted-foreground cursor-not-allowed',
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg, onSuggestion }: { msg: Message; onSuggestion?: (q: string) => void }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end px-1 animate-in slide-in-from-right-4 fade-in duration-300">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2 text-sm shadow-md">
          {msg.text}
        </div>
      </div>
    );
  }

  return <BotBubble msg={msg} onSuggestion={onSuggestion} />;
}

// ── BotBubble — with typewriter + cascade ─────────────────────────────────────

function BotBubble({ msg, onSuggestion }: { msg: Message; onSuggestion?: (q: string) => void }) {
  const res = msg.response;
  const cards = res?.cards ?? [];
  const suggestions = res?.suggestions ?? [];
  const shouldAnimate = !msg.animated;

  // Typewriter for main text
  const { displayed, isTyping, skip } = useTypewriter(
    res?.text ?? '',
    18,
    shouldAnimate,
  );

  // Show cards after text finishes typing
  const [showCards, setShowCards] = useState(!shouldAnimate);
  const [showExtras, setShowExtras] = useState(!shouldAnimate);

  useEffect(() => {
    if (!isTyping && shouldAnimate) {
      // Cards appear 200ms after text finishes
      const t1 = setTimeout(() => setShowCards(true), 200);
      // Coach + suggestions 400ms after
      const t2 = setTimeout(() => setShowExtras(true), cards.length > 0 ? 600 : 300);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isTyping, shouldAnimate, cards.length]);

  // Auto-scroll while typing
  const bubbleRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isTyping) {
      bubbleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [displayed, isTyping]);

  return (
    <div ref={bubbleRef} className="flex gap-2 items-start px-1 animate-in fade-in slide-in-from-left-4 duration-300">
      {/* Avatar */}
      <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 mt-0.5">
        <Bot className="w-4 h-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {/* Text with typewriter effect */}
        {(res?.text) && (
          <div
            className="rounded-2xl rounded-tl-sm bg-muted/40 px-4 py-2.5 text-sm leading-relaxed cursor-pointer"
            onClick={isTyping ? skip : undefined}
          >
            <FormattedText text={displayed} />
            {isTyping && <span className="inline-block w-0.5 h-4 bg-foreground/70 ml-0.5 animate-pulse align-text-bottom" />}
          </div>
        )}

        {/* Cards — cascade in */}
        {showCards && cards.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            <ChatCardsGrid cards={cards} />
          </div>
        )}

        {/* Chef tip callout */}
        {showExtras && res?.chef_tip && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 px-4 py-2.5 text-sm text-amber-900 dark:text-amber-200/90 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">
            💡 {res.chef_tip}
          </div>
        )}

        {/* Coach motivator message */}
        {showExtras && res?.coach_message && (
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-500/10 px-4 py-2.5 text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2 mb-1">
              <ChefHat className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                Coach
              </span>
            </div>
            <p className="text-purple-900 dark:text-purple-200/90 font-medium">
              {res.coach_message}
            </p>
          </div>
        )}

        {/* Suggestion buttons — appear last */}
        {showExtras && suggestions.length > 0 && onSuggestion && (
          <div className="flex flex-wrap gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestion(s.query)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/5 text-xs font-semibold text-primary hover:bg-primary/10 hover:border-primary/40 transition-all hover:scale-[1.03] active:scale-95"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {s.emoji && <span>{s.emoji}</span>}
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Reason tag + timing */}
        {showExtras && (res?.reason || res?.timing_ms) && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 pl-1 animate-in fade-in duration-500">
            {res?.reason && <span>↳ {res.reason}</span>}
            {res?.timing_ms != null && <span>• {res.timing_ms}ms</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FormattedText — bold via **text** ─────────────────────────────────────────

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
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
