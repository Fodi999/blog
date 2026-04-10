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
import { useLocale, useTranslations } from 'next-intl';
import { 
  Send, RotateCcw, Sparkles, Bot, User, Target, Dumbbell, Zap, Leaf, 
  BookOpen, ClipboardList, RefreshCcw, Search, Database, Wrench, 
  Brain, Scale, Fish, FlaskConical, Calculator, Utensils, BarChart3, 
  Salad, Microscope, Trophy, ArrowRight
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { postChat, type ChatApiResponse, type SessionContext } from '@/lib/chef-chat-api';
import { ChatCardsGrid } from '@/components/chat/ChatCards';

// ── Tool Data ──────────────────────────────────────────────────────────

type ToolItem = {
  href: string;
  icon: any;
  key: string;
};

const QUICK_ACTIONS: ToolItem[] = [
  { href: '/chef-tools/recipe-analyzer',      icon: Calculator,    key: 'analyzeRecipe'    },
  { href: '/chef-tools/ingredients',          icon: Search,        key: 'checkIngredient'  },
  { href: '/chef-tools/converter',            icon: Scale,         key: 'convertUnits'     },
  { href: '/chef-tools/lab',                  icon: FlaskConical,  key: 'createRecipe'     },
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
  const t = useTranslations('chefTools');
  const copy = COPY[locale] ?? COPY.en;

  const [activeTab, setActiveTab] = useState<'chat' | 'database' | 'tools'>('chat');
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
      setTurns(prev => prev.map(t => t.id === id ? { ...t, error: 'Error' } : t));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, context]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(query);
    }
  };

  const isIdle = turns.length === 0 && !loading;
  const canSend = !loading && query.trim().length >= 2;

  return (
    <div className="flex flex-col min-h-[60vh] max-w-5xl mx-auto relative px-4">
      
      {/* ── Background Decorative Glows ── */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[30%] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow font-inter" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[40%] bg-primary/10 blur-[100px] rounded-full" />
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex items-center justify-center mb-6 sm:mb-8 pt-4">
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
              <span className={cn(activeTab === tab.id ? "block" : "hidden sm:block")}>{tab.label}</span>
              {activeTab === tab.id && <span className="sm:hidden">{tab.label}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CONTENT AREA
          ═══════════════════════════════════════════════════════ */}
      <div className="flex-1">
        {activeTab === 'chat' ? (
          <>
            {/* STATE 1: EMPTY — Premium AI centered welcome */}
            {isIdle && (
              <div className="flex-1 flex flex-col items-center justify-center py-12 sm:py-20 animate-in fade-in zoom-in-95 duration-1000">
                {/* Greeting Section */}
                <div className="text-center space-y-2 mb-8 sm:mb-16">
                  <h2 className="text-3xl sm:text-6xl font-bold tracking-tight text-foreground mb-1 leading-tight text-balance px-4">
                    {locale === 'ru' ? 'Привет, Шеф!' : locale === 'pl' ? 'Hej, Szefie!' : 'Hi there, Chef!'}
                  </h2>
                  <h3 className="text-xl sm:text-4xl font-medium tracking-tight text-muted-foreground/80 leading-snug text-balance px-4">
                    {locale === 'ru' ? 'Что бы вы хотели узнать?' : locale === 'pl' ? 'Czego chciałbyś się dowiedzieć?' : 'What would you like to know?'}
                  </h3>
                  <p className="text-[10px] sm:text-base text-muted-foreground/40 mt-4 sm:mt-6 font-medium uppercase tracking-widest">
                    {locale === 'ru' ? 'Используйте промпты ниже или введите свой' : 'Use one of the prompts below to begin'}
                  </p>
                </div>

                {/* Action Picker (Custom Prompt Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-8">
                  {QUICK_ACTIONS.map(({ href, icon: Icon, key: toolKey }) => (
                    <Link
                      key={href}
                      href={href}
                      locale={locale}
                      className={cn(
                        "flex flex-col items-start text-left p-6 rounded-2xl border transition-all duration-300 group",
                        "border-border/60 bg-muted/10 dark:bg-card/20 backdrop-blur-sm h-full",
                        "hover:border-primary/40 hover:bg-muted/20 dark:hover:bg-white/[0.03] hover:-translate-y-1 active:scale-95 shadow-lg",
                      )}
                    >
                      <p className="text-sm font-bold text-muted-foreground group-hover:text-white transition-colors mb-4 uppercase tracking-tight">
                        {t(`landing.actions.${toolKey}`)}
                      </p>
                      <p className="text-[10px] text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors mb-8 leading-relaxed font-medium uppercase tracking-widest">
                        {t(`landing.actions.${toolKey}Desc`)}
                      </p>
                      <div className="mt-auto flex items-center justify-between w-full">
                          <Icon className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                          <ArrowRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary translate-x-[-10px] group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Refresh Action */}
                <button 
                  onClick={() => {}} 
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  {locale === 'ru' ? 'Обновить промпты' : 'Refresh Prompts'}
                </button>
              </div>
            )}

            {/* STATE 2: ACTIVE — chat thread */}
            {!isIdle && (
              <div className="flex-1 pb-4 space-y-8 pt-0 px-1 sm:px-0">
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
          INPUT BAR — Premium "Compose" design
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'chat' && (
        <div className={cn(
          "sticky bottom-0 z-20 pt-4 sm:pt-8 pb-4 sm:pb-6 bg-gradient-to-t from-background via-background/95 to-transparent transition-all duration-500",
          isIdle ? "mt-4" : "mt-8"
        )}>
          <div className={cn(
            "relative rounded-[2rem] sm:rounded-[2.5rem] border transition-all duration-500 ease-out overflow-hidden font-inter",
            "bg-card border-border/60 shadow-2xl dark:bg-[#0a0a0a] dark:border-white/[0.08]",
            "focus-within:border-primary/30 focus-within:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] dark:focus-within:border-white/20",
            loading && "opacity-80 pointer-events-none"
          )}>
            {/* Top Row: Intelligence Pill (Optimized for mobile) */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
              <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-border/40 bg-muted/50 dark:bg-white/[0.02] hover:bg-muted dark:hover:bg-white/[0.05] transition-colors cursor-pointer group">
                  <Search className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground group-hover:text-foreground" />
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground">
                    <span className="hidden sm:inline">Pro Culinary DB</span>
                    <span className="sm:hidden">DB</span>
                  </span>
                  <Target className="w-2 sm:w-2.5 sm:h-2.5 text-muted-foreground/40 group-hover:text-foreground transition-transform group-hover:translate-y-0.5" />
              </div>
            </div>

            <textarea
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={locale === 'ru' ? "Спросите..." : "Ask..."}
              rows={1}
              disabled={loading}
              className={cn(
                "w-full resize-none bg-transparent px-5 sm:px-8 pt-7 sm:pt-8 pb-16 sm:pb-16",
                "text-base sm:text-lg font-medium text-foreground placeholder:text-muted-foreground/40",
                "focus:outline-none overflow-hidden transition-all"
              )}
            />

            {/* Bottom Action Row (Optimized for mobile) */}
            <div className="absolute bottom-4 sm:bottom-5 left-4 sm:left-8 right-4 sm:right-8 flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-6">
                  <button className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-foreground transition-all group">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-border/40 flex items-center justify-center group-hover:border-primary/40">
                          <User className="w-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <span className="hidden sm:inline">Add Attachment</span>
                      <span className="sm:hidden">Attach</span>
                  </button>
                  <button className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-foreground transition-all group">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-border/40 flex items-center justify-center group-hover:border-primary/40">
                          <Zap className="w-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <span className="hidden sm:inline">Use Image</span>
                      <span className="sm:hidden">Image</span>
                  </button>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                  <span className="hidden sm:inline text-[10px] font-bold tracking-widest text-muted-foreground/30">
                      {query.length}/1000
                  </span>
                  <button
                      onClick={() => submit(query)}
                      disabled={!canSend}
                      className={cn(
                          "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300",
                          canSend 
                              ? "bg-foreground text-background hover:scale-110 active:scale-95 shadow-lg shadow-foreground/10" 
                              : "bg-muted text-muted-foreground/30 cursor-not-allowed border border-border/40"
                      )}
                  >
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
              </div>
            </div>
          </div>
          
          {/* Footer info (mobile friendly) */}
          <div className="mt-4 text-center">
              {isIdle && (
                  <div className="mt-2 animate-in fade-in duration-1000 delay-500 fill-mode-both">
                      <p className="text-[10px] text-muted-foreground/10 font-black uppercase tracking-[0.5em]">
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

function TurnView({ turn, onSuggestion }: { turn: Turn; onSuggestion: (q: string) => void }) {
  const res = turn.response;
  const cards = res?.cards ?? [];
  const suggestions = res?.suggestions ?? [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 ease-out fill-mode-both">
      {/* ── User message ── */}
      <div className="flex items-start gap-3 sm:gap-4 justify-end">
        <div className={cn(
            "max-w-[90%] sm:max-w-[75%] px-5 sm:px-6 py-3 sm:py-4 rounded-[1.5rem] rounded-br-lg",
            "bg-[#ef4444] text-white text-sm sm:text-base font-semibold leading-relaxed shadow-lg shadow-primary/5"
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
            <span className="sm:hidden text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kitchen OS AI</span>
          </div>
          
          <div className="flex-1 space-y-4 w-full">
            {res?.text ? (
              <div className="max-w-full sm:max-w-[90%] rounded-[1.5rem] rounded-tl-lg bg-card/60 backdrop-blur-md border border-border/30 px-5 sm:px-6 py-4 text-sm sm:text-base leading-relaxed text-foreground shadow-sm">
                <FormattedText text={res.text} />
              </div>
            ) : (
                <div className="space-y-3 pt-3 w-full max-w-[80%]">
                    <div className="h-4 bg-muted/20 rounded-full w-full animate-pulse" />
                    <div className="h-4 bg-muted/10 rounded-full w-2/3 animate-pulse" />
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
