'use client';

/**
 * AISousChef — the HERO product.
 *
 * Redesigned: premium kitchen instrument / command center feel.
 *
 * 2 states:
 *   1. Idle  — ChefOS branding + headline + action cards + heavy input
 *   2. Active — chat thread + coach messages + sticky input
 *
 * Input → POST /public/chat → cards[] + text + coach_message
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Send, Sparkles, Bot, User, Zap,
  BookOpen, ClipboardList, RefreshCcw, Search, Database, Wrench,
  Scale, Fish, FlaskConical, Calculator, Utensils, BarChart3,
  Salad, Microscope, Trophy, ArrowRight, ChefHat,
  Lightbulb, Timer, CookingPot, Leaf, Heart, Hand,
  Flame, Dumbbell, Droplets, Wheat, Clock, UtensilsCrossed,
  Beef, Egg, Carrot, Apple,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { postChat, type ChatApiResponse, type SessionContext } from '@/lib/chef-chat-api';
import { ChatCardsGrid } from '@/components/chat/ChatCards';
import { useTypewriter } from '@/hooks/useTypewriter';

// ── Tool Data ──────────────────────────────────────────────────────────

type ToolItem = {
  href: string;
  icon: any;
  key: string;
};

const QUICK_ACTIONS: {
  icon: any;
  key: string;
  query: Record<string, string>;
  gradient: string;
}[] = [
  {
    icon: FlaskConical,
    key: 'createRecipe',
    query: {
      ru: 'создай рецепт из курицы',
      en: 'create a chicken recipe',
      pl: 'stwórz przepis z kurczaka',
      uk: 'створи рецепт з курки',
    },
    gradient: 'from-rose-500/10 to-orange-500/10 hover:from-rose-500/20 hover:to-orange-500/20',
  },
  {
    icon: Calculator,
    key: 'analyzeRecipe',
    query: {
      ru: 'рассчитай калории для блюда',
      en: 'analyze food cost for a dish',
      pl: 'oblicz koszt potrawy',
      uk: 'розрахуй калорії для страви',
    },
    gradient: 'from-violet-500/10 to-blue-500/10 hover:from-violet-500/20 hover:to-blue-500/20',
  },
  {
    icon: Search,
    key: 'checkIngredient',
    query: {
      ru: 'расскажи про авокадо',
      en: 'tell me about avocado',
      pl: 'opowiedz o awokado',
      uk: 'розкажи про авокадо',
    },
    gradient: 'from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20',
  },
  {
    icon: Scale,
    key: 'convertUnits',
    query: {
      ru: '200 граммов муки в ложках',
      en: 'convert 200g flour to spoons',
      pl: 'przelicz 200g mąki na łyżki',
      uk: '200 грамів борошна в ложках',
    },
    gradient: 'from-sky-500/10 to-cyan-500/10 hover:from-sky-500/20 hover:to-cyan-500/20',
  },
];

const DATABASE_TOOLS: ToolItem[] = [
  { href: '/chef-tools/ingredients',          icon: Search,      key: 'ingredients'         },
  { href: '/chef-tools/ingredient-analyzer',  icon: Microscope,  key: 'ingredientAnalyzer'  },
  { href: '/chef-tools/fish-season',          icon: Fish,        key: 'fishSeason'          },
];

const UTILITY_TOOLS: ToolItem[] = [
  { href: '/chef-tools/converter',            icon: Scale,       key: 'converter'           },
  { href: '/chef-tools/nutrition',            icon: BarChart3,   key: 'nutrition'           },
  { href: '/chef-tools/ranking/protein',      icon: Trophy,      key: 'ranking'             },
  { href: '/chef-tools/diet/vegan',           icon: Salad,       key: 'diet'                },
];

// ── Locale copy ────────────────────────────────────────────────────────────────

const COPY: Record<string, {
  headline: string;
  sub: string;
  placeholder: string;
  errorFallback: string;
}> = {
  ru: {
    headline: 'Что нужно на кухне сегодня?',
    sub: 'Подбирай рецепты, считай калории, конвертируй единицы — всё через один AI.',
    placeholder: 'Введите команду шефу…',
    errorFallback: 'Ошибка соединения. Попробуй ещё раз.',
  },
  en: {
    headline: 'What do you need in the kitchen today?',
    sub: 'Recipes, calories, conversions, ingredient intel — one AI, every scenario.',
    placeholder: 'Type a command for the chef…',
    errorFallback: 'Connection error. Please try again.',
  },
  pl: {
    headline: 'Czego potrzebujesz w kuchni?',
    sub: 'Przepisy, kalorie, przeliczniki, składniki — jeden AI na każdy scenariusz.',
    placeholder: 'Wpisz polecenie dla szefa…',
    errorFallback: 'Błąd połączenia. Spróbuj jeszcze raz.',
  },
  uk: {
    headline: 'Що потрібно на кухні сьогодні?',
    sub: 'Рецепти, калорії, конвертація, аналіз — один AI на кожен сценарій.',
    placeholder: 'Введіть команду шефу…',
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
  const t = useTranslations('chefTools');
  const copy = COPY[locale] ?? COPY.en;

  const [activeTab, setActiveTab] = useState<'chat' | 'database' | 'tools'>('chat');
  const [query, setQuery] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<SessionContext>({});
  const idRef = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomMarkerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [inputBarHeight, setInputBarHeight] = useState(180);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [query]);

  // Focus on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Measure input bar height dynamically to prevent overlap
  useEffect(() => {
    const el = inputContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setInputBarHeight(entry.contentRect.height + 32); // add some safety margin
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── ChatGPT-style auto-scroll ──────────────────────────────────────
  // Strategy: always scroll to bottom UNLESS the user explicitly scrolls
  // up (detected via wheel / touchmove events — not via scroll position,
  // which creates false positives when content grows).
  const stickyRef = useRef(true);          // "should we auto-scroll?"
  const rafId = useRef(0);

  const scrollToBottom = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      bottomMarkerRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    });
  }, []);

  // Detect user scrolling UP → pause auto-scroll
  // Detect user scrolling DOWN to bottom → resume auto-scroll
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < -5) {
        // scrolling UP → user wants to read history
        stickyRef.current = false;
      } else if (e.deltaY > 5) {
        // scrolling DOWN → check if they reached the bottom
        const gap = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
        if (gap < 80) stickyRef.current = true;
      }
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchY - e.touches[0].clientY; // positive = scroll down
      touchY = e.touches[0].clientY;
      if (dy < -10) {
        stickyRef.current = false;
      } else if (dy > 10) {
        const gap = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
        if (gap < 80) stickyRef.current = true;
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  // Auto-scroll whenever the chat content area changes size
  // (typewriter text, cards loading, etc.)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (stickyRef.current) scrollToBottom();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [scrollToBottom]);

  // When a new turn appears, force-stick and scroll
  useEffect(() => {
    if (turns.length > 0) {
      stickyRef.current = true;
      scrollToBottom();
      setTimeout(scrollToBottom, 120);
    }
  }, [turns.length, scrollToBottom]);

  const submit = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;

    const id = ++idRef.current;
    stickyRef.current = true; // Always force auto-scroll on new message
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
    idRef.current = 0;
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const isIdle = turns.length === 0 && !loading;
  const canSend = !loading && query.trim().length >= 2;

  return (
    <div className="flex flex-col max-w-5xl mx-auto relative px-4">

      {/* ── Background: subtle dot grid (kitchen steel feel) ── */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-[10%] left-[15%] w-[50%] h-[40%] bg-primary/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[15%] right-[10%] w-[35%] h-[35%] bg-violet-500/5 blur-[120px] rounded-full" />
      </div>

      {/* ── ChefOS Identity Badge ── */}
      <div className="flex items-center justify-center pt-4 mb-2">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-border/30 bg-card/50 backdrop-blur-xl">
          <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ChefHat className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-foreground/70">
            ChefOS
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-muted-foreground/40">
            /
          </span>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary/60">
            AI Sous-Chef
          </span>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex items-center justify-center mb-6 sm:mb-8">
        <div className="flex p-1 rounded-2xl bg-secondary/30 border border-border/40 backdrop-blur-xl max-w-full overflow-x-auto no-scrollbar">
          {[
            { id: 'chat',     icon: Sparkles, label: t('landing.sections.ai') },
            { id: 'database', icon: Database, label: t('landing.sections.database') },
            { id: 'tools',    icon: Wrench,   label: t('landing.sections.tools') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-300 shrink-0",
                activeTab === tab.id
                  ? "bg-foreground text-background shadow-xl scale-105 sm:scale-100"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              )}
            >
              <tab.icon className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", activeTab === tab.id ? "text-background" : "text-muted-foreground")} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CONTENT AREA — page scrolls, fixed input island below
          ═══════════════════════════════════════════════════════ */}
      <div ref={scrollRef} className="flex-1">
        {activeTab === 'chat' ? (
          <>
            {/* STATE 1: IDLE — kitchen command center */}
            {isIdle && (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] py-8 sm:py-12 animate-in fade-in zoom-in-95 duration-1000">
                {/* Headline */}
                <div className="text-center space-y-3 mb-10 sm:mb-14">
                  <h2 className="text-2xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1] text-balance px-4">
                    {copy.headline}
                  </h2>
                  <p className="text-sm sm:text-lg text-muted-foreground/50 max-w-lg mx-auto font-medium leading-relaxed px-4">
                    {copy.sub}
                  </p>
                </div>

                {/* Action Cards — clickable prompts that submit to chat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-3xl mb-10">
                  {QUICK_ACTIONS.map(({ icon: Icon, key: toolKey, query: prompts, gradient }) => (
                    <button
                      key={toolKey}
                      onClick={() => submit(prompts[locale] ?? prompts.en)}
                      className={cn(
                        "group relative flex items-start gap-4 text-left p-5 sm:p-6 rounded-2xl border transition-all duration-300",
                        "border-border/40 backdrop-blur-sm",
                        "hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]",
                        "bg-gradient-to-br", gradient,
                      )}
                    >
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-background/60 dark:bg-white/[0.06] border border-border/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground group-hover:text-foreground transition-colors leading-tight">
                          {t(`landing.actions.${toolKey}`)}
                        </p>
                        <p className="text-xs text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors mt-1 leading-relaxed line-clamp-2">
                          {t(`landing.actions.${toolKey}Desc`)}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary shrink-0 mt-1 translate-x-[-6px] group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STATE 2: ACTIVE — chat thread inside scroll box */}
            {!isIdle && (
              <div className="flex-1 pb-4 space-y-8 pt-0 px-1 sm:px-0">
                {/* Reset / New Chat button */}
                <div className="flex justify-center">
                  <button
                    onClick={reset}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/30 bg-card/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-foreground hover:border-primary/30 transition-all"
                  >
                    <RefreshCcw className="w-3 h-3" />
                    {locale === 'ru' ? 'Новый чат' : locale === 'pl' ? 'Nowy czat' : locale === 'uk' ? 'Новий чат' : 'New chat'}
                  </button>
                </div>

                {turns.map(turn => (
                  <TurnView key={turn.id} turn={turn} onSuggestion={submit} locale={locale} />
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
              </div>
            )}

            {/* Marker for auto-scroll and terminal spacing — height matches terminal */}
            <div
              ref={bottomMarkerRef}
              style={{ height: `${inputBarHeight}px` }}
              className="pointer-events-none w-full shrink-0"
            />
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <ToolGrid
              tools={activeTab === 'database' ? DATABASE_TOOLS : UTILITY_TOOLS}
              locale={locale}
              t={t}
              accent={activeTab === 'database' ? 'text-violet-400' : 'text-sky-400'}
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          INPUT BAR — fixed island at the bottom of viewport
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'chat' && (
        <div ref={inputContainerRef} className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className={cn(
            "pointer-events-auto max-w-5xl mx-auto px-4 pt-3 sm:pt-4 pb-4 sm:pb-6",
            "bg-gradient-to-t from-background via-background/98 to-background/80 backdrop-blur-xl",
          )}>
          <div className={cn(
            "relative rounded-2xl sm:rounded-3xl border-2 transition-all duration-500 ease-out overflow-hidden",
            "bg-card/80 border-border/50 shadow-2xl backdrop-blur-xl",
            "dark:bg-[#0a0a0a]/90 dark:border-white/[0.1]",
            "focus-within:border-primary/40 focus-within:shadow-[0_0_60px_-15px_rgba(var(--primary-rgb,239,68,68),0.15)]",
            loading && "opacity-80 pointer-events-none"
          )}>
            {/* Top label inside input */}
            <div className="flex items-center justify-between px-5 sm:px-7 pt-4 pb-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                  {locale === 'ru' ? 'Кухонный терминал' : locale === 'pl' ? 'Terminal kuchenny' : locale === 'uk' ? 'Кухонний термінал' : 'Kitchen Terminal'}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground/25">
                {query.length > 0 ? `${query.length}/1000` : 'v2.6'}
              </span>
            </div>

            <textarea
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={copy.placeholder}
              rows={1}
              disabled={loading}
              className={cn(
                "w-full resize-none bg-transparent px-5 sm:px-7 pt-3 pb-16 sm:pb-18",
                "text-base sm:text-xl font-semibold text-foreground placeholder:text-muted-foreground/30",
                "focus:outline-none overflow-hidden transition-all leading-relaxed"
              )}
            />

            {/* Bottom Action Row */}
            <div className="absolute bottom-4 sm:bottom-5 left-5 sm:left-7 right-5 sm:right-7 flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-5">
                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">
                  Shift+Enter {locale === 'ru' ? 'для новой строки' : 'for new line'}
                </span>
              </div>

              <button
                onClick={() => submit(query)}
                disabled={!canSend}
                className={cn(
                  "flex items-center gap-2.5 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300",
                  canSend
                    ? "bg-foreground text-background hover:scale-105 active:scale-95 shadow-lg shadow-foreground/10"
                    : "bg-muted/50 text-muted-foreground/30 cursor-not-allowed border border-border/30"
                )}
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  {locale === 'ru' ? 'Отправить' : locale === 'pl' ? 'Wyślij' : locale === 'uk' ? 'Надіслати' : 'Send'}
                </span>
              </button>
            </div>
          </div>

          {/* Engine version */}
          {isIdle && (
            <div className="mt-4 text-center animate-in fade-in duration-1000 delay-500 fill-mode-both">
              <p className="text-[10px] text-muted-foreground/15 font-black uppercase tracking-[0.5em]">
                Culinary Intelligence Engine v2.6
              </p>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ToolGrid Component ────────────────────────────────────────────────────────

function ToolGrid({ tools, locale, t, accent }: { tools: ToolItem[]; locale: string; t: any; accent: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-8 px-1 sm:px-0">
      {tools.map(({ href, icon: Icon, key: toolKey }, idx) => (
        <Link
          key={href}
          href={href}
          locale={locale}
          className={cn(
            "group relative",
            idx === 0 && "sm:col-span-2 sm:row-span-1"
          )}
        >
          <div className={cn(
            "relative overflow-hidden h-full rounded-[2rem] p-8 transition-all duration-500",
            "border border-border/40 bg-card/40 backdrop-blur-2xl dark:border-white/5 dark:bg-card/10",
            "hover:border-primary/40 hover:bg-card/60 dark:hover:border-white/20 dark:hover:bg-white/[0.02] hover:shadow-2xl hover:-translate-y-2",
          )}>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                  "bg-muted/50 border border-border/40 dark:bg-white/[0.03] dark:border-white/5 group-hover:scale-110",
                )}>
                  <Icon className={cn("h-6 w-6", accent)} />
                </div>
                {idx === 0 && (
                  <div className={cn("px-4 py-1.5 rounded-full border border-border/40 bg-muted/60 dark:border-white/10 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-foreground dark:text-white/60")}>
                    Featured
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h4 className={cn(
                  "font-bold uppercase tracking-tight italic transition-colors duration-300 text-foreground dark:text-white",
                  idx === 0 ? "text-xl sm:text-2xl mb-3" : "text-base mb-2",
                )}>
                  {t(`toolGrid.${toolKey}`)}
                </h4>
                <p className={cn(
                  "text-muted-foreground/60 font-medium leading-relaxed group-hover:text-muted-foreground transition-colors duration-300",
                  idx === 0 ? "text-sm sm:text-base max-w-md" : "text-[12px] line-clamp-2"
                )}>
                  {t(`toolGrid.${toolKey}Desc`)}
                </p>
              </div>

              <div className={cn("mt-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all duration-500", accent)}>
                {t('open')}
                <ArrowRight className="h-3 w-3 translate-x-[-4px] group-hover:translate-x-0 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── TurnView ──────────────────────────────────────────────────────────────────

function TurnView({ turn, onSuggestion, locale }: {
  turn: Turn;
  onSuggestion: (q: string) => void;
  locale: string;
}) {
  const res = turn.response;
  const cards = res?.cards ?? [];
  const suggestions = res?.suggestions ?? [];
  const isLatest = !!res?.text;

  // Typewriter for latest bot text
  const { displayed: typedText, isTyping } = useTypewriter(res?.text ?? '', 18, isLatest);

  // Scroll is now handled by ResizeObserver in parent —
  // no need for manual scroll calls here.

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 ease-out fill-mode-both">
      {/* ── User message ── */}
      <div className="flex items-start gap-3 sm:gap-4 justify-end">
        <div className={cn(
          "max-w-[90%] sm:max-w-[75%] px-5 sm:px-6 py-3 sm:py-4 rounded-[1.5rem] rounded-br-lg",
          "bg-foreground text-background text-sm sm:text-base font-semibold leading-relaxed shadow-lg"
        )}>
          {turn.query}
        </div>
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-card border border-border/40 flex items-center justify-center shrink-0 mt-1 shadow-sm">
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        </div>
      </div>

      {/* ── Error ── */}
      {turn.error && (
        <div className="flex items-center gap-3 px-2 text-rose-500">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wide">{turn.error}</p>
        </div>
      )}

      {/* ── AI Response ── */}
      {(res?.text || (!res && !turn.error)) && (
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:block sm:mt-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <span className="sm:hidden text-[10px] font-black uppercase tracking-widest text-muted-foreground">ChefOS AI</span>
          </div>

          <div className="flex-1 space-y-4 w-full">
            {res?.text ? (
              <div className="max-w-full sm:max-w-[90%] rounded-[1.5rem] rounded-tl-lg bg-card/60 backdrop-blur-md border border-border/30 px-5 sm:px-6 py-4 text-sm sm:text-base leading-relaxed text-foreground shadow-sm">
                <FormattedText text={typedText} />
                {isTyping && <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />}
              </div>
            ) : (
              <div className="space-y-3 pt-3 w-full max-w-[80%]">
                <div className="h-4 bg-muted/20 rounded-full w-full animate-pulse" />
                <div className="h-4 bg-muted/10 rounded-full w-2/3 animate-pulse" />
              </div>
            )}

            {/* ── Coach Message ── */}
            {res?.coach_message && !isTyping && (
              <div className="animate-in fade-in slide-in-from-left-3 duration-500 delay-200 fill-mode-both">
                <div className="inline-flex items-start gap-3 px-5 py-4 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <ChefHat className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-400/60 block mb-1">Chef Coach</span>
                    <p className="text-sm text-violet-300/90 dark:text-violet-300/80 font-medium leading-relaxed italic">
                      <FormattedText text={res.coach_message} />
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Cards ── */}
            {cards.length > 0 && !isTyping && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500 delay-150 fill-mode-both">
                <ChatCardsGrid cards={cards} />
              </div>
            )}

            {/* ── Chef tip ── */}
            {res?.chef_tip && !isTyping && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-500 delay-300 fill-mode-both">
                <div className="group relative rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 px-6 py-4 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500" />
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <p className="text-sm text-amber-900/80 dark:text-amber-200/90 font-semibold leading-relaxed">
                      <FormattedText text={res.chef_tip} />
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Suggestions ── */}
            {suggestions.length > 0 && !isTyping && (
              <div className="flex flex-wrap gap-2 pt-3 animate-in fade-in duration-500 delay-500 fill-mode-both">
                {suggestions.map((s, i) => {
                  // Strip known emoji from label text to avoid duplication
                  const cleanLabel = s.label.replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim();
                  return (
                    <button
                      key={i}
                      onClick={() => onSuggestion(s.query)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200",
                        "border-border/30 bg-card/40 backdrop-blur-sm text-xs font-bold text-foreground/80",
                        "hover:bg-primary/10 hover:border-primary/30 hover:text-primary hover:scale-[1.03] active:scale-95",
                        "shadow-sm"
                      )}
                    >
                      <SuggestionIcon emoji={s.emoji} />
                      <span className="uppercase tracking-wide">{cleanLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Reason ── */}
            {res?.reason && !isTyping && (
              <p className="text-[10px] text-muted-foreground/20 font-black uppercase tracking-[0.2em] pl-2 pt-2">
                ↳ {res.reason}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Emoji → Icon map ──────────────────────────────────────────────────────────

const EMOJI_ICON_MAP: Record<string, { icon: any; color: string }> = {
  '🍽': { icon: UtensilsCrossed, color: 'text-orange-400' },
  '🍽️': { icon: UtensilsCrossed, color: 'text-orange-400' },
  '⚖️': { icon: Scale, color: 'text-blue-400' },
  '⚖': { icon: Scale, color: 'text-blue-400' },
  '👨‍🍳': { icon: ChefHat, color: 'text-violet-400' },
  '👨🍳': { icon: ChefHat, color: 'text-violet-400' },
  '🧑‍🍳': { icon: ChefHat, color: 'text-violet-400' },
  '👩‍🍳': { icon: ChefHat, color: 'text-violet-400' },
  '🎩': { icon: ChefHat, color: 'text-violet-400' },
  '⏱': { icon: Clock, color: 'text-sky-400' },
  '⏱️': { icon: Clock, color: 'text-sky-400' },
  '⏰': { icon: Clock, color: 'text-sky-400' },
  '🕐': { icon: Clock, color: 'text-sky-400' },
  '📊': { icon: BarChart3, color: 'text-emerald-400' },
  '💡': { icon: Lightbulb, color: 'text-amber-400' },
  '🍳': { icon: CookingPot, color: 'text-orange-400' },
  '🔄': { icon: RefreshCcw, color: 'text-blue-400' },
  '📖': { icon: BookOpen, color: 'text-indigo-400' },
  '📋': { icon: ClipboardList, color: 'text-teal-400' },
  '🥩': { icon: Beef, color: 'text-red-400' },
  '🥦': { icon: Leaf, color: 'text-green-400' },
  '🍚': { icon: Wheat, color: 'text-amber-400' },
  '🥚': { icon: Egg, color: 'text-yellow-400' },
  '🥕': { icon: Carrot, color: 'text-orange-400' },
  '🍎': { icon: Apple, color: 'text-red-400' },
  '🌿': { icon: Leaf, color: 'text-emerald-400' },
  '🥗': { icon: Salad, color: 'text-green-400' },
  '🥬': { icon: Leaf, color: 'text-green-400' },
  '🍗': { icon: Beef, color: 'text-amber-400' },
  '🍖': { icon: Beef, color: 'text-red-400' },
  '🐟': { icon: Fish, color: 'text-blue-400' },
  '🐠': { icon: Fish, color: 'text-cyan-400' },
  '🍲': { icon: CookingPot, color: 'text-orange-400' },
  '🍱': { icon: UtensilsCrossed, color: 'text-amber-400' },
  '💪': { icon: Dumbbell, color: 'text-blue-400' },
  '🔥': { icon: Flame, color: 'text-orange-500' },
  '❤️': { icon: Heart, color: 'text-rose-400' },
  '❤': { icon: Heart, color: 'text-rose-400' },
  '🌟': { icon: Sparkles, color: 'text-yellow-400' },
  '⭐': { icon: Sparkles, color: 'text-yellow-400' },
  '✨': { icon: Sparkles, color: 'text-purple-400' },
  '👋': { icon: Hand, color: 'text-amber-400' },
  '✅': { icon: Sparkles, color: 'text-emerald-400' },
  '🏆': { icon: Trophy, color: 'text-yellow-400' },
  '📌': { icon: Zap, color: 'text-red-400' },
  '🎂': { icon: UtensilsCrossed, color: 'text-pink-400' },
  '🍰': { icon: UtensilsCrossed, color: 'text-pink-400' },
  '🥤': { icon: Droplets, color: 'text-blue-400' },
  '🫒': { icon: Leaf, color: 'text-green-400' },
  '🧈': { icon: Droplets, color: 'text-yellow-400' },
  '🧅': { icon: Salad, color: 'text-amber-400' },
  '🧄': { icon: Salad, color: 'text-amber-400' },
  '🌶': { icon: Flame, color: 'text-red-400' },
  '🌶️': { icon: Flame, color: 'text-red-400' },
  '🫑': { icon: Leaf, color: 'text-green-400' },
  '🍋': { icon: Apple, color: 'text-yellow-400' },
  '🍅': { icon: Apple, color: 'text-red-400' },
  '🌽': { icon: Wheat, color: 'text-yellow-400' },
};

// Build a regex that matches any emoji key
const EMOJI_RE = new RegExp(
  '(' + Object.keys(EMOJI_ICON_MAP).map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')',
  'g',
);

function InlineIcon({ emoji }: { emoji: string }) {
  const entry = EMOJI_ICON_MAP[emoji];
  if (!entry) return <span>{emoji}</span>;
  const Icon = entry.icon;
  return <Icon className={cn('inline-block w-4 h-4 align-text-bottom mx-0.5', entry.color)} />;
}

// ── SuggestionIcon ────────────────────────────────────────────────────────────

function SuggestionIcon({ emoji }: { emoji?: string }) {
  if (!emoji) return null;
  const entry = EMOJI_ICON_MAP[emoji];
  if (entry) {
    const Icon = entry.icon;
    return <Icon className={cn('h-3.5 w-3.5 shrink-0', entry.color)} />;
  }
  return <span className="text-sm shrink-0">{emoji}</span>;
}

// ── FormattedText ─────────────────────────────────────────────────────────────

function FormattedText({ text }: { text: string }) {
  // Split by bold markers and emoji, render icons inline
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-extrabold text-foreground">{part.slice(2, -2)}</strong>;
        }
        // Split by newlines, then replace emoji within each line
        return part.split('\n').map((line, j) => (
          <span key={`${i}-${j}`}>
            {j > 0 && <br />}
            {replaceEmoji(line)}
          </span>
        ));
      })}
    </>
  );
}

/** Replace emoji in a line with inline Lucide icons */
function replaceEmoji(line: string): React.ReactNode[] {
  const segments = line.split(EMOJI_RE);
  return segments.map((seg, i) => {
    if (EMOJI_ICON_MAP[seg]) {
      return <InlineIcon key={i} emoji={seg} />;
    }
    return <span key={i}>{seg}</span>;
  });
}
